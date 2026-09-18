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
  // If tier is provided, configure based on Artisan Verification Tier
  if (tier) {
    const tierConfigs = {
      LEVEL_3_BUSINESS_VERIFIED: {
        label: 'Business Registration Verified',
        shortLabel: 'Business Verified',
        icon: Building2,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        iconColor: 'text-emerald-600',
        tooltip: 'Business credentials verified (MSME or GSTIN). Click to view verification details.',
      },
      LEVEL_2_ARTISAN_VERIFIED: {
        label: 'Artisan Registration Provided',
        shortLabel: 'Artisan Verified',
        icon: Award,
        bg: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
        iconColor: 'text-blue-600',
        tooltip: 'Pehchan Artisan ID Card verified with DC (Handicrafts). Click to view verification details.',
      },
      LEVEL_1_IDENTITY_VERIFIED: {
        label: 'Identity Verified',
        shortLabel: 'Identity Verified',
        icon: ShieldCheck,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        iconColor: 'text-emerald-600',
        tooltip: 'Government digital KYC completed. Click to view verification details.',
      },
      LEVEL_0_UNVERIFIED: {
        label: 'Not Verified',
        shortLabel: 'Not Verified',
        icon: HelpCircle,
        bg: 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100',
        iconColor: 'text-stone-400',
        tooltip: 'Verification documents pending submission.',
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
      label: 'Verified Official / GI Tag',
      shortLabel: 'Govt / GI Tagged',
      icon: ShieldCheck,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      iconColor: 'text-emerald-600',
      tooltip: 'Documented by official Govt records, GI Registry, or DC Handicrafts.',
    },
    PUBLICLY_DOCUMENTED: {
      label: 'Publicly Documented Craft',
      shortLabel: 'Publicly Documented',
      icon: BookOpen,
      bg: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      tooltip: 'Documented by reputable cultural institutions, TWAC, INTACH, or research archives.',
    },
    MARKET_REFERENCE: {
      label: 'Market Price Reference',
      shortLabel: 'Market Reference',
      icon: ShoppingBag,
      bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      iconColor: 'text-amber-600',
      tooltip: 'Observed on public marketplaces (Tribes India, Jharcraft emporiums).',
    },
    USER_PROVIDED: {
      label: 'Artisan Submitted',
      shortLabel: 'Artisan Submitted',
      icon: UserCheck,
      bg: 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
      iconColor: 'text-stone-500',
      tooltip: 'Directly provided by the registered artisan.',
    },
    UNKNOWN: {
      label: 'Unverified',
      shortLabel: 'Unverified',
      icon: HelpCircle,
      bg: 'bg-gray-50 text-gray-600 border-gray-200',
      iconColor: 'text-gray-400',
      tooltip: 'Information pending verification.',
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
