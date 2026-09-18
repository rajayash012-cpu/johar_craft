import React from 'react';

interface CulturalDividerProps {
  label?: string;
  motif?: 'diamond' | 'triple' | 'leaf' | 'sohrai';
  className?: string;
  accentColor?: string;
}

export function CulturalDivider({
  label,
  motif = 'diamond',
  className = 'my-6',
}: CulturalDividerProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Left delicate line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-earth-300 to-earth-400/80 max-w-xs" />

      {/* Center motif / label */}
      <div className="px-4 flex items-center gap-2.5 text-earth-700 select-none">
        {label ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-600 font-serif">❖</span>
            <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-earth-800">
              {label}
            </span>
            <span className="text-[10px] text-brand-600 font-serif">❖</span>
          </div>
        ) : motif === 'triple' ? (
          <div className="flex items-center gap-1.5 text-brand-700 text-xs">
            <span className="opacity-40">❖</span>
            <span className="opacity-90 text-sm">❖</span>
            <span className="opacity-40">❖</span>
          </div>
        ) : motif === 'sohrai' ? (
          <div className="flex items-center gap-1.5 text-xs text-earth-600 font-serif">
            <span className="text-brand-600 font-bold">◇</span>
            <span className="text-earth-400">─</span>
            <span className="text-brand-700 font-bold">◈</span>
            <span className="text-earth-400">─</span>
            <span className="text-brand-600 font-bold">◇</span>
          </div>
        ) : (
          <span className="text-brand-600 text-xs font-serif opacity-80">❖</span>
        )}
      </div>

      {/* Right delicate line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-earth-300 to-earth-400/80 max-w-xs" />
    </div>
  );
}

export default CulturalDivider;
