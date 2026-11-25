export function isPasskeyWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.credentials?.create || navigator.credentials?.get)
  );
}

export function isIpHostname(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');
}

export function isSecurePasskeyOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.isSecureContext) return true;
  const host = window.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1';
}

export function detectPasskeyDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'My Device Passkey';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android Fingerprint Passkey';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone / iPad Biometric';
  if (/Mac/i.test(ua)) return 'MacBook Touch ID';
  if (/Windows/i.test(ua)) return 'Windows Hello Biometric';
  return 'Device Passkey';
}

export async function checkPlatformBiometricAvailable(): Promise<boolean | null> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    // Ignore capability probe failures on restricted runtimes
  }
  return null;
}

export function base64UrlToArrayBuffer(b64u: string): ArrayBuffer {
  const clean = String(b64u || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (clean.length % 4)) % 4;
  const base64 = clean + '='.repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildRpEntity(rpName = 'SoftCodeSolution'): PublicKeyCredentialRpEntity {
  const rp: PublicKeyCredentialRpEntity = { name: rpName || 'SoftCodeSolution' };
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname || '';
    if (hostname && !isIpHostname(hostname)) {
      rp.id = hostname;
    }
  }
  return rp;
}

function isFallbackEligibleError(err: unknown): boolean {
  const name = String((err as { name?: string })?.name || '');
  return name === 'ConstraintError' || name === 'NotSupportedError' || name === 'TypeError';
}

export async function createBiometricPasskey(
  basePublicKey: PublicKeyCredentialCreationOptions,
  options?: { preferResidentKey?: boolean }
): Promise<PublicKeyCredential | null> {
  const preferResident = options?.preferResidentKey !== false;

  if (preferResident) {
    const strictWithHints = {
      ...basePublicKey,
      authenticatorSelection: {
        authenticatorAttachment: 'platform' as const,
        residentKey: 'required' as const,
        requireResidentKey: true,
        userVerification: 'required' as const
      },
      hints: ['client-device']
    } as PublicKeyCredentialCreationOptions;

    try {
      return (await navigator.credentials.create({
        publicKey: strictWithHints
      })) as PublicKeyCredential | null;
    } catch (err1) {
      if (!isFallbackEligibleError(err1)) throw err1;
    }
  }

  try {
    return (await navigator.credentials.create({
      publicKey: {
        ...basePublicKey,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'preferred',
          userVerification: 'required'
        }
      }
    })) as PublicKeyCredential | null;
  } catch (err2) {
    if (!isFallbackEligibleError(err2)) throw err2;
  }

  try {
    return (await navigator.credentials.create({
      publicKey: {
        ...basePublicKey,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'preferred',
          userVerification: 'preferred'
        }
      }
    })) as PublicKeyCredential | null;
  } catch (err3) {
    if (!isFallbackEligibleError(err3)) throw err3;
  }

  return (await navigator.credentials.create({
    publicKey: {
      ...basePublicKey,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    }
  })) as PublicKeyCredential | null;
}

export async function getBiometricPasskeyAssertion(
  basePublicKey: PublicKeyCredentialRequestOptions
): Promise<PublicKeyCredential | null> {
  const strictWithHints = {
    ...basePublicKey,
    userVerification: 'required' as const,
    hints: ['client-device']
  } as PublicKeyCredentialRequestOptions;

  try {
    return (await navigator.credentials.get({
      publicKey: strictWithHints
    })) as PublicKeyCredential | null;
  } catch (err1) {
    if (!isFallbackEligibleError(err1)) throw err1;
  }

  try {
    return (await navigator.credentials.get({
      publicKey: {
        ...basePublicKey,
        userVerification: 'required'
      }
    })) as PublicKeyCredential | null;
  } catch (err2) {
    if (!isFallbackEligibleError(err2)) throw err2;
  }

  return (await navigator.credentials.get({
    publicKey: {
      ...basePublicKey,
      userVerification: 'preferred'
    }
  })) as PublicKeyCredential | null;
}
