import React from 'react';
import { Sparkles, Undo2, SlidersHorizontal } from 'lucide-react';
import { ImageEnhancementMetadata } from '../../types';

interface EnhancementStatusBadgeProps {
  metadata?: ImageEnhancementMetadata;
  onViewComparison?: () => void;
  onRevert?: () => void;
  compact?: boolean;
}

export function EnhancementStatusBadge({
  metadata,
  onViewComparison,
  onRevert,
  compact = false,
}: EnhancementStatusBadgeProps) {
  if (!metadata?.isEnhanced) return null;

  if (compact) {
    return (
      <span
        title={`Enhanced with Deep Image AI (${metadata.preset || 'auto'})`}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/15 via-brand-500/15 to-emerald-500/15 text-brand-700 border border-brand-300 shadow-2xs"
      >
        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        <span>AI Enhanced</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 p-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-brand-50 border border-brand-200 text-xs shadow-2xs flex-wrap">
      <div className="flex items-center gap-1.5 font-semibold text-brand-900">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>Deep Image AI Enhanced</span>
        <span className="text-[10px] font-normal text-brand-700 bg-white/80 px-1.5 py-0.2 rounded border border-brand-200 uppercase">
          {metadata.preset || 'Auto'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {onViewComparison && (
          <button
            type="button"
            onClick={onViewComparison}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-800 hover:text-brand-950 underline cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Before / After</span>
          </button>
        )}

        {onRevert && (
          <button
            type="button"
            onClick={onRevert}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-red-700 ml-1 cursor-pointer transition-colors"
            title="Revert back to the original photo"
          >
            <Undo2 className="w-3 h-3" />
            <span>Revert</span>
          </button>
        )}
      </div>
    </div>
  );
}
