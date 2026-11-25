import { Injectable } from '@angular/core';
import {
  AttendanceMemberCategory,
  FingerprintProfileRecord,
  FingerprintScannerType
} from '../businesses/school_business/models/school-attendance.models';
import {
  base64UrlToArrayBuffer,
  bufferToBase64Url,
  buildRpEntity,
  checkPlatformBiometricAvailable,
  createBiometricPasskey,
  detectPasskeyDeviceLabel,
  getBiometricPasskeyAssertion,
  isPasskeyWebAuthnSupported,
  isSecurePasskeyOrigin
} from '../auth_security/passkey-webauthn.util';

export interface FingerprintSensorCapabilities {
  supported: boolean;
  secureContext: boolean;
  platformAvailable: boolean | null;
  deviceLabel: string;
  insideCrossOriginIframe: boolean;
}

export interface FingerprintCaptureResult {
  ok: boolean;
  scannerType: FingerprintScannerType;
  credentialId: string;
  publicKeySpki?: string;
  descriptor: number[];
  previewDataUrl: string;
  fingerprintHash: string;
  qualityScore: number;
  deviceLabel: string;
  reason?: string;
}

export interface FingerprintMatchResult {
  matched: boolean;
  profile: FingerprintProfileRecord | null;
  confidence: number;
  bestScore: number;
  scannerType: FingerprintScannerType;
  reason?: string;
}

export interface FingerprintMemberSeed {
  id: string;
  category: AttendanceMemberCategory;
  name: string;
  code: string;
  sectionOrDept: string;
}

@Injectable({
  providedIn: 'root'
})
export class FingerprintVerificationService {
  async probeSensorCapabilities(): Promise<FingerprintSensorCapabilities> {
    const supported = isPasskeyWebAuthnSupported();
    const secureContext = isSecurePasskeyOrigin();
    const platformAvailable = supported && secureContext ? await checkPlatformBiometricAvailable() : false;
    let insideCrossOriginIframe = false;
    try {
      insideCrossOriginIframe = typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      insideCrossOriginIframe = true;
    }
    return {
      supported,
      secureContext,
      platformAvailable,
      deviceLabel: detectPasskeyDeviceLabel(),
      insideCrossOriginIframe
    };
  }

  async enrollDeviceFingerprint(
    member: FingerprintMemberSeed,
    fingerLabel = 'Right Index'
  ): Promise<FingerprintCaptureResult> {
    const deviceLabel = detectPasskeyDeviceLabel();
    if (!isPasskeyWebAuthnSupported()) {
      return {
        ok: false,
        scannerType: 'device_webauthn',
        credentialId: '',
        descriptor: [],
        previewDataUrl: '',
        fingerprintHash: '',
        qualityScore: 0,
        deviceLabel,
        reason: 'Fingerprint sensor is unavailable on this browser. Use a device with a fingerprint sensor or switch to Face Camera.'
      };
    }
    if (!isSecurePasskeyOrigin()) {
      return {
        ok: false,
        scannerType: 'device_webauthn',
        credentialId: '',
        descriptor: [],
        previewDataUrl: '',
        fingerprintHash: '',
        qualityScore: 0,
        deviceLabel,
        reason: 'Device fingerprint sensor requires HTTPS or localhost.'
      };
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const uniqueSeed = `school:${member.category}:${member.id}:${fingerLabel}:${Date.now()}`;
      const userIdBytes = new TextEncoder().encode(uniqueSeed).slice(0, 64);

      const credential = await createBiometricPasskey(
        {
          challenge,
          rp: buildRpEntity('SoftCodeSolution School Attendance'),
          user: {
            id: userIdBytes,
            name: `${member.code || member.id}@school.biometric`,
            displayName: `${member.name} (${fingerLabel})`
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          timeout: 45000,
          attestation: 'none'
        },
        { preferResidentKey: false }
      );

      if (!credential) {
        return {
          ok: false,
          scannerType: 'device_webauthn',
          credentialId: '',
          descriptor: [],
          previewDataUrl: '',
          fingerprintHash: '',
          qualityScore: 0,
          deviceLabel,
          reason: 'Fingerprint sensor prompt was cancelled or returned no credential.'
        };
      }

      const credentialId = credential.id || bufferToBase64Url(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse | undefined;
      let publicKeySpki = '';
      if (response && typeof response.getPublicKey === 'function') {
        const spkiBuf = response.getPublicKey();
        if (spkiBuf) {
          publicKeySpki = bufferToBase64Url(spkiBuf);
        }
      }

      const descriptor = this.deriveDescriptorFromCredential(credentialId, publicKeySpki);
      const fingerprintHash = this.computeFingerprintHash(credentialId, descriptor, 'FP-BIO');
      const previewDataUrl = this.renderBiometricSealSvg(member.name, fingerLabel, fingerprintHash);

      return {
        ok: true,
        scannerType: 'device_webauthn',
        credentialId,
        publicKeySpki,
        descriptor,
        previewDataUrl,
        fingerprintHash,
        qualityScore: 98,
        deviceLabel
      };
    } catch (err: unknown) {
      const name = String((err as { name?: string })?.name || '');
      const message = String((err as { message?: string })?.message || '');
      const insideIframe = (() => {
        try {
          return typeof window !== 'undefined' && window.self !== window.top;
        } catch {
          return true;
        }
      })();
      let reason = message || 'Biometric fingerprint capture failed.';
      if (insideIframe && (name === 'NotAllowedError' || name === 'SecurityError')) {
        reason =
          'Mobile OS fingerprint sensor cannot open inside an embedded preview frame. Open the app directly in Chrome/Safari to use your phone fingerprint sensor, or use Face Camera.';
      } else if (name === 'NotAllowedError') {
        reason = 'Fingerprint sensor scan was cancelled or unavailable on this device. Try again or use Face Camera.';
      } else if (name === 'SecurityError') {
        reason = 'Browser blocked the fingerprint sensor here. Open the app directly in Chrome/Safari, or use Face Camera.';
      } else if (name === 'InvalidStateError') {
        reason = 'This finger credential is already registered on this device sensor.';
      }
      return {
        ok: false,
        scannerType: 'device_webauthn',
        credentialId: '',
        descriptor: [],
        previewDataUrl: '',
        fingerprintHash: '',
        qualityScore: 0,
        deviceLabel,
        reason
      };
    }
  }

  async verifyDeviceFingerprint(
    enrolledProfiles: FingerprintProfileRecord[],
    targetMemberId?: string
  ): Promise<FingerprintMatchResult> {
    const webauthnProfiles = enrolledProfiles.filter(
      (p) => (p.scannerType === 'device_webauthn' || !p.scannerType) && Boolean(p.credentialId)
    );
    const scoped = targetMemberId
      ? webauthnProfiles.filter((p) => p.memberId === targetMemberId)
      : webauthnProfiles;

    if (!scoped.length) {
      return {
        matched: false,
        profile: null,
        confidence: 0,
        bestScore: 0,
        scannerType: 'device_webauthn',
        reason: targetMemberId
          ? 'Selected member has no fingerprint enrolled on this device.'
          : 'No fingerprints enrolled in this category yet.'
      };
    }

    if (!isPasskeyWebAuthnSupported() || !isSecurePasskeyOrigin()) {
      return {
        matched: false,
        profile: null,
        confidence: 0,
        bestScore: 0,
        scannerType: 'device_webauthn',
        reason: 'Fingerprint sensor is unavailable in this browser context. Use a supported HTTPS device or Face Camera.'
      };
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const allowCredentials: PublicKeyCredentialDescriptor[] = [];
      for (const p of scoped.slice(0, 64)) {
        try {
          if (!p.credentialId) continue;
          const idBuf = base64UrlToArrayBuffer(p.credentialId);
          if (idBuf.byteLength > 0) {
            allowCredentials.push({ type: 'public-key', id: idBuf });
          }
        } catch {
          // Skip malformed legacy credential IDs
        }
      }
      if (!allowCredentials.length) {
        return {
          matched: false,
          profile: null,
          confidence: 0,
          bestScore: 0,
          scannerType: 'device_webauthn',
          reason: 'No valid device fingerprint credentials found. Re-enroll the finger or use Face Camera.'
        };
      }

      const assertion = await getBiometricPasskeyAssertion({
        challenge,
        rpId: buildRpEntity('SoftCodeSolution School Attendance').id,
        allowCredentials,
        timeout: 45000
      });

      if (!assertion) {
        return {
          matched: false,
          profile: null,
          confidence: 0,
          bestScore: 0,
          scannerType: 'device_webauthn',
          reason: 'Fingerprint sensor prompt cancelled.'
        };
      }

      const assertedId = assertion.id || bufferToBase64Url(assertion.rawId);
      const matchedProfile =
        scoped.find((p) => p.credentialId === assertedId) ||
        scoped.find((p) => bufferToBase64Url(base64UrlToArrayBuffer(p.credentialId)) === assertedId) ||
        null;

      if (!matchedProfile) {
        return {
          matched: false,
          profile: null,
          confidence: 0,
          bestScore: 0,
          scannerType: 'device_webauthn',
          reason: 'Scanned finger did not match any enrolled member profile.'
        };
      }

      return {
        matched: true,
        profile: matchedProfile,
        confidence: 99,
        bestScore: 99,
        scannerType: 'device_webauthn'
      };
    } catch (err: unknown) {
      const name = String((err as { name?: string })?.name || '');
      const insideIframe = (() => {
        try {
          return typeof window !== 'undefined' && window.self !== window.top;
        } catch {
          return true;
        }
      })();
      let reason = String((err as { message?: string })?.message || 'Device fingerprint verification failed.');
      if (insideIframe && (name === 'NotAllowedError' || name === 'SecurityError')) {
        reason =
          'Mobile OS fingerprint sensor cannot open inside an embedded preview frame. Open the app directly in Chrome/Safari to scan your phone fingerprint, or use Face Camera.';
      } else if (name === 'NotAllowedError') {
        reason = 'Fingerprint scan was cancelled or did not match any enrolled finger on this device.';
      }
      return {
        matched: false,
        profile: null,
        confidence: 0,
        bestScore: 0,
        scannerType: 'device_webauthn',
        reason
      };
    }
  }

  private deriveDescriptorFromCredential(credentialId: string, publicKeySpki: string): number[] {
    const source = `${credentialId}|${publicKeySpki || 'webauthn'}`;
    const raw: number[] = [];
    for (let i = 0; i < 64; i++) {
      const ch = source.charCodeAt(i % source.length);
      const val = Math.sin((ch + 1) * (i + 3) * 0.37) + Math.cos((ch + i) * 0.19);
      raw.push(Number(val.toFixed(5)));
    }
    return this.normalizeVector(raw);
  }

  private normalizeVector(vec: number[]): number[] {
    let sumSq = 0;
    for (const v of vec) sumSq += v * v;
    const norm = Math.sqrt(sumSq) || 1;
    return vec.map((v) => Number((v / norm).toFixed(5)));
  }

  private computeFingerprintHash(seed: string, descriptor: number[], prefix: string): string {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let i = 0; i < descriptor.length; i++) {
      const scaled = Math.round(descriptor[i] * 10000);
      hash ^= scaled & 0xff;
      hash = Math.imul(hash, 16777619);
    }
    return `${prefix}-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }

  private renderBiometricSealSvg(memberName: string, fingerLabel: string, fpHash: string): string {
    const safeName = String(memberName || 'Member').replace(/[<>&"']/g, '').slice(0, 18);
    const safeFinger = String(fingerLabel || 'Right Index').replace(/[<>&"']/g, '').slice(0, 16);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="18" fill="#0f172a"/>
      <circle cx="80" cy="68" r="34" fill="none" stroke="#10b981" stroke-width="2.5" stroke-dasharray="10 5"/>
      <circle cx="80" cy="68" r="24" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="7 4"/>
      <circle cx="80" cy="68" r="14" fill="none" stroke="#6ee7b7" stroke-width="2"/>
      <path d="M80 54 v28 M69 68 q11 -16 22 0" fill="none" stroke="#a7f3d0" stroke-width="2" stroke-linecap="round"/>
      <text x="80" y="120" text-anchor="middle" fill="#ecfdf5" font-family="sans-serif" font-size="11" font-weight="700">${safeName}</text>
      <text x="80" y="136" text-anchor="middle" fill="#6ee7b7" font-family="monospace" font-size="9">${safeFinger} · ${fpHash.slice(-6)}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}
