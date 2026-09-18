import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Heart, Share2, MessageCircle, Clock, Package,
  Eye, CheckCircle2, ShieldCheck, BookOpen, Layers, ExternalLink
} from 'lucide-react';
import { MarketplaceLayout } from '../../layouts/MarketplaceLayout';
import { ProductCard } from '../../components/ProductCard';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { CredibilityBadge } from '../../components/CredibilityBadge';
import { PriceReferenceCard } from '../../components/PriceReferenceCard';
import { ContactArtisanModal } from '../../components/ContactArtisanModal';
import { VerificationDetailsModal } from '../../components/VerificationDetailsModal';
import { getProductById, getProductsByArtisan, getArtisanById, toggleWishlist, isWishlisted, getReferencesByIds } from '../../utils/storage';
import { formatRupees } from '../../utils/pricing';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { CulturalDivider } from '../../components/CulturalDivider';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const product = id ? getProductById(id) : undefined;
  const artisan = product ? getArtisanById(product.artisanId) : undefined;
  const [wishlisted, setWishlisted] = useState(() => id ? isWishlisted(id) : false);
  const linkedSources = product?.sourceIds ? getReferencesByIds(product.sourceIds) : [];

  const moreProducts = product ? getProductsByArtisan(product.artisanId)
    .filter(p => p.id !== product.id && p.status === 'published')
    .slice(0, 4) : [];

  const allImages = product?.images && product.images.length > 0
    ? product.images
    : product?.image
    ? [product.image]
    : [];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [verifDetailsOpen, setVerifDetailsOpen] = useState(false);

  const handleWishlist = () => {
    if (!id) return;
    const result = toggleWishlist(id);
    setWishlisted(result);
    addToast(result ? 'success' : 'info', result ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleContact = () => {
    setContactModalOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Link copied!', 'Share this product with others.');
  };

  if (!product) {
    return (
      <MarketplaceLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-earth-900 mb-3">Product not found</h2>
          <button onClick={() => navigate('/marketplace')} className="btn-primary">Back to Marketplace</button>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-earth-500 mb-6">
          <Link to="/marketplace" className="hover:text-brand-600 transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-brand-600">{product.craftCategory}</span>
          <span>/</span>
          <span className="text-earth-700 truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-16">
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl shadow-lg bg-earth-100">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex] || allImages[0]}
                  alt={product.name}
                  className="w-full aspect-square xs:aspect-[4/3] lg:aspect-auto lg:h-[480px] object-cover transition-all duration-300"
                />
              ) : (
                <PhotoPlaceholder type="product" className="w-full aspect-square xs:aspect-[4/3] lg:h-[480px] rounded-2xl" />
              )}
              <button
                onClick={handleWishlist}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-xs rounded-full shadow-lg hover:scale-110 transition-transform z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-brand-500 text-brand-500' : 'text-earth-400'}`} />
              </button>
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="badge-brand">{product.craftCategory}</span>
                {product.verificationLevel && (
                  <CredibilityBadge level={product.verificationLevel} size="sm" />
                )}
                {(product.craftCategory === 'Sohrai Art' || product.craftCategory === 'Khovar Art' || product.tags?.includes('#GITagged')) && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    GI Tagged Heritage
                  </span>
                )}
              </div>
            </div>

            {/* Multiple image thumbnails if more than 1 image exists */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105 shadow-xs'
                        : 'border-earth-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-brand-600/90 text-white text-[9px] font-bold text-center py-0.5">
                        Main
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge-brand">{product.craftCategory}</span>
              {product.verificationLevel && (
                <CredibilityBadge level={product.verificationLevel} size="md" />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-earth-900 mb-2">{product.name}</h1>
            <div className="text-3xl sm:text-4xl font-bold text-brand-700 mb-2">{formatRupees(product.price || 0)}</div>

            <div className="flex items-center gap-1 text-sm text-earth-500 mb-5">
              <Eye className="w-4 h-4" />
              <span>{product.views} people viewed this authentic craft</span>
            </div>

            {/* Observed Online Price Benchmark Card */}
            {(product.priceRange || (product.priceReferences && product.priceReferences.length > 0)) && (
              <PriceReferenceCard
                priceRange={product.priceRange}
                priceReferences={product.priceReferences}
                currentPrice={product.price}
                className="mb-6"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {(product.tags || []).map(tag => (
                <span key={tag} className="badge-earth text-xs">{tag}</span>
              ))}
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              <div className="bg-[#FAF5EC] border border-earth-200/90 rounded-xl p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-earth-600 font-semibold mb-1">Materials</p>
                <p className="font-medium text-earth-900 text-sm">{product.materials || 'Information not provided'}</p>
              </div>
              {product.dimensions && (
                <div className="bg-[#FAF5EC] border border-earth-200/90 rounded-xl p-3.5">
                  <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-earth-600 font-semibold mb-1">
                    <Layers className="w-3.5 h-3.5 text-brand-600" />
                    <span>Dimensions</span>
                  </div>
                  <p className="font-medium text-earth-900 text-sm">{product.dimensions}</p>
                </div>
              )}
              <div className="bg-[#FAF5EC] border border-earth-200/90 rounded-xl p-3.5">
                <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-earth-600 font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Production Time</span>
                </div>
                <p className="font-medium text-earth-900 text-sm">
                  {product.productionTimeDays ? `${product.productionTimeDays} days` : 'Information not provided'}
                </p>
              </div>
              <div className="bg-[#FAF5EC] border border-earth-200/90 rounded-xl p-3.5">
                <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-earth-600 font-semibold mb-1">
                  <Package className="w-3.5 h-3.5 text-brand-600" />
                  <span>In Stock</span>
                </div>
                <p className="font-medium text-earth-900 text-sm">
                  {product.stockQuantity !== undefined ? `${product.stockQuantity} available` : 'Information not provided'}
                </p>
              </div>
              <div className="bg-[#FAF5EC] border border-earth-200/90 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-earth-600 font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Origin</span>
                </div>
                <p className="font-medium text-earth-900 text-sm">{product.artisanDistrict}, Jharkhand</p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl bg-[#FAF5EC] border border-earth-200/80">
              <h3 className="font-serif font-bold text-earth-900 mb-1.5 text-base">About this product</h3>
              <p className="text-earth-700 leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* Cultural Significance & Reference */}
            {(product.productStory || product.reference || linkedSources.length > 0) && (
              <div className="card-warm p-5 mb-6 rounded-2xl border border-earth-300 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-600" />
                    <h4 className="font-serif font-bold text-earth-900 text-sm">Cultural Heritage & Verified Provenance</h4>
                  </div>
                  {product.verificationLevel && (
                    <CredibilityBadge level={product.verificationLevel} size="sm" />
                  )}
                </div>
                {product.productStory && (
                  <p className="text-xs text-earth-800 leading-relaxed mb-2">
                    {product.productStory}
                  </p>
                )}
                {product.reference && (
                  <div className="text-[11px] text-brand-800 font-medium mb-3">
                    Documentation: <span className="font-semibold">{product.reference}</span>
                  </div>
                )}
                {linkedSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-earth-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-earth-900">
                        Verified Sources & Public Registries ({linkedSources.length}):
                      </span>
                      <Link to="/references" className="text-[11px] text-brand-700 hover:text-brand-900 underline flex items-center gap-1 font-medium">
                        All Evidence Records <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="space-y-1.5">
                      {linkedSources.map(s => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 bg-white rounded-xl border border-earth-200 text-xs text-earth-900 hover:bg-earth-50 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="font-mono text-[10px] bg-brand-100 px-1.5 py-0.5 rounded text-brand-800 font-bold shrink-0">
                              {s.id}
                            </span>
                            <span className="truncate font-medium">{s.title}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-earth-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fair Price Transparency Breakdown */}
            {product.costs && (
              <div className="card-warm p-5 mb-6 border border-earth-300">
                <h4 className="font-serif font-bold text-earth-900 text-sm mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-600" />
                  Fair Price Transparency Breakdown
                </h4>
                <p className="text-xs text-earth-600 mb-3">
                  Direct artisan remuneration calculated with living wage standards:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-earth-200/90 shadow-2xs">
                    <span className="text-earth-500 block text-[11px]">Raw Materials</span>
                    <span className="font-semibold text-earth-900">{formatRupees(product.costs.rawMaterial)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-earth-200/90 shadow-2xs">
                    <span className="text-earth-500 block text-[11px]">Artisan Labour</span>
                    <span className="font-semibold text-earth-900">{formatRupees(product.costs.labour)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-earth-200/90 shadow-2xs">
                    <span className="text-earth-500 block text-[11px]">Packaging</span>
                    <span className="font-semibold text-earth-900">{formatRupees(product.costs.packaging)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-earth-200/90 shadow-2xs">
                    <span className="text-earth-500 block text-[11px]">Transportation</span>
                    <span className="font-semibold text-earth-900">{formatRupees(product.costs.transportation)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-earth-200/90 shadow-2xs">
                    <span className="text-earth-500 block text-[11px]">Other Direct</span>
                    <span className="font-semibold text-earth-900">{formatRupees(product.costs.other)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button onClick={handleContact} className="btn-primary w-full justify-center !py-3.5 min-h-[48px]">
                <MessageCircle className="w-5 h-5" />
                Contact Artisan Directly
              </button>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <button onClick={handleWishlist} className="btn-secondary justify-center min-h-[44px]">
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-brand-600 text-brand-600' : ''}`} />
                  {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
                <button onClick={handleShare} className="btn-secondary justify-center min-h-[44px]">
                  <Share2 className="w-4 h-4" />
                  Share Craft
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Artisan Info */}
        {artisan && (
          <div className="card-warm p-6 mb-12 border border-earth-300 shadow-xs">
            <h2 className="font-serif text-xl font-bold text-earth-900 mb-4 flex items-center gap-2">
              <span className="text-brand-600 text-xs">❖</span>
              <span>About the Master Artisan</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {artisan.profilePhoto ? (
                <img
                  src={artisan.profilePhoto}
                  alt={artisan.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-200 flex-shrink-0"
                />
              ) : (
                <PhotoPlaceholder type="artisan" compact className="w-16 h-16 rounded-2xl flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-serif font-bold text-lg text-earth-900">{artisan.name}</h3>
                  {artisan.verificationTier ? (
                    <CredibilityBadge
                      tier={artisan.verificationTier}
                      size="sm"
                      onClick={() => setVerifDetailsOpen(true)}
                    />
                  ) : artisan.isVerified ? (
                    <span className="badge-brand text-xs">✓ Verified</span>
                  ) : null}
                </div>
                <p className="text-xs text-brand-700 font-mono font-bold mb-1">{artisan.id}</p>
                <div className="flex items-center gap-1 text-xs text-earth-600 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {artisan.district}, Jharkhand · {
                      typeof artisan.yearsExperience === 'number'
                        ? `${artisan.yearsExperience} years experience`
                        : artisan.yearsExperience && artisan.yearsExperience !== 'Information not provided'
                        ? artisan.yearsExperience
                        : 'Experience: Information not provided'
                    }
                  </span>
                </div>
                <p className="text-sm text-earth-700 leading-relaxed line-clamp-2 mb-2">{artisan.story}</p>
                {artisan.reference && (
                  <p className="text-xs text-brand-800 font-medium">
                    Heritage Ref: {artisan.reference}
                  </p>
                )}
              </div>
              <Link to={`/artisan/${artisan.id}`} className="btn-secondary !px-4 !py-2 !text-xs flex-shrink-0">
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* More from this artisan */}
        {moreProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-earth-900">More from {product.artisanName}</h2>
              <Link to={`/artisan/${product.artisanId}`} className="text-sm text-brand-600 hover:underline">
                View all products
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {moreProducts.map(p => <ProductCard key={p.id} product={p} showArtisan={false} />)}
            </div>
          </div>
        )}
      </div>

      {/* Contact Artisan Modal */}
      {artisan && (
        <ContactArtisanModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          artisanId={artisan.id}
          artisanName={artisan.name}
          productId={product.id}
          productName={product.name}
          productPrice={product.price}
          onSuccess={() => {
            addToast('success', 'Enquiry Submitted', `Your enquiry was sent directly to ${artisan.name}.`);
          }}
        />
      )}

      {/* Verification Details Modal */}
      {artisan && (
        <VerificationDetailsModal
          isOpen={verifDetailsOpen}
          onClose={() => setVerifDetailsOpen(false)}
          artisanName={artisan.name}
          tier={artisan.verificationTier || 'LEVEL_0_UNVERIFIED'}
          records={artisan.verificationRecords}
        />
      )}
    </MarketplaceLayout>
  );
}
