import React from 'react';
import { Camera, ImageOff, User } from 'lucide-react';

interface PhotoPlaceholderProps {
  type?: 'product' | 'artisan' | 'banner';
  className?: string;
  compact?: boolean;
  text?: string;
  rounded?: 'full' | 'lg' | '2xl' | 'none';
}

export function PhotoPlaceholder({
  type = 'product',
  className = '',
  compact = false,
  text = 'Photo not available',
  rounded,
}: PhotoPlaceholderProps) {
  const roundedClass = rounded
    ? rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === '2xl'
      ? 'rounded-2xl'
      : ''
    : type === 'artisan'
    ? 'rounded-full'
    : 'rounded-none';

  if (compact) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 text-stone-400 border border-stone-200 ${roundedClass} ${className}`}
        title={text}
      >
        {type === 'artisan' ? (
          <User className="w-4 h-4 text-stone-400" />
        ) : (
          <ImageOff className="w-3.5 h-3.5 text-stone-400" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center bg-stone-100/90 text-stone-500 border border-stone-200/80 select-none p-3 ${roundedClass} ${className}`}
    >
      <div className="p-2.5 rounded-full bg-stone-200/60 mb-1.5 text-stone-400">
        {type === 'artisan' ? (
          <User className="w-6 h-6" />
        ) : (
          <Camera className="w-6 h-6" />
        )}
      </div>
      <span className="text-xs font-medium text-stone-500 tracking-wide text-center">{text}</span>
      <span className="text-[10px] text-stone-400 text-center">Authentic asset pending</span>
    </div>
  );
}
