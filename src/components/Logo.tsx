import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-base', sub: 'text-xs' },
    md: { icon: 'w-6 h-6', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-8 h-8', text: 'text-2xl', sub: 'text-sm' },
  };

  const s = sizes[size];
  const joharColor = variant === 'light' ? 'text-white' : 'text-[#4A2C20]';
  const craftColor = variant === 'light' ? 'text-brand-200' : 'text-[#B85C38]';
  const subColor = variant === 'light' ? 'text-earth-200/90' : 'text-earth-600';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="bg-gradient-to-br from-[#B85C38] to-[#964525] rounded-xl p-1.5 flex items-center justify-center shadow-xs border border-[#73351C]/20">
        <Leaf className={`${s.icon} text-[#FAF4EB]`} />
      </div>
      <div>
        <div className={`font-display font-bold ${s.text} leading-none tracking-tight`}>
          <span className={joharColor}>JOHAR</span>{' '}
          <span className={`${craftColor} font-serif tracking-wider font-semibold`}>CRAFT</span>
        </div>
        <div className={`${s.sub} ${subColor} font-sans tracking-wide text-[10px] sm:text-[11px] font-medium leading-none mt-1 flex items-center gap-1`}>
          <span>Jharkhand's Artisan Marketplace</span>
        </div>
      </div>
    </div>
  );
}
