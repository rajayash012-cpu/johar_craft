import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Award, Package } from 'lucide-react';
import type { Artisan } from '../types';
import { getProductsByArtisan } from '../utils/storage';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { CredibilityBadge } from './CredibilityBadge';
import { useLanguage } from '../i18n';

interface ArtisanCardProps {
  artisan: Artisan;
}

export function ArtisanCard({ artisan }: ArtisanCardProps) {
  const { t } = useLanguage();
  const productCount = getProductsByArtisan(artisan.id).filter(p => p.status === 'published').length;

  const experienceText = typeof artisan.yearsExperience === 'number'
    ? t('artisan.years_exp', { count: artisan.yearsExperience })
    : artisan.yearsExperience && artisan.yearsExperience !== 'Information not provided'
    ? artisan.yearsExperience
    : t('common.na');

  return (
    <div className="card-hover group p-5">
      <Link to={`/artisan/${artisan.id}`} className="block">
        <div className="flex items-center gap-4 mb-4">
          {artisan.profilePhoto ? (
            <img
              src={artisan.profilePhoto}
              alt={artisan.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-200 group-hover:border-brand-400 transition-colors"
            />
          ) : (
            <PhotoPlaceholder type="artisan" compact className="w-16 h-16 rounded-full border-2 border-stone-200" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-semibold text-earth-900 truncate group-hover:text-brand-700 transition-colors">
                {artisan.name}
              </h3>
              {artisan.isVerified && (
                <Award className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-brand-600 font-medium">{artisan.id}</p>
            {artisan.verificationTier ? (
              <div className="mt-1">
                <CredibilityBadge tier={artisan.verificationTier} size="sm" />
              </div>
            ) : artisan.verificationLevel ? (
              <div className="mt-1">
                <CredibilityBadge level={artisan.verificationLevel} size="sm" />
              </div>
            ) : null}
            {artisan.organization && (
              <p className="text-[11px] text-stone-500 truncate mt-1">{artisan.organization}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-earth-600">
            <MapPin className="w-3.5 h-3.5 text-brand-500" />
            <span>{artisan.district}, {t('crafts.jharkhand')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-earth-600">
            <Package className="w-3.5 h-3.5 text-brand-500" />
            <span>{artisan.craftCategory}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-earth-100">
          <span className="text-xs text-earth-500 truncate max-w-[130px]">{experienceText}</span>
          <span className="badge-brand">{t('artisan.product_count', { count: productCount })}</span>
        </div>
      </Link>
    </div>
  );
}

export default ArtisanCard;
