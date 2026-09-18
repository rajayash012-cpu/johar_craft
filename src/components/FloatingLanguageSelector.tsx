import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useLanguage } from '../i18n';

export function FloatingLanguageSelector() {
  const { language, setLanguage, currentLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside (mouse, touch, click)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-40 right-2.5 sm:right-3 bottom-16 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 select-none print:hidden"
    >
      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('common.change_language') || 'Change language'}
        className={`group flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full border transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand-500/40 min-h-[44px] ${
          isOpen
            ? 'bg-earth-800 text-earth-50 border-earth-900 ring-2 ring-brand-500/30'
            : 'bg-[#FAF4EB]/95 hover:bg-[#FAF4EB] text-earth-900 border-earth-300 hover:border-brand-600/70 hover:-translate-x-0.5'
        }`}
      >
        <Globe className={`w-4 h-4 transition-transform group-hover:rotate-12 ${isOpen ? 'text-brand-200' : 'text-brand-600'}`} />
        
        {/* Desktop: Full Native Name */}
        <span className="hidden sm:inline font-medium text-xs tracking-wide">
          {currentLanguage.name}
        </span>
        {/* Mobile: Compact 2-letter Code */}
        <span className="sm:hidden font-semibold text-xs tracking-wider">
          {currentLanguage.shortLabel}
        </span>

        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 opacity-70" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:translate-y-0.5 transition-transform" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={t('common.select_language') || 'Select Language'}
          className={[
            'absolute bg-[#FAF5EC]/98 backdrop-blur-md rounded-2xl shadow-xl border border-earth-300 py-2',
            'animate-in fade-in zoom-in-95 duration-150 overflow-hidden',
            // Mobile: above button, right-aligned, capped width
            'bottom-full mb-2 right-0 w-[min(240px,calc(100vw-24px))]',
            // Desktop (sm+): to the left of button, vertically centered
            'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-full sm:mr-3 sm:w-60',
          ].join(' ')}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-earth-200/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-earth-600 uppercase tracking-wider">
              {t('common.language')}
            </span>
            <span className="text-[10px] text-brand-700 font-medium px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200/70">
              8 Languages
            </span>
          </div>

          {/* Languages list — limited height so it fits on 375px screen */}
          <div className="max-h-[min(288px,60vh)] overflow-y-auto py-1 divide-y divide-earth-100">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer text-xs group min-h-[44px] ${
                    isSelected
                      ? 'bg-[#F4E5D3] text-earth-950 font-semibold'
                      : 'text-earth-800 hover:bg-earth-100/70 hover:text-earth-950'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight group-hover:text-brand-700 transition-colors">
                      {lang.name}
                    </span>
                    <span className="text-[10px] text-earth-600 mt-0.5">
                      {lang.englishName}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subtle footer */}
          <div className="px-3.5 py-1.5 bg-earth-100/70 border-t border-earth-200/70 text-[10px] text-earth-600 text-center italic">
            Jharkhand Regional Languages
          </div>
        </div>
      )}
    </div>
  );
}
export default FloatingLanguageSelector;
