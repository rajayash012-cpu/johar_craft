import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Award, Phone, Clock, QrCode, Share2, ArrowLeft, ShieldCheck, BookOpen, ExternalLink, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MarketplaceLayout } from '../../layouts/MarketplaceLayout';
import { getAllArtisans, getProductsByArtisan, incrementProfileView, getReferencesByIds } from '../../utils/storage';
import { ProductCard } from '../../components/ProductCard';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { CredibilityBadge } from '../../components/CredibilityBadge';
import { VerificationDetailsModal } from '../../components/VerificationDetailsModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { CulturalDivider } from '../../components/CulturalDivider';

export function PublicArtisanProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const artisan = id ? getAllArtisans().find(a => a.id === id) : undefined;
  const products = id ? getProductsByArtisan(id).filter(p => p.status === 'published') : [];
  const linkedSources = artisan?.sourceIds ? getReferencesByIds(artisan.sourceIds) : [];

  useEffect(() => {
    if (id) incrementProfileView(id);
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Profile link copied!');
  };

  if (!artisan) {
    return (
      <MarketplaceLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-earth-900 mb-3">Artisan profile not found</h2>
          <button onClick={() => navigate('/marketplace?tab=artisans')} className="btn-primary">
            View All Artisans
          </button>
        </div>
      </MarketplaceLayout>
    );
  }

  const profileUrl = `${window.location.origin}/artisan/${artisan.id}`;

  const experienceDisplay = typeof artisan.yearsExperience === 'number'
    ? `${artisan.yearsExperience} years experience`
    : artisan.yearsExperience && artisan.yearsExperience !== 'Information not provided'
    ? artisan.yearsExperience
    : 'Information not provided';

  return (
    <MarketplaceLayout>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-earth-500 hover:text-earth-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <div className="card-warm overflow-hidden mb-8 border border-earth-300 shadow-xs">
          <div className="h-40 bg-gradient-to-r from-[#4A2C20] via-[#964525] to-[#B85C38] relative pattern-sohrai">
            <div className="absolute inset-0 bg-[#29231F]/30" />
          </div>
          <div className="px-4 sm:px-6 pb-6 relative -mt-16">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-6">
              {artisan.profilePhoto ? (
                <img
                  src={artisan.profilePhoto}
                  alt={artisan.name}
                  className="w-24 sm:w-28 h-24 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-lg flex-shrink-0"
                />
              ) : (
                <PhotoPlaceholder type="artisan" className="w-24 sm:w-28 h-24 sm:h-28 rounded-2xl border-4 border-white shadow-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-3xl font-serif font-bold text-earth-900">{artisan.name}</h1>
                  {artisan.verificationTier ? (
                    <CredibilityBadge
                      tier={artisan.verificationTier}
                      size="md"
                      onClick={() => setDetailsModalOpen(true)}
                    />
                  ) : artisan.isVerified ? (
                    <span className="badge-brand inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Verified Artisan ID
                    </span>
                  ) : null}
                  {artisan.verificationLevel && !artisan.verificationTier && (
                    <CredibilityBadge level={artisan.verificationLevel} size="md" />
                  )}
                </div>
                <p className="text-brand-700 font-mono font-bold text-sm mb-2">{artisan.id}</p>
                <div className="flex flex-wrap gap-3 text-sm text-earth-700 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{artisan.district}, Jharkhand</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-brand-600">🏺</span>
                    <span>{artisan.craftCategory}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>{experienceDisplay}</span>
                  </div>
                </div>
                {(artisan.organization || artisan.cluster) && (
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-earth-800">
                    {artisan.organization && (
                      <span className="inline-flex items-center gap-1 bg-[#FAF4EB] text-earth-900 px-2.5 py-1 rounded-md border border-earth-200">
                        <Building2 className="w-3 h-3 text-brand-600" />
                        {artisan.organization}
                      </span>
                    )}
                    {artisan.cluster && (
                      <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-900 px-2.5 py-1 rounded-md border border-brand-200">
                        📍 {artisan.cluster}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleShare} className="btn-secondary !px-4 !py-2 !text-xs min-h-[44px]">
                  <Share2 className="w-3.5 h-3.5" />
                  Share Profile
                </button>
                <Link to={`/artisan/${artisan.id}/qr`} className="btn-primary !px-4 !py-2 !text-xs min-h-[44px]">
                  <QrCode className="w-3.5 h-3.5" />
                  QR Identity
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-semibold text-earth-900 mb-4">Artisan Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Profile Views', value: artisan.profileViews || 0 },
                  { label: 'Product Views', value: artisan.productViews || 0 },
                  { label: 'Buyer Enquiries', value: artisan.enquiries || 0 },
                  { label: 'Products Listed', value: products.length },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-earth-600">{item.label}</span>
                    <span className="font-bold text-earth-900">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="card p-5">
              <h3 className="font-semibold text-earth-900 mb-3">Contact & Location</h3>
              <div className="flex items-center gap-2 text-sm text-earth-700 mb-2">
                <Phone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span>{artisan.phone || 'Information not provided'}</span>
              </div>
              <p className="text-xs text-earth-600">
                📍 {artisan.village && artisan.village !== 'Information not provided' ? `${artisan.village}, ` : ''}{artisan.district}, Jharkhand
              </p>
              {artisan.reference && (
                <div className="mt-3 pt-3 border-t border-earth-100 flex items-start gap-1.5 text-xs text-brand-800">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-600" />
                  <span>{artisan.reference}</span>
                </div>
              )}
            </div>

            {/* Verified Citations & Evidence Sources */}
            {linkedSources.length > 0 && (
              <div className="card p-5 border border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified Records ({linkedSources.length})
                  </h3>
                  <Link to="/references" className="text-xs text-amber-800 underline">
                    All Sources
                  </Link>
                </div>
                <div className="space-y-2">
                  {linkedSources.map(s => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2.5 bg-white rounded-xl border border-amber-200/80 text-xs text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">
                          {s.id}
                        </span>
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </div>
                      <p className="font-semibold text-stone-900 truncate">{s.title}</p>
                      <p className="text-[11px] text-stone-500 truncate">{s.sourceName}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* QR Preview */}
            <div className="card p-5">
              <h3 className="font-semibold text-earth-900 mb-4">QR Identity</h3>
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white border-2 border-earth-100 rounded-xl shadow-inner">
                  <QRCodeSVG
                    value={profileUrl}
                    size={120}
                    fgColor="#3a160c"
                    bgColor="#ffffff"
                    level="M"
                  />
                </div>
              </div>
              <p className="text-xs text-center text-earth-500">Scan to view profile</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="card-warm p-6 border border-earth-300 shadow-xs">
              <CulturalDivider label="THE ARTISAN'S STORY" className="mb-4 !my-0" />
              <p className="text-earth-700 leading-relaxed text-sm sm:text-base font-serif italic text-center max-w-xl mx-auto py-2">
                "{artisan.story}"
              </p>
            </div>

            {/* Products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-earth-900">
                  Products by {artisan.name}
                </h2>
                <span className="badge-sand text-xs font-semibold">{products.length} crafts listed</span>
              </div>
              {products.length === 0 ? (
                <div className="card-warm p-10 text-center border border-earth-200">
                  <p className="text-earth-600">No products listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(p => <ProductCard key={p.id} product={p} showArtisan={false} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {artisan && (
        <VerificationDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          artisanName={artisan.name}
          tier={artisan.verificationTier || 'LEVEL_0_UNVERIFIED'}
          records={artisan.verificationRecords}
        />
      )}
    </MarketplaceLayout>
  );
}
