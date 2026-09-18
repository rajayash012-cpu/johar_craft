import React, { useState } from 'react';
import { TrendingUp, ExternalLink, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PriceRange, PriceReferenceItem } from '../types';

interface PriceReferenceCardProps {
  priceRange?: PriceRange;
  priceReferences?: PriceReferenceItem[];
  currentPrice?: number;
  className?: string;
}

export const PriceReferenceCard: React.FC<PriceReferenceCardProps> = ({
  priceRange,
  priceReferences = [],
  currentPrice,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!priceRange && (!priceReferences || priceReferences.length === 0)) {
    return null;
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div
      className={`bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-stone-800 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-tight">
              Observed Online Price Range
            </h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Market benchmark researched: {priceRange?.observedDate || 'September 2026'}
            </p>
          </div>
        </div>

        {priceReferences.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            <span>{priceReferences.length} Source{priceReferences.length > 1 ? 's' : ''}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Main Range Display */}
      {priceRange && (
        <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-serif">
            {formatPrice(priceRange.min)} – {formatPrice(priceRange.max)}
          </span>
          {currentPrice && (
            <span className="text-xs sm:text-sm font-medium text-stone-600">
              (This item: <strong className="text-stone-900">{formatPrice(currentPrice)}</strong>)
            </span>
          )}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="mt-3 flex items-start gap-2 text-xs text-stone-600 bg-white/70 p-2.5 rounded-xl border border-amber-100">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="italic leading-relaxed">
          {priceRange?.disclaimer ||
            'Prices may vary based on size, material, craftsmanship, artisan, location and seller.'}
        </p>
      </div>

      {/* Expandable Price Listings */}
      {isExpanded && priceReferences.length > 0 && (
        <div className="mt-4 pt-3 border-t border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span>Verified Marketplace / Archival Listings:</span>
            <Link
              to="/references"
              className="text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
            >
              All Sources <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {priceReferences.map((ref, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-amber-200/70 text-xs shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <a
                      href={ref.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-amber-900 hover:text-amber-700 inline-flex items-center gap-1"
                    >
                      {ref.sourceName}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    {ref.notes && (
                      <p className="text-stone-600 mt-1 leading-snug">{ref.notes}</p>
                    )}
                  </div>
                  <span className="font-serif font-bold text-stone-900 text-sm whitespace-nowrap bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                    {formatPrice(ref.price)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-stone-400">
                  Observed: {ref.accessedDate}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-stone-500 pt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Documented from publicly accessible online catalogs and artisan cooperatives.</span>
          </div>
        </div>
      )}
    </div>
  );
};
