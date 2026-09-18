import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Camera,
  X,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Star,
  Plus,
  Maximize2,
  Sparkles,
  Undo2,
  SlidersHorizontal
} from 'lucide-react';
import { compressImageToDataUri } from '../utils/photo';
import { ImageEnhanceModal, EnhancementStatusBadge } from './ImageEnhancer';
import { ImageEnhancementMetadata } from '../types';
import { DeepImageService } from '../services/deepImageService';

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const SLOT_CONFIGS = [
  { id: 0, title: 'Main Product Image', subtitle: 'Front view (shown in marketplace)', required: true },
  { id: 1, title: 'Side / Angle View', subtitle: 'Shows shape and dimension', required: false },
  { id: 2, title: 'Craft Detail / Close-up', subtitle: 'Highlights texture and handiwork', required: false },
  { id: 3, title: 'Additional View', subtitle: 'Scale, in-use, or packaging', required: false },
];

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

interface ProductPhotoUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  enhancedMetadata?: Record<number, ImageEnhancementMetadata>;
  onEnhancedMetadataChange?: (metadata: Record<number, ImageEnhancementMetadata>) => void;
  originalImages?: Record<number, string>;
  onOriginalImagesChange?: (originals: Record<number, string>) => void;
}

export function ProductPhotoUploader({
  images,
  onChange,
  enhancedMetadata: externalMetadata,
  onEnhancedMetadataChange,
  originalImages: externalOriginals,
  onOriginalImagesChange,
}: ProductPhotoUploaderProps) {
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Deep Image AI Enhancement State
  const [internalMetadata, setInternalMetadata] = useState<Record<number, ImageEnhancementMetadata>>({});
  const [internalOriginals, setInternalOriginals] = useState<Record<number, string>>({});
  const [enhanceModalOpen, setEnhanceModalOpen] = useState(false);
  const [isBatchEnhancing, setIsBatchEnhancing] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');

  const enhancedMetadata = externalMetadata || internalMetadata;
  const originalImages = externalOriginals || internalOriginals;

  const updateMetadata = (newMeta: Record<number, ImageEnhancementMetadata>) => {
    setInternalMetadata(newMeta);
    onEnhancedMetadataChange?.(newMeta);
  };

  const updateOriginals = (newOrig: Record<number, string>) => {
    setInternalOriginals(newOrig);
    onOriginalImagesChange?.(newOrig);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      stopStream();
    }
  }, [cameraOpen, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported file format (${file.type || 'unknown'}). Please choose a JPG, PNG, or WebP photo.`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `File size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed size is ${MAX_FILE_MB} MB.`;
    }
    return null;
  };

  const processAndSave = async (fileOrBlob: File | Blob, targetSlot: number) => {
    setStatus('processing');
    setErrorMsg('');
    try {
      const dataUri = await compressImageToDataUri(fileOrBlob as File, 800, 0.85);

      const newImages = [...images];
      if (targetSlot < newImages.length) {
        newImages[targetSlot] = dataUri;
      } else {
        newImages.push(dataUri);
      }

      // If replacing photo in slot, clear enhancement metadata for that slot
      const newMeta = { ...enhancedMetadata };
      delete newMeta[targetSlot];
      updateMetadata(newMeta);

      const newOrig = { ...originalImages };
      delete newOrig[targetSlot];
      updateOriginals(newOrig);

      onChange(newImages);
      setActiveSlot(Math.min(targetSlot, newImages.length - 1));
      setStatus('idle');
    } catch (err) {
      console.error('Failed to compress product image:', err);
      setErrorMsg('Could not process this image. Please try another photo.');
      setStatus('error');
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const err = validateFile(file);
    if (err) {
      setErrorMsg(err);
      setStatus('error');
      return;
    }

    await processAndSave(file, activeSlot);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      setErrorMsg(err);
      setStatus('error');
      return;
    }

    await processAndSave(file, activeSlot);
  };

  const openFilePicker = () => {
    setErrorMsg('');
    setStatus('idle');
    fileInputRef.current?.click();
  };

  const openGalleryPicker = () => {
    setErrorMsg('');
    setStatus('idle');
    galleryInputRef.current?.click();
  };

  const openCamera = async () => {
    setErrorMsg('');
    setStatus('idle');

    if (isMobile()) {
      cameraInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera access is not supported in this browser. Please use "Upload Image" or "Choose from Gallery".');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setErrorMsg('Camera permission was denied. Please allow camera access in browser settings or use Upload Image.');
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
        setErrorMsg('No camera detected on this device. Please use "Upload Image" instead.');
      } else {
        setErrorMsg('Unable to open camera. Please use "Upload Image" or "Choose from Gallery".');
      }
      setStatus('error');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 800;
    const h = video.videoHeight || 600;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, w, h);

    stopStream();
    setCameraOpen(false);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorMsg('Failed to capture picture. Please try again.');
          setStatus('error');
          return;
        }
        await processAndSave(blob, activeSlot);
      },
      'image/jpeg',
      0.9
    );
  };

  const removeImageAt = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);

    // Re-index metadata and originalImages
    const newMeta: Record<number, ImageEnhancementMetadata> = {};
    const newOrig: Record<number, string> = {};

    Object.keys(enhancedMetadata).forEach((k) => {
      const slot = Number(k);
      if (slot < index && enhancedMetadata[slot]) {
        newMeta[slot] = enhancedMetadata[slot];
      } else if (slot > index && enhancedMetadata[slot]) {
        newMeta[slot - 1] = enhancedMetadata[slot];
      }
    });

    Object.keys(originalImages).forEach((k) => {
      const slot = Number(k);
      if (slot < index && originalImages[slot]) {
        newOrig[slot] = originalImages[slot];
      } else if (slot > index && originalImages[slot]) {
        newOrig[slot - 1] = originalImages[slot];
      }
    });

    updateMetadata(newMeta);
    updateOriginals(newOrig);
    onChange(newImages);

    if (activeSlot >= newImages.length) {
      setActiveSlot(Math.max(0, newImages.length - 1));
    }
    setErrorMsg('');
  };

  const makeMainImage = (index: number) => {
    if (index === 0 || index >= images.length) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    const reordered = [item, ...rest];

    // Reorder metadata and originals
    const newMeta: Record<number, ImageEnhancementMetadata> = {};
    const newOrig: Record<number, string> = {};

    if (enhancedMetadata[index]) newMeta[0] = enhancedMetadata[index];
    if (originalImages[index]) newOrig[0] = originalImages[index];

    let targetIdx = 1;
    for (let i = 0; i < images.length; i++) {
      if (i !== index) {
        if (enhancedMetadata[i]) newMeta[targetIdx] = enhancedMetadata[i];
        if (originalImages[i]) newOrig[targetIdx] = originalImages[i];
        targetIdx++;
      }
    }

    updateMetadata(newMeta);
    updateOriginals(newOrig);
    onChange(reordered);
    setActiveSlot(0);
  };

  // Deep Image AI: Apply Enhanced Photo
  const handleApplyEnhanced = (enhancedUrl: string, metadata: ImageEnhancementMetadata) => {
    const current = images[activeSlot];
    const newOrig = { ...originalImages };
    // Preserve initial original
    if (!newOrig[activeSlot]) {
      newOrig[activeSlot] = current;
    }

    const newMeta = { ...enhancedMetadata, [activeSlot]: metadata };
    const newImages = [...images];
    newImages[activeSlot] = enhancedUrl;

    updateOriginals(newOrig);
    updateMetadata(newMeta);
    onChange(newImages);
  };

  // Deep Image AI: Revert back to original photo
  const handleRevertToOriginal = (slotIdx: number) => {
    if (originalImages[slotIdx]) {
      const newImages = [...images];
      newImages[slotIdx] = originalImages[slotIdx];

      const newMeta = { ...enhancedMetadata };
      delete newMeta[slotIdx];

      const newOrig = { ...originalImages };
      delete newOrig[slotIdx];

      updateMetadata(newMeta);
      updateOriginals(newOrig);
      onChange(newImages);
    }
  };

  // Deep Image AI: Batch Enhance All Unenhanced Photos
  const handleBatchEnhance = async () => {
    if (isBatchEnhancing || images.length === 0) return;
    setIsBatchEnhancing(true);
    setBatchStatus('Starting batch enhancement...');

    const newImages = [...images];
    const newOrig = { ...originalImages };
    const newMeta = { ...enhancedMetadata };

    for (let i = 0; i < images.length; i++) {
      if (!newMeta[i]?.isEnhanced) {
        setBatchStatus(`Enhancing photo ${i + 1} of ${images.length}...`);
        const originalUrl = images[i];
        const res = await DeepImageService.enhanceImage(originalUrl, 'product');
        if (res.success && res.resultUrl) {
          if (!newOrig[i]) newOrig[i] = originalUrl;
          newImages[i] = res.resultUrl;
          newMeta[i] = DeepImageService.createMetadata(
            originalUrl,
            res.resultUrl,
            'product',
            res.operationsApplied
          );
        } else if (res.status === 'unconfigured') {
          setErrorMsg('Deep Image AI API key is not configured in .env');
          break;
        }
      }
    }

    updateOriginals(newOrig);
    updateMetadata(newMeta);
    onChange(newImages);
    setIsBatchEnhancing(false);
    setBatchStatus('');
  };

  const currentImage = images[activeSlot];
  const activeSlotConfig = SLOT_CONFIGS[activeSlot] || SLOT_CONFIGS[0];
  const activeMetadata = enhancedMetadata[activeSlot];
  const hasUnenhancedPhotos = images.some((_, idx) => !enhancedMetadata[idx]?.isEnhanced);

  return (
    <div className="space-y-4">
      {/* Top Header & Summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <label className="label !mb-0 font-semibold text-earth-900 text-base">
            Add Product Photos <span className="text-brand-600">*</span>
          </label>
          <p className="text-xs text-earth-500 mt-0.5">
            Show your authentic craft clearly (Add up to 4 photos)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {images.length > 1 && hasUnenhancedPhotos && (
            <button
              type="button"
              disabled={isBatchEnhancing}
              onClick={handleBatchEnhance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/15 via-brand-500/20 to-orange-500/15 text-brand-900 border border-brand-300 hover:border-brand-500 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Enhance all uploaded photos with Deep Image AI"
            >
              {isBatchEnhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  <span>{batchStatus || 'Enhancing all...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Enhance All Photos</span>
                </>
              )}
            </button>
          )}

          {images.length > 0 && (
            <span className="badge-brand text-xs font-semibold">
              {images.length}/4 Photos
            </span>
          )}
        </div>
      </div>

      {/* Slots Tab Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SLOT_CONFIGS.map((slot) => {
          const hasImg = !!images[slot.id];
          const isSelected = activeSlot === slot.id;
          const isNextSlot = slot.id === images.length;
          const isEnhanced = enhancedMetadata[slot.id]?.isEnhanced;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => {
                if (hasImg || isNextSlot) {
                  setActiveSlot(slot.id);
                  setCameraOpen(false);
                  setErrorMsg('');
                }
              }}
              disabled={!hasImg && !isNextSlot}
              className={`relative p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-400/40 shadow-sm'
                  : hasImg
                  ? 'border-earth-200 bg-white hover:border-earth-300'
                  : isNextSlot
                  ? 'border-dashed border-earth-300 bg-earth-50/50 hover:bg-earth-100/50 cursor-pointer'
                  : 'border-dashed border-earth-200 bg-earth-50/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {hasImg ? (
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-earth-200 shadow-xs">
                    <img src={images[slot.id]} alt={slot.title} className="w-full h-full object-cover" />
                    {slot.id === 0 && (
                      <span className="absolute bottom-0 right-0 bg-brand-600 text-white p-0.5 rounded-tl">
                        <Star className="w-2.5 h-2.5 fill-white" />
                      </span>
                    )}
                    {isEnhanced && (
                      <span
                        className="absolute top-0 right-0 bg-gradient-to-tr from-amber-500 to-brand-500 text-white p-0.5 rounded-bl shadow-2xs"
                        title="Enhanced with Deep Image AI"
                      >
                        <Sparkles className="w-2.5 h-2.5 fill-white" />
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-brand-100 text-brand-700' : 'bg-earth-200 text-earth-500'
                    }`}
                  >
                    {isNextSlot ? <Plus className="w-4 h-4" /> : <span className="text-xs font-bold">{slot.id + 1}</span>}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-earth-900 truncate">
                      {slot.id === 0 ? 'Main Photo' : `Photo ${slot.id + 1}`}
                    </span>
                    {slot.id === 0 && <span className="text-[10px] text-brand-600 font-semibold">(Key)</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[10px] text-earth-500 truncate">{hasImg ? 'Added' : 'Empty'}</p>
                    {isEnhanced && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1 rounded">
                        ✨ Enhanced
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Camera Live View Overlay */}
      {cameraOpen && (
        <div className="rounded-2xl overflow-hidden border-2 border-brand-500 bg-earth-950 shadow-md">
          <div className="relative bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-80 object-contain"
            />
            <div className="absolute inset-0 border-2 border-white/30 border-dashed m-6 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-white/70 text-xs px-3 py-1 bg-black/40 rounded-full backdrop-blur-xs">
                Align product inside box
              </span>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-earth-900 border-t border-earth-800">
            <button
              type="button"
              onClick={() => {
                stopStream();
                setCameraOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors text-sm font-semibold shadow cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Main Preview or Upload Container */}
      {!cameraOpen && currentImage ? (
        <div className="card overflow-hidden border-2 border-brand-200 bg-white shadow-xs">
          {/* Main Photo Viewport */}
          <div className="relative bg-earth-100 flex items-center justify-center overflow-hidden">
            <img
              src={currentImage}
              alt={activeSlotConfig.title}
              className="w-full h-64 sm:h-72 object-contain bg-earth-900/5 backdrop-blur-xs"
            />

            {/* Badges on top of photo */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {activeSlot === 0 ? (
                <span className="badge bg-brand-600 text-white font-semibold flex items-center gap-1 shadow-xs text-xs px-2.5 py-1">
                  <Star className="w-3.5 h-3.5 fill-white" />
                  Main Product Image
                </span>
              ) : (
                <span className="badge bg-earth-900/70 text-white font-medium text-xs px-2.5 py-1 backdrop-blur-xs">
                  {activeSlotConfig.title}
                </span>
              )}

              {activeMetadata?.isEnhanced && (
                <span className="badge bg-amber-600/90 text-white font-semibold flex items-center gap-1 shadow-xs text-xs px-2.5 py-1 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  Deep Image AI Enhanced
                </span>
              )}
            </div>
          </div>

          {/* Enhancement Status Bar (if active photo is enhanced) */}
          {activeMetadata?.isEnhanced && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-b border-amber-200 flex items-center justify-between gap-3 flex-wrap">
              <EnhancementStatusBadge
                metadata={activeMetadata}
                onViewComparison={() => setEnhanceModalOpen(true)}
                onRevert={() => handleRevertToOriginal(activeSlot)}
              />

              <button
                type="button"
                onClick={() => setEnhanceModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-950 bg-white px-2.5 py-1 rounded-lg border border-brand-300 shadow-2xs cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
                <span>Re-Enhance Settings</span>
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="p-4 bg-white border-t border-earth-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-earth-800">{activeSlotConfig.title}</p>
              <p className="text-[11px] text-earth-500">{activeSlotConfig.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Deep Image AI Trigger Button */}
              {!activeMetadata?.isEnhanced ? (
                <button
                  type="button"
                  onClick={() => setEnhanceModalOpen(true)}
                  className="btn-primary !py-1.5 !px-3 !text-xs !bg-gradient-to-r !from-amber-600 !to-brand-600 hover:!from-amber-500 hover:!to-brand-500 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Enhance clarity, lighting & resolution with Deep Image AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                  <span>Enhance Photo (AI)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRevertToOriginal(activeSlot)}
                  className="btn-outline !py-1.5 !px-3 !text-xs !border-stone-300 !text-stone-700 hover:!bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                  title="Restore unenhanced original photo"
                >
                  <Undo2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Revert to Original</span>
                </button>
              )}

              {activeSlot !== 0 && (
                <button
                  type="button"
                  onClick={() => makeMainImage(activeSlot)}
                  className="btn-outline !py-1.5 !px-3 !text-xs !border-brand-300 !text-brand-700 hover:!bg-brand-50 cursor-pointer"
                  title="Make this the primary photo buyers see first"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Set as Main</span>
                </button>
              )}

              <button
                type="button"
                onClick={openFilePicker}
                className="btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change Image</span>
              </button>

              <button
                type="button"
                onClick={() => removeImageAt(activeSlot)}
                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove this photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : !cameraOpen ? (
        /* Empty Slot / Upload Options Area */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed transition-all duration-200 ${
            dragOver
              ? 'border-brand-500 bg-brand-50/70 scale-[0.99]'
              : 'border-earth-300 bg-earth-50 hover:border-brand-400 hover:bg-brand-50/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-16 h-16 bg-white shadow-xs rounded-2xl flex items-center justify-center mb-3 border border-earth-100 text-brand-600">
              {status === 'processing' ? (
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            {status === 'processing' ? (
              <p className="text-sm font-semibold text-brand-700">Optimizing & preparing photo...</p>
            ) : (
              <>
                <p className="font-semibold text-earth-900 text-base mb-1">
                  {activeSlot === 0 ? 'Upload Main Product Photo' : `Add ${activeSlotConfig.title}`}
                </p>
                <p className="text-xs text-earth-500 max-w-sm mb-1.5">
                  {activeSlotConfig.subtitle} · Drag & drop photo here or choose an option
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mt-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Deep Image AI enhancement available after upload</span>
                </div>
              </>
            )}
          </div>

          {status !== 'processing' && (
            <div className="border-t border-earth-200 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-earth-200 bg-white/70 rounded-b-2xl">
              <button
                type="button"
                onClick={openFilePicker}
                className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-800 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={openGalleryPicker}
                className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-800 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Choose from Gallery</span>
              </button>

              <button
                type="button"
                onClick={openCamera}
                className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-800 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Take Photo</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Error display */}
      {status === 'error' && errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-slide-up">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Photo Notice</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Deep Image AI Enhancement Modal */}
      {currentImage && (
        <ImageEnhanceModal
          isOpen={enhanceModalOpen}
          onClose={() => setEnhanceModalOpen(false)}
          imageUrl={originalImages[activeSlot] || currentImage}
          initialPreset={activeMetadata?.preset || (activeSlot === 0 ? 'product' : 'auto')}
          onApply={(enhancedUrl, meta) => handleApplyEnhanced(enhancedUrl, meta)}
          slotIndex={activeSlot}
        />
      )}
    </div>
  );
}
