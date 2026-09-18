import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  Check,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  Key,
  ExternalLink
} from 'lucide-react';
import {
  DeepImageService,
  PRESET_CONFIGS,
  EnhanceImageResult,
} from '../../services/deepImageService';
import {
  ImageEnhancementPreset,
  ImageEnhancementOptions,
  ImageEnhancementMetadata,
} from '../../types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useLanguage } from '../../i18n';

interface ImageEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialPreset?: ImageEnhancementPreset;
  onApply: (enhancedUrl: string, metadata: ImageEnhancementMetadata) => void;
  slotIndex?: number;
}

export function ImageEnhanceModal({
  isOpen,
  onClose,
  imageUrl,
  initialPreset = 'auto',
  onApply,
  slotIndex = 0,
}: ImageEnhanceModalProps) {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<ImageEnhancementPreset>(initialPreset);
  const [customOptions, setCustomOptions] = useState<ImageEnhancementOptions>({
    light: true,
    color: true,
    deblur: true,
    denoise: true,
    upscale: '2x',
  });

  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'unconfigured' | 'error'>('idle');
  const [progressStep, setProgressStep] = useState<string>('');
  const [result, setResult] = useState<EnhanceImageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEnhance = async () => {
    setStatus('processing');
    setErrorMessage('');
    setProgressStep('Connecting to Deep Image AI cloud pipeline...');

    const res = await DeepImageService.enhanceImage(
      imageUrl,
      preset,
      preset === 'custom' ? customOptions : undefined,
      (stepText) => setProgressStep(stepText)
    );

    if (res.status === 'unconfigured') {
      setStatus('unconfigured');
      setErrorMessage(res.error || 'Deep Image AI API key is not configured.');
      return;
    }

    if (res.success && res.resultUrl) {
      setResult(res);
      setStatus('completed');
    } else {
      setStatus('error');
      setErrorMessage(res.error || 'Enhancement failed. Please try again or continue with the original photo.');
    }
  };

  const handleAcceptEnhanced = () => {
    if (result && result.resultUrl) {
      const metadata = DeepImageService.createMetadata(
        imageUrl,
        result.resultUrl,
        result.preset || preset,
        result.operationsApplied
      );
      onApply(result.resultUrl, metadata);
      onClose();
    }
  };

  const handleKeepOriginal = () => {
    onClose();
  };

  const handleResetToConfig = () => {
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-100 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-stone-900 text-lg sm:text-xl">
                  {t('image_enhancer.modal_title') || 'Deep Image AI Photo Enhancer'}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">
                  Official API
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {t('image_enhancer.modal_subtitle') || 'Enhance lighting, clarity, and texture resolution for Jharkhand handicrafts'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticity Guarantee Banner */}
        <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 text-emerald-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Authenticity Guarantee:</strong> Enhances clarity, exposure & weave definition. Cultural motifs, patterns, and handiwork are never altered.
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* STEP 1: CONFIGURATION / IDLE */}
          {status === 'idle' && (
            <div className="space-y-6">
              {/* Photo Preview Thumbnail */}
              <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                  <img src={imageUrl} alt="Artisan photo" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-800">
                    Selected Image (Photo {slotIndex + 1})
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Select an enhancement preset below tailored for rural handicraft photography.
                  </p>
                </div>
              </div>

              {/* Preset Selector Tabs */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Select Enhancement Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(PRESET_CONFIGS) as ImageEnhancementPreset[]).map((key) => {
                    const cfg = PRESET_CONFIGS[key];
                    const isSelected = preset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPreset(key)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-400/40 shadow-xs'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-sm text-stone-900">{cfg.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isSelected
                                ? 'bg-brand-600 text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {cfg.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-brand-700 mb-1">{cfg.subtitle}</p>
                        <p className="text-[11px] text-stone-500 leading-relaxed">{cfg.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Options Panel (if custom selected) */}
              {preset === 'custom' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-fade-in">
                  <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-brand-600" />
                    Custom Enhancement Controls
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customOptions.light}
                        onChange={(e) => setCustomOptions({ ...customOptions, light: e.target.checked })}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-medium text-stone-800">Light Balance</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customOptions.color}
                        onChange={(e) => setCustomOptions({ ...customOptions, color: e.target.checked })}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-medium text-stone-800">Color Boost</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customOptions.deblur}
                        onChange={(e) => setCustomOptions({ ...customOptions, deblur: e.target.checked })}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-medium text-stone-800">Deblur Shake</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customOptions.denoise}
                        onChange={(e) => setCustomOptions({ ...customOptions, denoise: e.target.checked })}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-medium text-stone-800">Noise Removal</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700">Resolution Upscale:</span>
                    <div className="flex items-center gap-1.5">
                      {(['none', '2x', '4x'] as const).map((up) => (
                        <button
                          key={up}
                          type="button"
                          onClick={() => setCustomOptions({ ...customOptions, upscale: up })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                            customOptions.upscale === up
                              ? 'bg-brand-600 text-white shadow-2xs'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {up}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {status === 'processing' && (
            <div className="py-12 px-4 text-center space-y-5 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-brand-100 animate-ping opacity-30" />
                <div className="w-full h-full rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-brand-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="font-serif font-bold text-stone-900 text-lg">
                  Enhancing Artisan Photo with Deep Image AI
                </h4>
                <p className="text-xs text-brand-700 font-medium animate-pulse">
                  {progressStep || 'Deep neural processing in progress...'}
                </p>
                <p className="text-[11px] text-stone-500 pt-1">
                  Adjusting exposure, reducing sensor noise, and sharpening craft textures. This typically takes 5–15 seconds.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED WITH BEFORE/AFTER COMPARISON */}
          {status === 'completed' && result?.resultUrl && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Enhancement Complete!</strong> Drag the slider below to inspect the clarity improvement before deciding.
                </span>
              </div>

              {/* Interactive Split Slider */}
              <BeforeAfterSlider
                originalImage={imageUrl}
                enhancedImage={result.resultUrl}
                originalLabel="Original Photo"
                enhancedLabel="Deep Image AI Enhanced"
                operations={result.operationsApplied}
              />
            </div>
          )}

          {/* UNCONFIGURED FALLBACK */}
          {status === 'unconfigured' && (
            <div className="py-6 px-4 space-y-4 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-amber-900 text-sm">
                    Deep Image AI API Key Required
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    To enable live cloud image enhancement, add your Deep Image AI API key to your local <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">.env</code> file:
                  </p>
                  <pre className="font-mono text-xs bg-white p-2.5 rounded-xl border border-amber-200 text-stone-800 overflow-x-auto">
                    DEEP_IMAGE_API_KEY=your_api_key_here
                  </pre>
                  <p className="text-[11px] text-amber-700">
                    Get your key at{' '}
                    <a
                      href="https://deep-image.ai/app/my-profile/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-amber-900 inline-flex items-center gap-0.5"
                    >
                      deep-image.ai/app/my-profile/api <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ERROR FALLBACK */}
          {status === 'error' && (
            <div className="py-6 px-4 space-y-4 rounded-2xl bg-red-50 border border-red-200 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-red-900 text-sm">Enhancement Unavailable</h4>
                  <p className="text-xs text-red-800">{errorMessage}</p>
                  <p className="text-[11px] text-stone-600 mt-2">
                    You can retry with different settings or proceed directly with your original authentic photo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
          {status === 'idle' && (
            <>
              <button
                type="button"
                onClick={handleKeepOriginal}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-medium text-xs sm:text-sm cursor-pointer"
              >
                {t('image_enhancer.keep_original') || 'Keep Original'}
              </button>
              <button
                type="button"
                onClick={handleStartEnhance}
                className="btn-primary !py-2.5 !px-5 text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('image_enhancer.enhance_btn') || 'Enhance with Deep Image AI'}</span>
              </button>
            </>
          )}

          {status === 'processing' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleKeepOriginal}
                className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
              >
                Cancel & Continue with Original
              </button>
            </div>
          )}

          {status === 'completed' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToConfig}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Other Preset</span>
                </button>
                <button
                  type="button"
                  onClick={handleKeepOriginal}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium cursor-pointer"
                >
                  {t('image_enhancer.keep_original') || 'Keep Original'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleAcceptEnhanced}
                className="btn-primary !py-2.5 !px-6 text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{t('image_enhancer.use_enhanced') || 'Use Enhanced Image'}</span>
              </button>
            </>
          )}

          {(status === 'unconfigured' || status === 'error') && (
            <>
              <button
                type="button"
                onClick={handleResetToConfig}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleKeepOriginal}
                className="btn-primary !py-2.5 !px-5 text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>{t('image_enhancer.continue_original') || 'Continue with Original Photo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
