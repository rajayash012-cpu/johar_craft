import React from 'react';
import { Monitor, Smartphone, Sliders } from 'lucide-react';
import { useViewMode, ViewModePreference } from '../context/ViewModeContext';
import { useLanguage } from '../i18n';

interface ViewModeSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function ViewModeSwitcher({ compact = false, className = '' }: ViewModeSwitcherProps) {
  const { preference, setPreference } = useViewMode();
  const { t } = useLanguage();

  const options: { id: ViewModePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'desktop',
      label: t('nav.view_desktop') || 'Desktop',
      icon: Monitor,
    },
    {
      id: 'mobile',
      label: t('nav.view_mobile') || 'Mobile',
      icon: Smartphone,
    },
    {
      id: 'auto',
      label: t('nav.view_auto') || 'Auto',
      icon: Sliders,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="View Mode Switcher"
      className={`inline-flex items-center bg-[#F4EBE0] p-1 rounded-xl border border-earth-300 shadow-2xs select-none ${className}`}
    >
      {options.map(opt => {
        const active = preference === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(opt.id)}
            title={`${opt.label} view`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
              active
                ? 'bg-brand-600 text-white font-semibold shadow-xs'
                : 'text-earth-700 hover:text-earth-950 hover:bg-earth-200/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-earth-600'}`} />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ViewModeSwitcher;
