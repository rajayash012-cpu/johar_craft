import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  ShoppingBag,
  UserCheck,
  HelpCircle,
  Award,
  Building2,
} from 'lucide-react';
import type { VerificationLevel, ArtisanVerificationTier } from '../types';
import { useLanguage } from '../i18n';

interface CredibilityBadgeProps {
  level?: VerificationLevel;
  tier?: ArtisanVerificationTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CredibilityBadge: React.FC<CredibilityBadgeProps> = ({
  level,
  tier,
  size = 'md',
  showLabel = true,
  className = '',
  onClick,
}) => {
  const { t } = useLanguage();

  // If tier is provided, configure based on Artisan Verification Tier
  if (tier) {
    const tierConfigs = {
      LEVEL_3_BUSINESS_VERIFIED: {
        label: t('verification.tier_3'),
        shortLabel: t('verification.badge_business'),
        icon: Building2,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        iconColor: 'text-emerald-600',
        tooltip: t('verification.tooltip_business'),
      },
      LEVEL_2_ARTISAN_VERIFIED: {
        label: t('verification.tier_2'),
        shortLabel: t('verification.badge_artisan'),
        icon: Award,
        bg: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
        iconColor: 'text-blue-600',
        tooltip: t('verification.tooltip_artisan'),
      },
      LEVEL_1_IDENTITY_VERIFIED: {
        label: t('verification.tier_1'),
        shortLabel: t('verification.badge_identity'),
        icon: ShieldCheck,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        iconColor: 'text-emerald-600',
        tooltip: t('verification.tooltip_identity'),
      },
      LEVEL_0_UNVERIFIED: {
        label: t('verification.tier_0'),
        shortLabel: t('verification.badge_unverified'),
        icon: HelpCircle,
        bg: 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100',
        iconColor: 'text-stone-400',
        tooltip: t('verification.tooltip_unverified'),
      },
    };

    const config = tierConfigs[tier] || tierConfigs.LEVEL_0_UNVERIFIED;
    const Icon = config.icon;

    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5 gap-1',
      md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
      lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
    }[size];

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }[size];

    const isClickable = Boolean(onClick);

    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center rounded-full border transition-colors ${
          isClickable
            ? 'cursor-pointer hover:shadow-xs active:scale-95'
            : 'cursor-help'
        } ${config.bg} ${sizeClasses} ${className}`}
        title={config.tooltip}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
      >
        <Icon className={`${iconSizes} ${config.iconColor} shrink-0`} />
        {showLabel && (
          <span>{size === 'sm' ? config.shortLabel : config.label}</span>
        )}
      </span>
    );
  }

  // Fallback to legacy VerificationLevel (for craft origins and price references)
  const currentLevel = level || 'UNKNOWN';
  const levelConfigs = {
    VERIFIED_OFFICIAL: {
      label: t('buyer.gi_tagged'),
      shortLabel: t('product.gi_tag'),
      icon: ShieldCheck,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      iconColor: 'text-emerald-600',
      tooltip: t('verification.tooltip_identity'),
    },
    PUBLICLY_DOCUMENTED: {
      label: t('references.badge'),
      shortLabel: t('references.badge'),
      icon: BookOpen,
      bg: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      tooltip: t('references.desc'),
    },
    MARKET_REFERENCE: {
      label: t('product.online_reference'),
      shortLabel: t('product.online_reference'),
      icon: ShoppingBag,
      bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      iconColor: 'text-amber-600',
      tooltip: t('product.online_reference'),
    },
    USER_PROVIDED: {
      label: t('verification.tier_2'),
      shortLabel: t('verification.badge_artisan'),
      icon: UserCheck,
      bg: 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
      iconColor: 'text-stone-500',
      tooltip: t('verification.tier_2'),
    },
    UNKNOWN: {
      label: t('verification.unverified'),
      shortLabel: t('verification.unverified'),
      icon: HelpCircle,
      bg: 'bg-gray-50 text-gray-600 border-gray-200',
      iconColor: 'text-gray-400',
      tooltip: t('verification.unverified'),
    },
  };

  const config = levelConfigs[currentLevel] || levelConfigs.UNKNOWN;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const isClickable = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-colors ${
        isClickable ? 'cursor-pointer hover:shadow-xs active:scale-95' : 'cursor-help'
      } ${config.bg} ${sizeClasses} ${className}`}
      title={config.tooltip}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <Icon className={`${iconSizes} ${config.iconColor} shrink-0`} />
      {showLabel && (
        <span>{size === 'sm' ? config.shortLabel : config.label}</span>
      )}
    </span>
  );
};

export default CredibilityBadge;
