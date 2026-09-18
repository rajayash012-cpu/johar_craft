import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Download,
  ShoppingBag,
  Sliders,
  SlidersHorizontal,
  Key,
  ExternalLink,
  Loader2,
  FileCheck,
  Plus
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
import { BeforeAfterSlider } from '../../components/ImageEnhancer/BeforeAfterSlider';
import { SAMPLE_CRAFT_PRESETS, SampleCraftPreset } from '../../data/sampleCraftPresets';
import { compressImageToDataUri } from '../../utils/photo';
import { useLanguage } from '../../i18n';

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ImageEnhancerPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('artisan-craft.jpg');
  const [dragOver, setDragOver] = useState(false);

  // Settings
  const [preset, setPreset] = useState<ImageEnhancementPreset>('auto');
  const [customOptions, setCustomOptions] = useState<ImageEnhancementOptions>({
    light: true,
    color: true,
    deblur: true,
    denoise: true,
    upscale: '2x',
  });

  // Processing state
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'unconfigured' | 'error'>('idle');
  const [progressStep, setProgressStep] = useState<string>('');
  const [result, setResult] = useState<EnhanceImageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle uploaded file
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, or WebP).');
      setStatus('error');
      return;
    }

    try {
      const dataUri = await compressImageToDataUri(file, 1200, 0.9);
      setImage(dataUri);
      setImageName(file.name);
      setStatus('idle');
      setResult(null);
      setErrorMessage('');
    } catch (err) {
      console.error('Failed to load image:', err);
      setErrorMessage('Failed to read photo. Please try another file.');
      setStatus('error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSelectSample = (sample: SampleCraftPreset) => {
    setImage(sample.image);
    setImageName(`${sample.id}.jpg`);
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  };

  // Start enhancement call to official Deep Image AI API via server proxy
  const handleEnhance = async () => {
    if (!image) return;

    setStatus('processing');
    setErrorMessage('');
    setProgressStep('Connecting to Deep Image AI cloud pipeline...');

    const res = await DeepImageService.enhanceImage(
      image,
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

  // Use in Add Product
  const handleUseInAddProduct = () => {
    const chosenImage = result?.resultUrl || image;
    if (!chosenImage) return;

    const metadata = result?.resultUrl
      ? DeepImageService.createMetadata(image!, result.resultUrl, result.preset, result.operationsApplied)
      : undefined;

    DeepImageService.saveTransferredImage(chosenImage, metadata, 'add-product');
    navigate('/artisan/products/add');
  };

  // Use in Smart Catalog
  const handleUseInSmartCatalog = () => {
    const chosenImage = result?.resultUrl || image;
    if (!chosenImage) return;

    const metadata = result?.resultUrl
      ? DeepImageService.createMetadata(image!, result.resultUrl, result.preset, result.operationsApplied)
      : undefined;

    DeepImageService.saveTransferredImage(chosenImage, metadata, 'smart-catalog');
    navigate('/artisan/smart-catalog');
  };

  // Download enhanced image
  const handleDownload = () => {
    const targetUrl = result?.resultUrl || image;
    if (!targetUrl) return;

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `enhanced-${imageName}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-300 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/artisan" className="text-xs text-earth-600 hover:underline">
              {t('nav.dashboard') || 'Dashboard'}
            </Link>
            <span className="text-xs text-earth-400">/</span>
            <span className="text-xs font-semibold text-brand-700">Image Enhancer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-brand-600 fill-brand-600/20" />
            IMAGE ENHANCER
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1 max-w-2xl leading-relaxed">
            Improve the quality of your product photos before adding them to your catalog.
          </p>
        </div>

        {/* Official API Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-900 bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            Official Deep Image AI Cloud
          </span>
        </div>
      </div>

      {/* Authenticity Guarantee Banner */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Authenticity Guarantee:</strong> Enhances lighting, removes camera shake blur, and increases resolution.
          Cultural motifs, weaving patterns, and authentic tribal handiwork are <em>never</em> altered or hallucinated.
        </span>
      </div>

      {/* ============================================================ */}
      {/* 1. EMPTY STATE: UPLOAD YOUR IMAGE                            */}
      {/* ============================================================ */}
      {!image && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`card-warm p-8 sm:p-12 border-2 border-dashed text-center rounded-3xl transition-all duration-200 ${
              dragOver
                ? 'border-brand-600 bg-brand-50/80 scale-[0.99]'
                : 'border-earth-300 bg-white hover:border-brand-500 hover:bg-brand-50/30'
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-earth-900">
                  ✨ IMAGE ENHANCER
                </h2>
                <p className="text-xs sm:text-sm text-earth-600 mt-1">
                  Upload your product image and improve its quality
                </p>
              </div>

              {/* Upload Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary !py-3 !px-5 text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>📤 Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isMobileDevice()) {
                      cameraInputRef.current?.click();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="btn-secondary !py-3 !px-5 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span>📷 Take Photo</span>
                </button>
              </div>

              <p className="text-[11px] text-earth-400">
                Accepts JPG, PNG, WebP · Drag & drop supported on desktop
              </p>
            </div>
          </div>

          {/* Quick-Test Sample Presets */}
          <div className="card p-5 border border-earth-200 bg-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-earth-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                Or Try Sample Handicraft Photos
              </h3>
              <span className="text-[11px] text-earth-500">Click any photo to test enhancer</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {SAMPLE_CRAFT_PRESETS.slice(0, 6).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="p-2 rounded-xl border border-earth-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all cursor-pointer group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-earth-100 border border-earth-200">
                    <img
                      src={sample.image}
                      alt={sample.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-earth-900 truncate">{sample.label}</p>
                  <p className="text-[10px] text-brand-700 truncate">{sample.craftCategory}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. AFTER IMAGE UPLOAD: ORIGINAL PREVIEW & CONTROLS           */}
      {/* ============================================================ */}
      {image && status !== 'completed' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: ORIGINAL IMAGE */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-earth-800 uppercase tracking-wider">
                  Original Image
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setStatus('idle');
                    setResult(null);
                  }}
                  className="text-xs text-brand-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Choose Different</span>
                </button>
              </div>

              <div className="card overflow-hidden border-2 border-earth-300 bg-stone-950 rounded-2xl shadow-xs">
                <div className="relative h-72 sm:h-96 flex items-center justify-center overflow-hidden">
                  <img
                    src={image}
                    alt="Original craft photo"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow">
                    ORIGINAL
                  </div>
                </div>
                <div className="p-3 bg-white border-t border-earth-200 flex items-center justify-between text-xs text-earth-600">
                  <span className="truncate max-w-[200px]">{imageName}</span>
                  <span className="font-semibold text-earth-800">Ready to enhance</span>
                </div>
              </div>
            </div>

            {/* Right Column: ENHANCEMENT CONTROLS */}
            <div className="lg:col-span-7 space-y-5">
              <div className="card p-6 border border-earth-300 bg-white rounded-2xl space-y-5 shadow-xs">
                <div>
                  <h3 className="font-serif font-bold text-lg text-earth-900">
                    Enhancement Mode
                  </h3>
                  <p className="text-xs text-earth-600 mt-0.5">
                    Select the optimization algorithm suited for this handicraft photo.
                  </p>
                </div>

                {/* Preset Radio Options */}
                <div className="space-y-2.5">
                  {(Object.keys(PRESET_CONFIGS) as ImageEnhancementPreset[]).map((key) => {
                    const cfg = PRESET_CONFIGS[key];
                    const isSelected = preset === key;
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-400/40 shadow-xs'
                            : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="enhancementPreset"
                          checked={isSelected}
                          onChange={() => setPreset(key)}
                          className="mt-1 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-earth-900">{cfg.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isSelected ? 'bg-brand-600 text-white' : 'bg-earth-100 text-earth-700'
                              }`}
                            >
                              {cfg.badge}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-brand-800 mt-0.5">{cfg.subtitle}</p>
                          <p className="text-[11px] text-earth-600 mt-1 leading-relaxed">{cfg.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Options Panel (if custom selected) */}
                {preset === 'custom' && (
                  <div className="p-4 rounded-xl bg-earth-50 border border-earth-200 space-y-3 animate-fade-in text-xs">
                    <h4 className="font-bold text-earth-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-600" />
                      Fine-Tune Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-earth-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customOptions.light}
                          onChange={(e) => setCustomOptions({ ...customOptions, light: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Light Balance</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-earth-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customOptions.color}
                          onChange={(e) => setCustomOptions({ ...customOptions, color: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Color Correction</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-earth-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customOptions.deblur}
                          onChange={(e) => setCustomOptions({ ...customOptions, deblur: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Deblur Shake</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-earth-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customOptions.denoise}
                          onChange={(e) => setCustomOptions({ ...customOptions, denoise: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Noise Removal</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-earth-200 flex items-center justify-between">
                      <span className="font-semibold text-earth-700">Resolution Upscale:</span>
                      <div className="flex gap-1">
                        {(['none', '2x', '4x'] as const).map((up) => (
                          <button
                            key={up}
                            type="button"
                            onClick={() => setCustomOptions({ ...customOptions, upscale: up })}
                            className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                              customOptions.upscale === up
                                ? 'bg-brand-600 text-white'
                                : 'bg-white border border-earth-200 text-earth-600'
                            }`}
                          >
                            {up}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Enhance Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={status === 'processing'}
                    onClick={handleEnhance}
                    className="btn-primary w-full justify-center !py-3.5 !text-base shadow-md !bg-gradient-to-r !from-amber-600 !via-brand-600 !to-orange-600 hover:!from-amber-500 hover:!to-brand-500 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enhancing image with Deep Image AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-200 fill-amber-200" />
                        <span>✨ Enhance Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Processing Progress Display */}
              {status === 'processing' && (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3 animate-fade-in shadow-xs">
                  <div className="w-8 h-8 rounded-full border-3 border-amber-600 border-t-transparent animate-spin mx-auto" />
                  <div>
                    <p className="font-bold text-sm text-amber-950">✨ Enhancing your image...</p>
                    <p className="text-xs text-amber-800 mt-0.5">{progressStep}</p>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Deep Image AI is adjusting exposure, removing sensor noise, and sharpening weave textures.
                  </p>
                </div>
              )}

              {/* Unconfigured Notice */}
              {status === 'unconfigured' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Deep Image AI API key is not configured.</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    Image enhancement is currently unavailable. To enable cloud enhancement, add your key to <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">.env</code>:
                  </p>
                  <pre className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] font-mono">
                    DEEP_IMAGE_API_KEY=your_key_here
                  </pre>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleUseInAddProduct}
                      className="btn-primary !py-1.5 !px-3 !text-xs cursor-pointer"
                    >
                      <span>Continue with Original Photo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {status === 'error' && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Image enhancement is currently unavailable</span>
                  </div>
                  <p>{errorMessage}</p>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={handleEnhance}
                      className="btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handleUseInAddProduct}
                      className="btn-primary !py-1.5 !px-3 !text-xs cursor-pointer"
                    >
                      Continue with Original Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. COMPLETED RESULT: BEFORE / AFTER COMPARISON & ACTIONS     */}
      {/* ============================================================ */}
      {image && status === 'completed' && result?.resultUrl && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-950">Image Enhanced Successfully!</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Inspect the Before / After comparison below, then choose how to use the enhanced photo.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold bg-white text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto shadow-2xs">
              ✨ Deep Image AI High Resolution
            </span>
          </div>

          {/* Before / After Interactive Slider */}
          <div className="card p-4 sm:p-6 border border-earth-300 bg-white rounded-3xl shadow-sm space-y-4">
            <BeforeAfterSlider
              originalImage={image}
              enhancedImage={result.resultUrl}
              originalLabel="ORIGINAL"
              enhancedLabel="ENHANCED"
              operations={result.operationsApplied}
            />
          </div>

          {/* Action Decision Toolbar */}
          <div className="card p-6 border border-earth-300 bg-earth-50/60 rounded-3xl space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-base text-earth-900 text-center sm:text-left">
              Choose an Action for this Enhanced Image:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Action 1: Use in Add Product */}
              <button
                type="button"
                onClick={handleUseInAddProduct}
                className="p-4 rounded-2xl bg-white border-2 border-brand-300 hover:border-brand-600 hover:shadow-md text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-earth-900 group-hover:text-brand-700">
                  🛍️ Use in Add Product
                </p>
                <p className="text-xs text-earth-600 mt-1">
                  Start listing with this enhanced photo pre-loaded in Slot 1.
                </p>
              </button>

              {/* Action 2: Use in Smart Catalog */}
              <button
                type="button"
                onClick={handleUseInSmartCatalog}
                className="p-4 rounded-2xl bg-white border-2 border-amber-300 hover:border-amber-600 hover:shadow-md text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-earth-900 group-hover:text-amber-700">
                  ✨ Use in Smart Catalog
                </p>
                <p className="text-xs text-earth-600 mt-1">
                  Send this high-clarity photo to assistive AI for analysis.
                </p>
              </button>

              {/* Action 3: Download Enhanced */}
              <button
                type="button"
                onClick={handleDownload}
                className="p-4 rounded-2xl bg-white border-2 border-earth-300 hover:border-earth-500 hover:shadow-md text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-earth-100 text-earth-700 flex items-center justify-center mb-2 group-hover:bg-earth-800 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-earth-900 group-hover:text-earth-950">
                  💾 Download Image
                </p>
                <p className="text-xs text-earth-600 mt-1">
                  Save high-resolution enhanced photo to your device.
                </p>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="pt-3 border-t border-earth-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="text-brand-800 hover:text-brand-950 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Enhance Again / Change Preset</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setStatus('idle');
                  setResult(null);
                }}
                className="text-earth-600 hover:text-earth-900 font-medium cursor-pointer"
              >
                Upload Different Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}
