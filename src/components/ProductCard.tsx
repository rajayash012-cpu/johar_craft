import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Heart, ShieldCheck } from 'lucide-react';
import type { Product } from '../types';
import { formatRupees } from '../utils/pricing';
import { toggleWishlist, isWishlisted } from '../utils/storage';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { CredibilityBadge } from './CredibilityBadge';
import { useLanguage } from '../i18n';

interface ProductCardProps {
  product: Product;
  showArtisan?: boolean;
}

export function ProductCard({ product, showArtisan = true }: ProductCardProps) {
  const { t } = useLanguage();
  const [wishlisted, setWishlisted] = React.useState(() => isWishlisted(product.id));

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const result = toggleWishlist(product.id);
    setWishlisted(result);
  };

  const isGITagged = product.craftCategory === 'Sohrai Art' || product.craftCategory === 'Khovar Art' || product.tags?.includes('#GITagged');

  return (
    <div className="bg-[#FAF5EC] rounded-2xl border border-earth-200/90 shadow-2xs hover:shadow-lg hover:border-earth-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden bg-earth-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <PhotoPlaceholder type="product" className="w-full h-52" />
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-[#FAF4EB]/90 backdrop-blur-xs rounded-full shadow-md hover:scale-110 transition-transform z-10 border border-earth-200 cursor-pointer"
            aria-label={t('product.wishlist')}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                wishlisted ? 'fill-brand-600 text-brand-600' : 'text-earth-500'
              }`}
            />
          </button>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <span className="badge-sand text-xs font-medium">{product.craftCategory}</span>
            {product.verificationLevel && (
              <CredibilityBadge level={product.verificationLevel} size="sm" />
            )}
            {isGITagged && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-forest-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                {t('product.gi_tag')}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-serif font-bold text-earth-900 mb-1 line-clamp-2 group-hover:text-brand-700 transition-colors">
            {product.name}
          </h3>
          {showArtisan && (
            <div className="flex items-center gap-1 text-xs text-earth-600 mb-1">
              <MapPin className="w-3 h-3 text-brand-600" />
              <span>{product.artisanDistrict}, {t('crafts.jharkhand')}</span>
            </div>
          )}
          {showArtisan && (
            <p className="text-xs text-earth-600 mb-2.5">
              {t('product.by_artisan', { name: product.artisanName })}
            </p>
          )}

          {product.priceRange && (
            <div className="text-[11px] text-earth-800 mb-2.5 bg-[#FAF4EB] px-2.5 py-1 rounded-md border border-earth-200/90 inline-block">
              {t('product.online_reference')} <span className="font-semibold">₹{product.priceRange.min} – ₹{product.priceRange.max}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-earth-200/70">
            <span className="text-lg font-display font-bold text-brand-700">{formatRupees(product.price || 0)}</span>
            <div className="flex items-center gap-1 text-xs text-earth-600">
              <Eye className="w-3.5 h-3.5" />
              <span>{product.views}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
