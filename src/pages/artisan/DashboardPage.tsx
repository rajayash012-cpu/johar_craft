import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Eye, MessageSquare, TrendingUp, Star,
  PlusCircle, QrCode, Calculator, ArrowRight, Users,
  ShieldCheck, CheckCircle2, Award, Building2, Smartphone, Sparkles
} from 'lucide-react';
import { getArtisan, getProductsByArtisan, getArtisanVerification, getEnquiries } from '../../utils/storage';
import { getTierLabel } from '../../services/verificationService';
import { formatRupees } from '../../utils/pricing';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { REAL_ARTISANS } from '../../data/artisans';
import { useLanguage } from '../../i18n';
import { useViewMode } from '../../context/ViewModeContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isMobile } = useViewMode();
  const registeredArtisan = getArtisan();
  const isDemoPreview = !registeredArtisan;
  const artisan = registeredArtisan || REAL_ARTISANS[0];
  const products = artisan ? getProductsByArtisan(artisan.id) : [];
  const publishedProducts = products.filter(p => p.status === 'published');
  const verifProfile = getArtisanVerification(artisan?.id || 'JH-ART-0001');

  // Load enquiries for this artisan, falling back to recent enquiries if none
  const directEnquiries = artisan ? getEnquiries(artisan.id) : [];
  const displayEnquiries = directEnquiries.length > 0 ? directEnquiries : getEnquiries().slice(0, 3);

  const stats = [
    { label: t('nav.products'), value: publishedProducts.length, icon: Package, color: 'bg-brand-100 text-brand-600', trend: t('artisan.trend_month') },
    { label: t('artisan.profile_views'), value: artisan?.profileViews ?? 0, icon: Eye, color: 'bg-blue-100 text-blue-600', trend: t('artisan.trend_views_week') },
    { label: t('artisan.product_views'), value: artisan?.productViews ?? 0, icon: TrendingUp, color: 'bg-green-100 text-green-600', trend: t('artisan.trend_prod_week') },
    { label: t('artisan.recent_enquiries'), value: (artisan?.enquiries ?? 0) + directEnquiries.length, icon: MessageSquare, color: 'bg-purple-100 text-purple-600', trend: t('artisan.trend_enquiries') },
  ];

  const profileFields = [
    { label: t('artisan.my_profile'), done: !!artisan?.name },
    { label: t('artisan.upload_photo'), done: !!artisan?.profilePhoto },
    { label: t('artisan.craft_category'), done: !!artisan?.craftCategory },
    { label: t('artisan.bio'), done: !!artisan?.story },
    { label: t('nav.verification'), done: verifProfile.tier !== 'LEVEL_0_UNVERIFIED' },
    { label: t('artisan.first_product'), done: publishedProducts.length > 0 },
  ];
  const completedFields = profileFields.filter(f => f.done).length;
  const completionPercent = Math.round((completedFields / profileFields.length) * 100);

  const quickActions = [
    { label: `+ ${t('nav.add_product')}`, to: '/artisan/products/add', icon: PlusCircle, color: 'bg-brand-600 text-white hover:bg-brand-700' },
    { label: `✨ ${t('nav.smart_catalog')}`, to: '/artisan/smart-catalog', icon: Sparkles, color: 'bg-amber-600 text-white hover:bg-amber-700' },
    { label: t('nav.verification'), to: '/artisan/verification', icon: ShieldCheck, color: 'bg-amber-700 text-white hover:bg-amber-800' },
    { label: t('nav.profile'), to: `/artisan/${artisan.id}`, icon: Users, color: 'bg-blue-600 text-white hover:bg-blue-700' },
    { label: t('nav.pricing'), to: '/artisan/pricing', icon: Calculator, color: 'bg-purple-600 text-white hover:bg-purple-700' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {isDemoPreview && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md text-[11px]">
              {t('artisan.demo_banner')}
            </span>
            <span>{t('artisan.demo_preview_desc', { id: artisan.id })}</span>
          </div>
          <Link to="/artisan/profile" className="font-semibold underline hover:text-amber-950 shrink-0">
            {t('artisan.create_custom_profile')}
          </Link>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#B85C38] via-[#964525] to-[#4A2C20] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute inset-0 pattern-sohrai opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          {artisan.profilePhoto ? (
            <img
              src={artisan.profilePhoto}
              alt={artisan.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-xs"
            />
          ) : (
            <PhotoPlaceholder type="artisan" compact className="w-16 h-16 rounded-2xl border-2 border-white/40 bg-white/20 text-white" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                {t('artisan.welcome_back', { name: artisan.name.split(' ')[0] })}
              </h1>
              <span className="text-sm">🌾</span>
            </div>
            <p className="text-brand-100 text-xs sm:text-sm mt-0.5">{artisan.id} · {artisan.district}, {t('crafts.jharkhand')}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-white border border-white/20">
              <Star className="w-3 h-3 fill-white" /> {artisan.isVerified ? t('artisan.verified_master') : t('artisan.registered_artisan')}
            </span>
          </div>
        </div>
      </div>

      {/* Trust & Verification Status Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
        verifProfile.tier === 'LEVEL_3_BUSINESS_VERIFIED'
          ? 'bg-forest-50 border-forest-200'
          : verifProfile.tier === 'LEVEL_2_ARTISAN_VERIFIED'
          ? 'bg-[#FAF5EC] border-earth-300'
          : verifProfile.tier === 'LEVEL_1_IDENTITY_VERIFIED'
          ? 'bg-[#FAF5EC] border-earth-300'
          : 'bg-[#FAF5EC] border-earth-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            verifProfile.tier === 'LEVEL_3_BUSINESS_VERIFIED'
              ? 'bg-forest-600 text-white'
              : verifProfile.tier === 'LEVEL_2_ARTISAN_VERIFIED'
              ? 'bg-brand-600 text-white'
              : verifProfile.tier === 'LEVEL_1_IDENTITY_VERIFIED'
              ? 'bg-brand-600 text-white'
              : 'bg-earth-400 text-white'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-earth-700">
                {t('artisan.verification_status')}
              </span>
              <span className="text-xs font-bold text-earth-900 bg-white px-2 py-0.5 rounded-md border border-earth-300">
                {getTierLabel(verifProfile.tier)}
              </span>
            </div>
            <p className="text-xs text-earth-600 mt-0.5">
              {verifProfile.tier === 'LEVEL_3_BUSINESS_VERIFIED'
                ? t('artisan.level_3_desc')
                : verifProfile.tier === 'LEVEL_2_ARTISAN_VERIFIED'
                ? t('artisan.level_2_desc')
                : verifProfile.tier === 'LEVEL_1_IDENTITY_VERIFIED'
                ? t('artisan.level_1_desc')
                : t('artisan.level_0_desc')}
            </p>
          </div>
        </div>
        <Link
          to="/artisan/verification"
          className="btn-secondary !py-1.5 !px-3.5 !text-xs shrink-0 self-start sm:self-auto flex items-center gap-1"
        >
          <span>{verifProfile.tier === 'LEVEL_0_UNVERIFIED' ? t('verification.verify_now') : t('verification.identity_verified')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Smart Catalog Section Card */}
      <div className="card-warm p-6 border border-earth-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-earth-900">{t('nav.smart_catalog')}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                {t('artisan.assistive_ai')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-earth-700 mt-1 max-w-xl leading-relaxed">
              {t('artisan.smart_catalog_desc')}
            </p>
          </div>
        </div>
        <Link
          to="/artisan/smart-catalog"
          className="btn-primary shrink-0 self-start sm:self-center !px-5 !py-2.5 !text-xs sm:!text-sm flex items-center gap-2 shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ {t('nav.smart_catalog')}</span>
        </Link>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-4'}`}>
        {stats.map(stat => (
          <div key={stat.label} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-earth-900">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-earth-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="font-semibold text-earth-900 mb-4">{t('artisan.quick_actions')}</h3>
          <div className="space-y-2">
            {quickActions.map(action => (
              <Link
                key={action.label}
                to={action.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${action.color}`}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            ))}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-earth-900">{t('artisan.profile_completion')}</h3>
            <span className="text-lg font-bold text-brand-600">{completionPercent}%</span>
          </div>
          <div className="w-full bg-earth-100 rounded-full h-2 mb-4">
            <div className="bg-brand-600 h-2 rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="space-y-2">
            {profileFields.map(field => (
              <div key={field.label} className="flex items-center gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${field.done ? 'bg-green-100 text-green-600' : 'bg-earth-100 text-earth-400'}`}>
                  {field.done ? '✓' : '○'}
                </div>
                <span className={field.done ? 'text-earth-700' : 'text-earth-400'}>{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-earth-900">{t('artisan.recent_products')}</h3>
            <Link to="/artisan/products" className="text-xs text-brand-600 hover:underline">{t('artisan.view_all_products')}</Link>
          </div>
          {publishedProducts.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-10 h-10 text-earth-300 mx-auto mb-2" />
              <p className="text-sm text-earth-500">{t('artisan.no_products_yet')}</p>
              <Link to="/artisan/products/add" className="text-sm text-brand-600 hover:underline mt-1 block">
                {t('artisan.add_first_product')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedProducts.slice(0, 4).map(product => (
                <div key={product.id} className="flex items-center gap-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <PhotoPlaceholder type="product" compact className="w-10 h-10 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900 truncate">{product.name}</p>
                    <p className="text-xs text-brand-600">{formatRupees(product.price || 0)}</p>
                  </div>
                  <span className="badge-green text-xs">{t('product.views_count', { count: product.views })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Buyer Enquiries with Trust Badges */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-earth-900">{t('artisan.recent_enquiries')}</h3>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
              {t('artisan.active_enquiries', { count: displayEnquiries.length })}
            </span>
          </div>
          <span className="text-xs text-stone-500">{t('artisan.verified_buyer_credentials')}</span>
        </div>

        <div className="space-y-3">
          {displayEnquiries.map(enq => (
            <div
              key={enq.id}
              className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-stone-900">{enq.buyer.name}</span>
                  {enq.buyer.buyerType === 'BUSINESS' && enq.buyer.businessName && (
                    <span className="text-xs text-stone-600 font-medium">
                      ({enq.buyer.businessName})
                    </span>
                  )}
                  {enq.buyer.verificationBadges.map(b => (
                    <span
                      key={b}
                      className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> {b}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-stone-400">
                  {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>

              <p className="text-xs text-stone-700 mb-2 italic">
                "{enq.message}"
              </p>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200/60">
                <span>
                  {t('artisan.product_label')} <strong className="text-stone-800">{enq.productName}</strong> ({t('artisan.qty_label')} {enq.quantity})
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  {t('artisan.status_label')} {enq.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
