import {
  ImageEnhancementPreset,
  ImageEnhancementOptions,
  ImageEnhancementMetadata,
} from '../types';

export interface EnhanceImageResult {
  success: boolean;
  status: 'complete' | 'unconfigured' | 'failed' | 'timeout';
  resultUrl?: string;
  originalUrl: string;
  operationsApplied?: string[];
  preset?: ImageEnhancementPreset;
  error?: string;
  jobId?: string;
}

export interface PresetInfo {
  id: ImageEnhancementPreset;
  title: string;
  subtitle: string;
  description: string;
  defaultOptions: ImageEnhancementOptions;
  badge: string;
}

export const PRESET_CONFIGS: Record<ImageEnhancementPreset, PresetInfo> = {
  auto: {
    id: 'auto',
    title: 'Auto Balanced',
    subtitle: 'Everyday lighting & clarity',
    description: 'Fixes dark spots, enhances natural colors, and removes slight hand tremor blur while strictly preserving authentic tribal patterns.',
    badge: 'Recommended',
    defaultOptions: {
      light: true,
      color: true,
      denoise: true,
      deblur: true,
      upscale: '2x',
    },
  },
  product: {
    id: 'product',
    title: 'Product Studio',
    subtitle: 'E-commerce marketplace grade',
    description: 'Brings out rich weave textures, metal casting highlights, and provides a 2x crisp resolution boost for buyer marketplaces.',
    badge: 'Marketplace',
    defaultOptions: {
      light: true,
      color: true,
      deblur: true,
      denoise: true,
      upscale: '2x',
    },
  },
  catalog: {
    id: 'catalog',
    title: 'Smart Catalog Vision',
    subtitle: 'Optimized for AI feature detection',
    description: 'Maximizes high-contrast edge definition and suppresses camera noise to assist AI in accurately reading motifs, weaves, and materials.',
    badge: 'AI Vision',
    defaultOptions: {
      light: true,
      color: false,
      deblur: true,
      denoise: true,
      upscale: 'none',
    },
  },
  custom: {
    id: 'custom',
    title: 'Custom Controls',
    subtitle: 'Manual adjustment toggles',
    description: 'Manually select which enhancements to apply: light correction, color boosting, deblurring, denoising, or 2x/4x upscaling.',
    badge: 'Advanced',
    defaultOptions: {
      light: true,
      color: true,
      denoise: false,
      deblur: false,
      upscale: 'none',
    },
  },
};

export class DeepImageService {
  /**
   * Calls the server proxy to enhance an image via Deep Image AI
   */
  static async enhanceImage(
    imageUrl: string,
    preset: ImageEnhancementPreset = 'auto',
    customOptions?: ImageEnhancementOptions,
    onProgress?: (statusText: string) => void
  ): Promise<EnhanceImageResult> {
    onProgress?.('Connecting to Deep Image AI enhancement pipeline...');

    try {
      const response = await fetch('/api/enhance-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl,
          preset,
          options: customOptions || PRESET_CONFIGS[preset].defaultOptions,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!data) {
        return {
          success: false,
          status: 'failed',
          originalUrl: imageUrl,
          error: 'Empty response from enhancement server proxy',
        };
      }

      if (data.status === 'unconfigured') {
        return {
          success: false,
          status: 'unconfigured',
          originalUrl: imageUrl,
          error: data.error || 'Deep Image AI API key is not configured.',
        };
      }

      if (!data.success && data.status === 'failed') {
        return {
          success: false,
          status: 'failed',
          originalUrl: imageUrl,
          error: data.error || 'Deep Image AI processing failed',
        };
      }

      // Synchronous immediate return
      if (data.status === 'complete' && data.resultUrl) {
        onProgress?.('Enhancement complete!');
        return {
          success: true,
          status: 'complete',
          originalUrl: imageUrl,
          resultUrl: data.resultUrl,
          operationsApplied: data.operationsApplied || ['light', 'color', 'deblur', 'denoise'],
          preset,
        };
      }

      // Asynchronous queued job: poll until completion
      if (data.status === 'in_progress' && data.jobId) {
        onProgress?.('AI neural network processing image in background...');
        return await this.pollJobStatus(data.jobId, imageUrl, preset, onProgress);
      }

      return {
        success: false,
        status: 'failed',
        originalUrl: imageUrl,
        error: data.error || 'Unexpected response status from Deep Image AI',
      };
    } catch (err) {
      console.error('DeepImageService.enhanceImage Error:', err);
      return {
        success: false,
        status: 'failed',
        originalUrl: imageUrl,
        error: err instanceof Error ? err.message : 'Network error communicating with enhancement service',
      };
    }
  }

  /**
   * Polls the server status endpoint for async job completion
   */
  private static async pollJobStatus(
    jobId: string,
    originalUrl: string,
    preset: ImageEnhancementPreset,
    onProgress?: (statusText: string) => void,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<EnhanceImageResult> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      onProgress?.(
        attempts < 3
          ? 'Deep neural network enhancing lighting & resolving textures...'
          : attempts < 8
          ? 'Sharpening fine craft details & applying noise reduction...'
          : 'Finalizing high-resolution output...'
      );

      try {
        const response = await fetch(`/api/enhance-image/status?jobId=${encodeURIComponent(jobId)}`);
        const data = await response.json().catch(() => null);

        if (!data || !data.success) {
          if (data?.status === 'unconfigured') {
            return {
              success: false,
              status: 'unconfigured',
              originalUrl,
              error: data.error,
              jobId,
            };
          }
          if (data?.status === 'error' || data?.status === 'failed') {
            return {
              success: false,
              status: 'failed',
              originalUrl,
              error: data.error || 'Job processing failed on Deep Image AI',
              jobId,
            };
          }
        }

        if (data?.status === 'complete' && data?.resultUrl) {
          onProgress?.('Photo enhancement complete!');
          return {
            success: true,
            status: 'complete',
            originalUrl,
            resultUrl: data.resultUrl,
            preset,
            jobId,
          };
        }

        // Still in progress, continue loop
      } catch (err) {
        console.warn(`Poll attempt ${attempts} encountered network glitch:`, err);
      }
    }

    return {
      success: false,
      status: 'timeout',
      originalUrl,
      error: 'Image enhancement timed out after 60 seconds. You can continue with your original photo.',
      jobId,
    };
  }

  /**
   * Creates an ImageEnhancementMetadata object for storing with products
   */
  static createMetadata(
    originalUrl: string,
    enhancedUrl: string,
    preset?: ImageEnhancementPreset,
    operations?: string[]
  ): ImageEnhancementMetadata {
    return {
      isEnhanced: true,
      originalUrl,
      enhancedUrl,
      preset: preset || 'auto',
      operationsApplied: operations || ['light', 'color', 'deblur', 'denoise'],
      enhancedAt: new Date().toISOString(),
    };
  }

  private static TRANSFER_KEY = 'jc_enhancer_transferred_data';

  static saveTransferredImage(
    url: string,
    metadata?: ImageEnhancementMetadata,
    targetPage?: 'add-product' | 'smart-catalog'
  ): void {
    try {
      sessionStorage.setItem(
        this.TRANSFER_KEY,
        JSON.stringify({ url, metadata, targetPage, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Failed to save transferred image to sessionStorage:', e);
    }
  }

  static getTransferredImage(): {
    url: string;
    metadata?: ImageEnhancementMetadata;
    targetPage?: string;
  } | null {
    try {
      const data = sessionStorage.getItem(this.TRANSFER_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  static clearTransferredImage(): void {
    try {
      sessionStorage.removeItem(this.TRANSFER_KEY);
    } catch (e) {}
  }
}
