import { Injectable, signal } from '@angular/core';
import { FaceProfileRecord } from '../businesses/school_business/models/school-attendance.models';

export interface FaceBoxNormalized {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FaceExtractionResult {
  descriptor: number[];
  photoDataUrl: string;
  hash: string;
  qualityScore: number;
  brightness: number;
  sharpness: number;
  faceDetectedLikely: boolean;
  faceUnclear?: boolean;
  faceBox?: FaceBoxNormalized | null;
  detectedCount?: number;
  reason?: string;
}

export interface FaceMatchResult {
  matched: boolean;
  profile: FaceProfileRecord | null;
  confidence: number;
  thresholdUsed: number;
  candidateScores: Array<{ profile: FaceProfileRecord; score: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class FaceVerificationService {
  readonly neuralReady = signal<boolean>(false);
  readonly neuralLoading = signal<boolean>(false);
  readonly neuralError = signal<string>('');

  private faceapiMod: any = null;
  private modelLoadPromise: Promise<boolean> | null = null;
  private thumbCanvas: HTMLCanvasElement | null = null;
  private lumaCanvas: HTMLCanvasElement | null = null;
  private readonly upgradedDescriptors = new Map<string, number[]>();
  private upgradingInProgress = false;

  /**
   * Loads local offline neural weights from /face-models/ once per session.
   * Zero external network calls or cloud dependencies.
   */
  async ensureModelsLoaded(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    if (this.neuralReady() && this.faceapiMod) {
      return true;
    }
    if (this.modelLoadPromise) {
      return this.modelLoadPromise;
    }

    this.neuralLoading.set(true);
    this.neuralError.set('');

    this.modelLoadPromise = (async () => {
      try {
        const mod = await import('@vladmandic/face-api');
        this.faceapiMod = mod;

        const modelPath = '/face-models';
        await Promise.all([
          mod.nets.tinyFaceDetector.loadFromUri(modelPath),
          mod.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
          mod.nets.faceRecognitionNet.loadFromUri(modelPath)
        ]);

        this.neuralReady.set(true);
        this.neuralError.set('');
        return true;
      } catch (err: any) {
        const msg = String(err?.message || 'Offline face AI initialization failed.');
        this.neuralError.set(msg);
        this.neuralReady.set(false);
        this.modelLoadPromise = null;
        return false;
      } finally {
        this.neuralLoading.set(false);
      }
    })();

    return this.modelLoadPromise;
  }

  /**
   * Automatically upgrades any previously enrolled profiles that have a stored photo
   * but legacy non-128D descriptors so they match accurately with the neural engine.
   */
  async upgradeLegacyProfiles(profiles: FaceProfileRecord[]): Promise<void> {
    if (this.upgradingInProgress || typeof window === 'undefined') return;
    const needUpgrade = (profiles || []).filter(
      (p) =>
        p.facePhotoData &&
        (!Array.isArray(p.faceDescriptor) || p.faceDescriptor.length !== 128) &&
        !this.upgradedDescriptors.has(p.id)
    );
    if (needUpgrade.length === 0) return;

    const ok = await this.ensureModelsLoaded();
    if (!ok) return;

    this.upgradingInProgress = true;
    try {
      for (const prof of needUpgrade) {
        try {
          const res = await this.extractFromImageDataUrl(prof.facePhotoData);
          if (res?.faceDetectedLikely && res.descriptor.length === 128) {
            this.upgradedDescriptors.set(prof.id, res.descriptor);
          }
        } catch {
          // Skip unreadable legacy photo gracefully
        }
      }
    } finally {
      this.upgradingInProgress = false;
    }
  }

  /**
   * Real-time neural face detection + 128-D embedding extraction on a live <video> element.
   * Picks the closest/largest human face cleanly and ignores walls/empty backgrounds.
   * When includePhotoThumbnail is false (live gate scanning), ZERO JPEG photo is captured.
   */
  async extractFromVideoAsync(
    videoEl: HTMLVideoElement,
    mirror: boolean = true,
    includePhotoThumbnail: boolean = false
  ): Promise<FaceExtractionResult | null> {
    if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      return null;
    }

    const ready = await this.ensureModelsLoaded();
    if (!ready || !this.faceapiMod) {
      return {
        descriptor: [],
        photoDataUrl: '',
        hash: '',
        qualityScore: 0,
        brightness: 50,
        sharpness: 0,
        faceDetectedLikely: false,
        faceBox: null,
        detectedCount: 0,
        reason: this.neuralError() || 'Loading offline face recognition engine...'
      };
    }

    const faceapi = this.faceapiMod;
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 256,
        scoreThreshold: 0.28
      });

      const detections = await faceapi
        .detectAllFaces(videoEl, options)
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      if (!Array.isArray(detections) || detections.length === 0) {
        return {
          descriptor: [],
          photoDataUrl: '',
          hash: '',
          qualityScore: 0,
          brightness: 50,
          sharpness: 0,
          faceDetectedLikely: false,
          faceUnclear: false,
          faceBox: null,
          detectedCount: 0,
          reason: 'No face detected — step in front of the camera.'
        };
      }

      // Select single closest / largest human face in frame (1-at-a-time gate flow)
      let primary = detections[0];
      let bestArea = 0;
      for (const det of detections) {
        const b = det?.detection?.box;
        if (!b) continue;
        const area = Number(b.width || 0) * Number(b.height || 0);
        if (area > bestArea) {
          bestArea = area;
          primary = det;
        }
      }

      const box = primary.detection.box;
      const score = Number(primary.detection.score || 0.85);
      const descriptor = Array.from(primary.descriptor as Float32Array).map((v) => Number(v.toFixed(6)));

      // Pad slightly for visual reticle and optional enrollment crop
      const padW = box.width * 0.16;
      const padH = box.height * 0.18;
      const rx = Math.max(0, box.x - padW / 2);
      const ry = Math.max(0, box.y - padH / 2);
      const rw = Math.min(vw - rx, box.width + padW);
      const rh = Math.min(vh - ry, box.height + padH);

      const normalizedBox: FaceBoxNormalized = {
        x: Math.max(0, Math.min(1, mirror ? 1 - (rx + rw) / vw : rx / vw)),
        y: Math.max(0, Math.min(1, ry / vh)),
        w: Math.max(0.08, Math.min(1, rw / vw)),
        h: Math.max(0.08, Math.min(1, rh / vh))
      };

      const brightness = this.estimateRegionBrightness(videoEl, rx, ry, rw, rh);
      const boxWidthRatio = box.width / vw;
      const boxHeightRatio = box.height / vh;

      let unclearReason = '';
      if (brightness < 16) {
        unclearReason = 'Face too dark — step into brighter light or turn toward screen.';
      } else if (brightness > 96) {
        unclearReason = 'Too much glare/backlight — avoid bright light behind you.';
      } else if (boxWidthRatio < 0.12 || boxHeightRatio < 0.14) {
        unclearReason = 'Face too far — move closer to the camera.';
      } else if (score < 0.40) {
        unclearReason = 'Face not clear — hold steady and look straight at the camera.';
      }

      if (unclearReason) {
        return {
          descriptor: [],
          photoDataUrl: '',
          hash: '',
          qualityScore: Math.round(score * 50),
          brightness,
          sharpness: Math.round(score * 100),
          faceDetectedLikely: false,
          faceUnclear: true,
          faceBox: normalizedBox,
          detectedCount: detections.length,
          reason: unclearReason
        };
      }

      const qualityScore = Math.max(60, Math.min(99, Math.round(score * 75 + (brightness >= 22 && brightness <= 90 ? 22 : 10))));

      let photoDataUrl = '';
      if (includePhotoThumbnail) {
        photoDataUrl = this.captureCroppedThumbnail(videoEl, rx, ry, rw, rh, mirror);
      }

      return {
        descriptor,
        photoDataUrl,
        hash: this.computeHash(descriptor),
        qualityScore,
        brightness,
        sharpness: Math.round(score * 100),
        faceDetectedLikely: true,
        faceUnclear: false,
        faceBox: normalizedBox,
        detectedCount: detections.length
      };
    } catch {
      return {
        descriptor: [],
        photoDataUrl: '',
        hash: '',
        qualityScore: 0,
        brightness: 50,
        sharpness: 0,
        faceDetectedLikely: false,
        faceBox: null,
        detectedCount: 0,
        reason: 'Unable to analyze camera frame.'
      };
    }
  }

  captureThumbnailFromVideo(videoEl: HTMLVideoElement, mirror: boolean = true): string {
    if (typeof document === 'undefined' || !videoEl || videoEl.readyState < 2 || !videoEl.videoWidth || !videoEl.videoHeight) {
      return '';
    }
    const size = Math.min(videoEl.videoWidth, videoEl.videoHeight);
    const cropSize = Math.round(size * 0.72);
    const sx = Math.round((videoEl.videoWidth - cropSize) / 2);
    const sy = Math.round((videoEl.videoHeight - cropSize) / 2);
    return this.captureCroppedThumbnail(videoEl, sx, sy, cropSize, cropSize, mirror);
  }

  async extractFromImageDataUrl(dataUrl: string): Promise<FaceExtractionResult | null> {
    if (!dataUrl || typeof document === 'undefined') return null;
    const ready = await this.ensureModelsLoaded();
    if (!ready || !this.faceapiMod) return null;

    const faceapi = this.faceapiMod;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) {
            resolve(null);
            return;
          }

          let det = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
            .withFaceLandmarks(true)
            .withFaceDescriptor();

          if (!det) {
            det = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.22 }))
              .withFaceLandmarks(true)
              .withFaceDescriptor();
          }

          if (!det) {
            resolve(null);
            return;
          }

          const box = det.detection.box;
          const score = Number(det.detection.score || 0.85);
          const descriptor = Array.from(det.descriptor as Float32Array).map((v) => Number(v.toFixed(6)));
          const pad = Math.max(box.width, box.height) * 0.25;
          const side = Math.min(Math.max(w, h), Math.max(box.width, box.height) + pad);
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          const sx = Math.max(0, Math.min(w - Math.min(w, side), cx - side / 2));
          const sy = Math.max(0, Math.min(h - Math.min(h, side), cy - side / 2));
          const cw = Math.min(w - sx, side);
          const ch = Math.min(h - sy, side);

          const photoDataUrl = this.captureCroppedThumbnail(img, sx, sy, cw, ch, false);
          const brightness = this.estimateRegionBrightness(img, sx, sy, cw, ch);

          resolve({
            descriptor,
            photoDataUrl,
            hash: this.computeHash(descriptor),
            qualityScore: Math.max(65, Math.min(99, Math.round(score * 75 + 22))),
            brightness,
            sharpness: Math.round(score * 100),
            faceDetectedLikely: true,
            faceBox: {
              x: box.x / w,
              y: box.y / h,
              w: box.width / w,
              h: box.height / h
            },
            detectedCount: 1
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async extractFromFile(file: File): Promise<{ result: FaceExtractionResult | null; rawDataUrl: string }> {
    const rawDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target?.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
    if (!rawDataUrl) return { result: null, rawDataUrl: '' };
    const result = await this.extractFromImageDataUrl(rawDataUrl);
    return { result, rawDataUrl };
  }

  async checkVideoLiveness(videoEl: HTMLVideoElement): Promise<{ passed: boolean; motionDelta: number }> {
    const frameA = this.sampleCenterLuma(videoEl);
    if (!frameA) return { passed: false, motionDelta: 0 };
    await new Promise((r) => setTimeout(r, 180));
    const frameB = this.sampleCenterLuma(videoEl);
    if (!frameB) return { passed: false, motionDelta: 0 };

    let diffSum = 0;
    for (let i = 0; i < frameA.length; i++) {
      diffSum += Math.abs(frameA[i] - frameB[i]);
    }
    const meanDiff = diffSum / frameA.length;
    return { passed: meanDiff >= 0.04, motionDelta: Number(meanDiff.toFixed(2)) };
  }

  /**
   * Computes calibrated similarity % (0..100) from 128-D Euclidean face distance:
   * - d <= 0.50 (same person) => 76% - 100%
   * - d = 0.51..0.57 (same person, tough angle) => 67% - 75%
   * - d >= 0.59 (stranger) => <= 65% (cleanly rejected)
   */
  compareDescriptors(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
      return 0;
    }
    let sqDist = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = (Number(a[i]) || 0) - (Number(b[i]) || 0);
      sqDist += diff * diff;
    }
    const euclidean = Math.sqrt(sqDist);
    const similarity = Math.round(138 - euclidean * 124);
    return Math.max(0, Math.min(100, similarity));
  }

  matchAgainstProfiles(
    liveDescriptor: number[],
    profiles: FaceProfileRecord[],
    threshold: number,
    targetMemberId?: string
  ): FaceMatchResult {
    const candidates = targetMemberId
      ? profiles.filter((p) => p.memberId === targetMemberId)
      : profiles;

    if (!candidates.length || !liveDescriptor.length) {
      return { matched: false, profile: null, confidence: 0, thresholdUsed: threshold, candidateScores: [] };
    }

    const scored = candidates
      .map((profile) => {
        const effectiveDesc = this.upgradedDescriptors.get(profile.id) || profile.faceDescriptor || [];
        return {
          profile,
          score: this.compareDescriptors(liveDescriptor, effectiveDesc)
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const second = scored[1];
    const clearWinner = !second || best.score - second.score >= 4 || best.score >= 82;
    const isMatched = best.score >= threshold && clearWinner;

    return {
      matched: isMatched,
      profile: isMatched ? best.profile : null,
      confidence: best.score,
      thresholdUsed: threshold,
      candidateScores: scored.slice(0, 5)
    };
  }

  private captureCroppedThumbnail(
    source: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    mirror: boolean
  ): string {
    if (typeof document === 'undefined' || sw <= 0 || sh <= 0) return '';
    const canvas = this.getThumbCanvas();
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return '';
    ctx.clearRect(0, 0, 200, 200);
    ctx.save();
    if (mirror) {
      ctx.translate(200, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, 200, 200);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.84);
  }

  private estimateRegionBrightness(source: CanvasImageSource, sx: number, sy: number, sw: number, sh: number): number {
    if (typeof document === 'undefined' || sw <= 0 || sh <= 0) return 60;
    if (!this.lumaCanvas) {
      this.lumaCanvas = document.createElement('canvas');
      this.lumaCanvas.width = 32;
      this.lumaCanvas.height = 32;
    }
    const ctx = this.lumaCanvas.getContext('2d');
    if (!ctx) return 60;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    let sum = 0;
    const total = 32 * 32;
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      sum += data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }
    return Math.round((sum / total / 255) * 100);
  }

  private getThumbCanvas(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    if (!this.thumbCanvas) {
      this.thumbCanvas = document.createElement('canvas');
      this.thumbCanvas.width = 200;
      this.thumbCanvas.height = 200;
    }
    return this.thumbCanvas;
  }

  private sampleCenterLuma(videoEl: HTMLVideoElement): Float32Array | null {
    if (!videoEl || videoEl.readyState < 2 || typeof document === 'undefined') return null;
    if (!this.lumaCanvas) {
      this.lumaCanvas = document.createElement('canvas');
      this.lumaCanvas.width = 32;
      this.lumaCanvas.height = 32;
    }
    const ctx = this.lumaCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    const out = new Float32Array(32 * 32);
    for (let i = 0; i < out.length; i++) {
      const idx = i * 4;
      out[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }
    return out;
  }

  private computeHash(descriptor: number[]): string {
    let h1 = 2166136261;
    for (const v of descriptor) {
      const q = Math.round((v + 1) * 1000);
      h1 ^= q;
      h1 = Math.imul(h1, 16777619);
    }
    return 'FACE-' + (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }
}
