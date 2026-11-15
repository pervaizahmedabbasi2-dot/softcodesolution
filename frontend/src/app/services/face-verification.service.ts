import { Injectable } from '@angular/core';
import { FaceProfileRecord } from '../businesses/school_business/models/school-attendance.models';

export interface FaceExtractionResult {
  descriptor: number[];
  photoDataUrl: string;
  hash: string;
  qualityScore: number;
  brightness: number;
  sharpness: number;
  faceDetectedLikely: boolean;
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
  private readonly sampleSize = 64;
  private thumbCanvas: HTMLCanvasElement | null = null;
  private featCanvas: HTMLCanvasElement | null = null;
  private lumaCanvas: HTMLCanvasElement | null = null;

  extractFromVideo(
    videoEl: HTMLVideoElement,
    mirror: boolean = true,
    includePhotoThumbnail: boolean = true
  ): FaceExtractionResult | null {
    if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      return null;
    }

    const size = Math.min(videoEl.videoWidth, videoEl.videoHeight);
    const cropSize = Math.round(size * 0.72);
    const sx = Math.round((videoEl.videoWidth - cropSize) / 2);
    const sy = Math.round((videoEl.videoHeight - cropSize) / 2);

    return this.processDrawable(videoEl, sx, sy, cropSize, cropSize, mirror, includePhotoThumbnail);
  }

  captureThumbnailFromVideo(videoEl: HTMLVideoElement, mirror: boolean = true): string {
    if (typeof document === 'undefined' || !videoEl || videoEl.readyState < 2 || !videoEl.videoWidth || !videoEl.videoHeight) {
      return '';
    }
    const size = Math.min(videoEl.videoWidth, videoEl.videoHeight);
    const cropSize = Math.round(size * 0.72);
    const sx = Math.round((videoEl.videoWidth - cropSize) / 2);
    const sy = Math.round((videoEl.videoHeight - cropSize) / 2);

    const canvas = this.getThumbCanvas();
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return '';
    ctx.clearRect(0, 0, 200, 200);
    ctx.save();
    if (mirror) {
      ctx.translate(200, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, sx, sy, cropSize, cropSize, 0, 0, 200, 200);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  async extractFromImageDataUrl(dataUrl: string): Promise<FaceExtractionResult | null> {
    if (!dataUrl || typeof document === 'undefined') return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const side = Math.min(w, h);
        const cropSize = Math.round(side * 0.85);
        const sx = Math.round((w - cropSize) / 2);
        const sy = Math.round((h - cropSize) / 2);
        resolve(this.processDrawable(img, sx, sy, cropSize, cropSize, false, true));
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
    await new Promise((r) => setTimeout(r, 220));
    const frameB = this.sampleCenterLuma(videoEl);
    if (!frameB) return { passed: false, motionDelta: 0 };

    let diffSum = 0;
    for (let i = 0; i < frameA.length; i++) {
      diffSum += Math.abs(frameA[i] - frameB[i]);
    }
    const meanDiff = diffSum / frameA.length;
    // Live feeds exhibit slight sensor noise or natural head/eye micro-motion (> 0.15 intensity delta),
    // while frozen/blocked feeds have ~0 delta. Avoid rejecting steady tripod users unnecessarily (> 0.05).
    return { passed: meanDiff >= 0.05, motionDelta: Number(meanDiff.toFixed(2)) };
  }

  compareDescriptors(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
      return 0;
    }
    let dot = 0;
    let magA = 0;
    let magB = 0;
    let l1Diff = 0;
    for (let i = 0; i < a.length; i++) {
      const va = Number(a[i]) || 0;
      const vb = Number(b[i]) || 0;
      dot += va * vb;
      magA += va * va;
      magB += vb * vb;
      l1Diff += Math.abs(va - vb);
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot / denom));
    // Blend cosine similarity with inverse L1 distance for crisp discrimination
    const cosPct = Math.max(0, cos) * 100;
    const l1Score = Math.max(0, 100 - (l1Diff / a.length) * 320);
    return Math.round(cosPct * 0.72 + l1Score * 0.28);
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
      .map((profile) => ({
        profile,
        score: this.compareDescriptors(liveDescriptor, profile.faceDescriptor || [])
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    return {
      matched: best.score >= threshold,
      profile: best.score >= threshold ? best.profile : null,
      confidence: best.score,
      thresholdUsed: threshold,
      candidateScores: scored.slice(0, 5)
    };
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

  private getFeatCanvas(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    if (!this.featCanvas) {
      this.featCanvas = document.createElement('canvas');
      this.featCanvas.width = this.sampleSize;
      this.featCanvas.height = this.sampleSize;
    }
    return this.featCanvas;
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

  private processDrawable(
    source: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    mirror: boolean,
    includePhotoThumbnail: boolean = true
  ): FaceExtractionResult | null {
    if (typeof document === 'undefined') return null;

    // 1. Analyze 64x64 normalized grayscale & chroma grid directly from source (near 0ms per tick)
    const featCanvas = this.getFeatCanvas();
    const fCtx = featCanvas?.getContext('2d');
    if (!featCanvas || !fCtx) return null;
    fCtx.clearRect(0, 0, this.sampleSize, this.sampleSize);
    fCtx.save();
    if (mirror) {
      fCtx.translate(this.sampleSize, 0);
      fCtx.scale(-1, 1);
    }
    fCtx.drawImage(source, sx, sy, sw, sh, 0, 0, this.sampleSize, this.sampleSize);
    fCtx.restore();
    const pixels = fCtx.getImageData(0, 0, this.sampleSize, this.sampleSize).data;

    // 2. Encode JPEG thumbnail only when requested (skipped on high-FPS continuous polling ticks)
    let photoDataUrl = '';
    if (includePhotoThumbnail) {
      const thumbCanvas = this.getThumbCanvas();
      const tCtx = thumbCanvas?.getContext('2d');
      if (thumbCanvas && tCtx) {
        tCtx.clearRect(0, 0, 200, 200);
        tCtx.save();
        if (mirror) {
          tCtx.translate(200, 0);
          tCtx.scale(-1, 1);
        }
        tCtx.drawImage(source, sx, sy, sw, sh, 0, 0, 200, 200);
        tCtx.restore();
        photoDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);
      }
    }

    const n = this.sampleSize;
    const luma = new Float32Array(n * n);
    let totalLuma = 0;
    for (let i = 0; i < n * n; i++) {
      const idx = i * 4;
      const y = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
      luma[i] = y;
      totalLuma += y;
    }
    const meanLuma = totalLuma / (n * n);

    // Zero-mean lighting compensation so slight ambient light shifts remain robust
    let varSum = 0;
    for (let i = 0; i < luma.length; i++) {
      varSum += (luma[i] - meanLuma) ** 2;
    }
    const stdLuma = Math.max(12, Math.sqrt(varSum / luma.length));

    const descriptor: number[] = [];
    const blockSize = n / 4; // 16x16 per cell -> 4x4 = 16 cells

    let edgeEnergySum = 0;
    let centerContrastSum = 0;

    // 16 spatial normalized luma + 32 directional gradient energies = 48 dims
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        let cellMean = 0;
        let gxEnergy = 0;
        let gyEnergy = 0;
        let count = 0;

        for (let y = gy * blockSize; y < (gy + 1) * blockSize; y++) {
          for (let x = gx * blockSize; x < (gx + 1) * blockSize; x++) {
            const p = y * n + x;
            const normVal = (luma[p] - meanLuma) / stdLuma;
            cellMean += normVal;

            const right = x + 1 < n ? luma[y * n + (x + 1)] : luma[p];
            const down = y + 1 < n ? luma[(y + 1) * n + x] : luma[p];
            const dx = Math.abs(right - luma[p]) / stdLuma;
            const dy = Math.abs(down - luma[p]) / stdLuma;
            gxEnergy += dx;
            gyEnergy += dy;
            edgeEnergySum += dx + dy;
            if ((gx === 1 || gx === 2) && (gy === 1 || gy === 2)) {
              centerContrastSum += dx + dy;
            }
            count++;
          }
        }
        descriptor.push(cellMean / count);
        descriptor.push(gxEnergy / count);
        descriptor.push(gyEnergy / count);
      }
    }

    // 16 center T-zone chroma & RGB balance + 8 bilateral left-right symmetry dims = 24 dims (total 72)
    for (let gy = 1; gy <= 2; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        let rRatio = 0;
        let gRatio = 0;
        let symDiff = 0;
        let cCount = 0;
        for (let y = gy * blockSize; y < (gy + 1) * blockSize; y++) {
          for (let x = gx * blockSize; x < (gx + 1) * blockSize; x++) {
            const idx = (y * n + x) * 4;
            const sumRgb = Math.max(30, pixels[idx] + pixels[idx + 1] + pixels[idx + 2]);
            rRatio += pixels[idx] / sumRgb;
            gRatio += pixels[idx + 1] / sumRgb;

            const mirrorX = n - 1 - x;
            const mirrorDiff = Math.abs(luma[y * n + x] - luma[y * n + mirrorX]) / stdLuma;
            symDiff += mirrorDiff;
            cCount++;
          }
        }
        descriptor.push(rRatio / cCount);
        descriptor.push(gRatio / cCount);
        descriptor.push(1 - Math.min(1, symDiff / cCount));
      }
    }

    // L2 normalize entire 72-d vector
    let normSq = 0;
    for (const v of descriptor) normSq += v * v;
    const norm = Math.sqrt(normSq) || 1;
    const normalized = descriptor.map((v) => Number((v / norm).toFixed(5)));

    // Quality scoring (brightness window [38..225] and center edge sharpness)
    const brightness = Math.round((meanLuma / 255) * 100);
    const avgEdge = edgeEnergySum / (n * n);
    const sharpness = Math.min(100, Math.round(avgEdge * 145));
    const centerDetail = centerContrastSum / ((n * n) / 4);
    const faceDetectedLikely = meanLuma > 18 && meanLuma < 248 && centerDetail > 0.055;

    let qualityScore = 88;
    if (brightness < 18 || brightness > 92) qualityScore -= 18;
    if (sharpness < 22) qualityScore -= 20;
    else qualityScore += Math.min(11, Math.round(sharpness / 12));
    qualityScore = Math.max(40, Math.min(99, qualityScore));

    // Deterministic compact hash from descriptor
    let h1 = 2166136261;
    for (const v of normalized) {
      const q = Math.round((v + 1) * 1000);
      h1 ^= q;
      h1 = Math.imul(h1, 16777619);
    }
    const hash = 'FACE-' + (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');

    return {
      descriptor: normalized,
      photoDataUrl,
      hash,
      qualityScore,
      brightness,
      sharpness,
      faceDetectedLikely,
      reason: !faceDetectedLikely ? 'Low contrast or covered frame — ensure face is clearly centered with adequate light.' : undefined
    };
  }
}
