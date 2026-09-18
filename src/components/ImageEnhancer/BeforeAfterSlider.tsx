import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns2, SplitSquareVertical, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalImage: string;
  enhancedImage: string;
  originalLabel?: string;
  enhancedLabel?: string;
  operations?: string[];
  className?: string;
}

type ViewMode = 'slider' | 'side-by-side' | 'hold';

export function BeforeAfterSlider({
  originalImage,
  enhancedImage,
  originalLabel = 'Original Photo',
  enhancedLabel = 'Deep Image AI Enhanced',
  operations,
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((p) => Math.max(0, p - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPos((p) => Math.min(100, p + 5));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* View Mode Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-brand-600" />
            <span>Split Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Side by Side</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('hold')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'hold'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-brand-600" />
            <span>Hold to Compare</span>
          </button>
        </div>

        {operations && operations.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-500">
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span>Operations: {operations.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Mode 1: Split Slider */}
      {viewMode === 'slider' && (
        <div
          ref={containerRef}
          tabIndex={0}
          role="slider"
          aria-valuenow={Math.round(sliderPos)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Before and after image comparison slider"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden select-none bg-stone-900 border border-stone-200 cursor-ew-resize touch-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {/* Enhanced Image (Base layer, right side) */}
          <img
            src={enhancedImage}
            alt={enhancedLabel}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Original Image (Clipped layer on left) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalImage}
              alt={originalLabel}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                width: containerRef.current?.clientWidth || '100%',
                maxWidth: 'none',
              }}
            />
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
            style={{ left: `calc(${sliderPos}% - 2px)` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white text-stone-900 rounded-full shadow-md flex items-center justify-center border-2 border-stone-300">
              <SplitSquareVertical className="w-4 h-4 text-brand-600" />
            </div>
          </div>

          {/* Left Pill Badge: Original */}
          <div className="absolute top-3 left-3 pointer-events-none bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow">
            <ImageIcon className="w-3 h-3 text-stone-300" />
            <span>{originalLabel}</span>
          </div>

          {/* Right Pill Badge: Enhanced */}
          <div className="absolute top-3 right-3 pointer-events-none bg-brand-600/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{enhancedLabel}</span>
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-stone-900/70 text-stone-200 text-[10px] px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
            Drag divider left/right to compare
          </div>
        </div>
      )}

      {/* Mode 2: Side by Side */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Original Card */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900">
            <div className="h-64 sm:h-80 flex items-center justify-center">
              <img
                src={originalImage}
                alt={originalLabel}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-stone-300" />
              <span>{originalLabel}</span>
            </div>
            <div className="p-2.5 bg-white border-t border-stone-100 text-center">
              <span className="text-xs text-stone-600 font-medium">Original Artisan Photo</span>
            </div>
          </div>

          {/* Enhanced Card */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-brand-400 bg-stone-900 shadow-sm">
            <div className="h-64 sm:h-80 flex items-center justify-center">
              <img
                src={enhancedImage}
                alt={enhancedLabel}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{enhancedLabel}</span>
            </div>
            <div className="p-2.5 bg-brand-50 border-t border-brand-100 text-center">
              <span className="text-xs text-brand-800 font-semibold">✨ Deep Image AI Enhanced</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Hold to View Original */}
      {viewMode === 'hold' && (
        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden select-none bg-stone-900 border border-stone-200 flex items-center justify-center">
          <img
            src={isHoldingOriginal ? originalImage : enhancedImage}
            alt={isHoldingOriginal ? originalLabel : enhancedLabel}
            className="w-full h-full object-contain transition-all duration-150"
          />

          <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
            {isHoldingOriginal ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Showing: {originalLabel}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span>Showing: {enhancedLabel}</span>
              </>
            )}
          </div>

          {/* Interactive Hold Button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onMouseDown={() => setIsHoldingOriginal(true)}
              onMouseUp={() => setIsHoldingOriginal(false)}
              onMouseLeave={() => setIsHoldingOriginal(false)}
              onTouchStart={() => setIsHoldingOriginal(true)}
              onTouchEnd={() => setIsHoldingOriginal(false)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isHoldingOriginal
                  ? 'bg-amber-500 text-white ring-4 ring-amber-300/50 scale-95'
                  : 'bg-white text-stone-900 hover:bg-stone-100 ring-2 ring-stone-900/10'
              }`}
            >
              <Eye className="w-4 h-4 text-brand-600" />
              <span>{isHoldingOriginal ? 'Release to view Enhanced' : 'Press & Hold to view Original'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
