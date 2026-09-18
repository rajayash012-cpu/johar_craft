import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, Camera, X, RotateCcw, Trash2,
  AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { compressImageToDataUri } from '../utils/photo';

// ─── Constants ───────────────────────────────────────────────
const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ─── Types ───────────────────────────────────────────────────
type Mode = 'idle' | 'camera';
type Status = 'idle' | 'processing' | 'done' | 'error';

interface PhotoUploaderProps {
  /** Current photo data URI (or empty string / null if none). */
  value: string;
  /** Called with a compressed JPEG data URI whenever the photo changes. */
  onChange: (dataUri: string) => void;
  /** Called when the user removes the photo. */
  onRemove: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// ─── Component ───────────────────────────────────────────────
export function PhotoUploader({ value, onChange, onRemove }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>('idle');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Stop camera stream when leaving camera mode
  useEffect(() => {
    if (mode !== 'camera') {
      stopStream();
    }
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream();
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  // ── File validation ───────────────────────────────────────
  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported file type "${file.type}". Please use JPG, PNG, or WebP.`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${MAX_FILE_MB} MB.`;
    }
    return null;
  }

  // ── Process a File/Blob → compressed data URI ─────────────
  async function processFile(file: File | Blob) {
    setStatus('processing');
    setErrorMsg('');
    try {
      const dataUri = await compressImageToDataUri(file as File, 400, 0.78);
      onChange(dataUri);
      setStatus('done');
    } catch (err) {
      console.error('Image compression failed:', err);
      setErrorMsg('Could not process the image. Please try a different file.');
      setStatus('error');
    }
  }

  // ── Handle file input change ──────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset so same file can be re-selected
      e.target.value = '';
      const err = validateFile(file);
      if (err) {
        setErrorMsg(err);
        setStatus('error');
        return;
      }
      await processFile(file);
    },
    []
  );

  // ── Open file picker ──────────────────────────────────────
  function openFilePicker() {
    setStatus('idle');
    setErrorMsg('');
    fileInputRef.current?.click();
  }

  // ── Open gallery picker (mobile: gallery; desktop: file dialog) ──
  function openGalleryPicker() {
    setStatus('idle');
    setErrorMsg('');
    galleryInputRef.current?.click();
  }

  // ── Open camera ───────────────────────────────────────────
  async function openCamera() {
    setStatus('idle');
    setErrorMsg('');

    // On mobile, use the file input with capture="user" for native camera
    // On desktop, try getUserMedia for a live camera preview
    if (isMobile()) {
      // The third input (cameraInputRef inside JSX) handles mobile camera
      cameraInputRef.current?.click();
      return;
    }

    // Desktop: try MediaDevices API
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera is not available in this browser. Please use the "Upload Image" option instead.');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode('camera');

      // Attach stream to video element after mode change renders it
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Permission denied') || msg.includes('NotAllowed')) {
        setErrorMsg('Camera access was denied. Please allow camera permission and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setErrorMsg('No camera found. Please use the "Upload Image" option instead.');
      } else {
        setErrorMsg('Could not access camera. Please use the "Upload Image" option instead.');
      }
      setStatus('error');
    }
  }

  // ── Capture photo from live camera ───────────────────────
  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 400;
    const h = video.videoHeight || 400;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, w, h);

    stopStream();
    setMode('idle');

    // Convert canvas to Blob → compress
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorMsg('Failed to capture photo. Please try again.');
          setStatus('error');
          return;
        }
        await processFile(blob);
      },
      'image/jpeg',
      0.92
    );
  }

  // Ref for mobile camera input
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ─── CAMERA MODE ─────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <div className="rounded-2xl overflow-hidden border-2 border-brand-300 bg-earth-950">
        {/* Video preview */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-72 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          {/* Overlay guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full border-2 border-white/40 border-dashed" />
          </div>
        </div>

        {/* Camera controls */}
        <div className="flex gap-3 p-4 bg-earth-900">
          <button
            type="button"
            onClick={() => { stopStream(); setMode('idle'); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 transition-all text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={capturePhoto}
            className="flex-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all text-sm font-semibold"
          >
            <Camera className="w-4 h-4" />
            Capture Photo
          </button>
        </div>
      </div>
    );
  }

  // ─── PREVIEW MODE (photo already selected) ───────────────
  if (value) {
    return (
      <div className="space-y-3">
        <label className="label">Profile Photo</label>
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl border-2 border-green-200 bg-green-50">
          {/* Photo preview */}
          <div className="relative flex-shrink-0">
            <img
              src={value}
              alt="Profile preview"
              className="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-md ring-2 ring-green-300"
            />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-green-800 text-sm mb-1">Photo added ✓</p>
            <p className="text-xs text-green-700 mb-4">
              This photo will appear on your artisan profile, QR identity and marketplace listing.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-400 text-green-700 hover:bg-green-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => { onRemove(); setStatus('idle'); setErrorMsg(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            </div>
          </div>
        </div>

        {/* Hidden inputs for "Change Photo" (reuse same inputs) */}
        <HiddenInputs
          fileInputRef={fileInputRef}
          galleryInputRef={galleryInputRef}
          cameraInputRef={cameraInputRef}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // ─── UPLOAD MODE (no photo yet) ──────────────────────────
  return (
    <div className="space-y-3">
      <label className="label">Profile Photo</label>

      {/* Main upload area */}
      <div className="rounded-2xl border-2 border-dashed border-earth-300 bg-earth-50 hover:border-brand-400 hover:bg-brand-50 transition-all duration-200 group">
        {/* Drop zone / icon area */}
        <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
          <div className="w-16 h-16 bg-earth-200 group-hover:bg-brand-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
            {status === 'processing' ? (
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>

          {status === 'processing' ? (
            <p className="text-sm font-medium text-brand-600">Processing image…</p>
          ) : (
            <>
              <p className="font-semibold text-earth-900 mb-1">Profile Photo</p>
              <p className="text-sm text-earth-500 mb-1">Add a photo to your artisan identity</p>
              <p className="text-xs text-earth-400">JPG, PNG · Max {MAX_FILE_MB} MB</p>
            </>
          )}
        </div>

        {/* Three action buttons */}
        {status !== 'processing' && (
          <div className="border-t border-earth-200 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-earth-200">
            <button
              type="button"
              onClick={openFilePicker}
              className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-700 hover:bg-brand-50 hover:text-brand-700 transition-colors rounded-bl-2xl sm:rounded-bl-2xl sm:rounded-br-none"
            >
              <Upload className="w-4 h-4 flex-shrink-0 text-brand-500" />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              onClick={openGalleryPicker}
              className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              <ImageIcon className="w-4 h-4 flex-shrink-0 text-brand-500" />
              <span>Choose from Gallery</span>
            </button>

            <button
              type="button"
              onClick={openCamera}
              className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-earth-700 hover:bg-brand-50 hover:text-brand-700 transition-colors rounded-br-2xl sm:rounded-bl-none"
            >
              <Camera className="w-4 h-4 flex-shrink-0 text-brand-500" />
              <span>Take Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl animate-slide-up">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      <p className="text-xs text-earth-400">
        Optional — if you skip this, a default avatar will be used.
      </p>

      {/* Hidden file inputs */}
      <HiddenInputs
        fileInputRef={fileInputRef}
        galleryInputRef={galleryInputRef}
        cameraInputRef={cameraInputRef}
        onChange={handleFileChange}
      />

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Helper: hidden file inputs ──────────────────────────────
interface HiddenInputsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function HiddenInputs({ fileInputRef, galleryInputRef, cameraInputRef, onChange }: HiddenInputsProps) {
  return (
    <>
      {/* Standard file picker — all images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
        aria-label="Upload image file"
      />

      {/* Gallery picker — on mobile shows gallery intent; desktop = file picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        aria-label="Choose from gallery"
      />

      {/* Mobile camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onChange}
        aria-label="Take photo with camera"
      />
    </>
  );
}
