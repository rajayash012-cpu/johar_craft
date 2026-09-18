import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, ArrowRight, Info, X } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getArtisan } from '../utils/storage';
import { useLanguage } from '../i18n';
import { useAccount } from '../context/AccountContext';
import { AccountSwitcher } from '../components/AccountSwitcher';
import { ViewModeSwitcher } from '../components/ViewModeSwitcher';
import { AddAccountModal } from '../components/AddAccountModal';

import { CulturalDivider } from '../components/CulturalDivider';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accounts, activeAccount, switchAccount } = useAccount();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [addAccountModal, setAddAccountModal] = useState<'artisan' | 'buyer' | null>(null);

  const handleArtisanClick = () => {
    if (activeAccount && activeAccount.type === 'artisan') {
      navigate('/artisan');
      return;
    }
    const artisanAcc = accounts.find(a => a.type === 'artisan');
    if (artisanAcc) {
      switchAccount(artisanAcc.id);
      navigate('/artisan');
    } else {
      setAddAccountModal('artisan');
    }
  };

  const handleBuyerClick = () => {
    if (activeAccount && activeAccount.type === 'buyer') {
      navigate('/marketplace');
      return;
    }
    const buyerAcc = accounts.find(a => a.type === 'buyer');
    if (buyerAcc) {
      switchAccount(buyerAcc.id);
      navigate('/marketplace');
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F0E3] text-earth-950 flex flex-col justify-between selection:bg-brand-200 selection:text-brand-900 relative overflow-hidden">
      {/* Subtle Sohrai Pattern Ambient Background */}
      <div className="absolute inset-0 pattern-sohrai opacity-[0.035] pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-[#E8CAAC]/30 via-[#E8D6B8]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Minimal Cultural Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-4 w-px bg-earth-300 hidden sm:block" />
          <span className="text-xs tracking-wider text-earth-600 font-medium uppercase hidden sm:block">
            {t('brand.tagline')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <ViewModeSwitcher compact />
          <AccountSwitcher compact />
          <button
            onClick={() => setAboutOpen(true)}
            className="text-xs font-semibold text-earth-800 hover:text-earth-950 transition-colors px-3.5 py-1.5 rounded-full border border-earth-300 hover:border-brand-600 bg-[#FAF4EB]/80 backdrop-blur-xs cursor-pointer shadow-2xs"
          >
            {t('landing.about_btn')}
          </button>
        </div>
      </header>

      {/* Main Centered Hero */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 sm:py-12 my-auto text-center w-full">
        {/* Traditional Heritage Micro-Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF4EB] border border-earth-300/80 mb-6 shadow-2xs">
          <span className="text-brand-600 text-xs">❖</span>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-earth-700">
            {t('landing.heritage_badge')}
          </span>
          <span className="text-brand-600 text-xs">❖</span>
        </div>

        {/* Brand & Subtitle */}
        <div className="space-y-4 mb-8 sm:mb-10">
          <h1 className="font-serif text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-earth-900 leading-[1.1]">
            {t('landing.hero_title_1')}{' '}
            <span className="text-brand-600 font-serif italic">{t('landing.hero_title_2')}</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-earth-800 font-serif font-normal max-w-xl mx-auto leading-snug">
            {t('landing.hero_tagline')}
          </p>

          <p className="text-sm sm:text-base text-earth-700 max-w-lg mx-auto leading-relaxed">
            {t('landing.hero_desc')}
          </p>
        </div>

        {/* Cultural Divider with Prompt */}
        <div className="max-w-md mx-auto mb-8">
          <CulturalDivider label={t('landing.prompt')} />
        </div>

        {/* The Two Dominant Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
          {/* Choice 1: Artisan */}
          <button
            type="button"
            onClick={handleArtisanClick}
            className="group relative p-5 sm:p-8 md:p-10 rounded-3xl bg-[#FAF5EC] border-2 border-earth-300 hover:border-brand-600 shadow-xs hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between cursor-pointer hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand-100/90 text-brand-700 flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors border border-brand-200">
                <User className="w-7 h-7" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-earth-900 mb-2 group-hover:text-brand-800 transition-colors">
                {t('landing.artisan_title')}
              </h3>

              <p className="text-sm text-earth-700 leading-relaxed mb-6">
                {t('landing.artisan_desc')}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 group-hover:text-brand-800 pt-4 border-t border-earth-200">
              <span>{t('landing.artisan_cta')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>

          {/* Choice 2: Buyer */}
          <button
            type="button"
            onClick={handleBuyerClick}
            className="group relative p-8 sm:p-10 rounded-3xl bg-[#FAF5EC] border-2 border-earth-300 hover:border-earth-800 shadow-xs hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between cursor-pointer hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-earth-200/90 text-earth-800 flex items-center justify-center mb-6 group-hover:bg-earth-900 group-hover:text-white transition-colors border border-earth-300">
                <ShoppingBag className="w-7 h-7" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-earth-900 mb-2 group-hover:text-earth-800 transition-colors">
                {t('landing.buyer_title')}
              </h3>

              <p className="text-sm text-earth-700 leading-relaxed mb-6">
                {t('landing.buyer_desc')}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-earth-800 group-hover:text-earth-950 pt-4 border-t border-earth-200">
              <span>{t('landing.buyer_cta')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        </div>
      </main>

      {/* Minimal Cultural Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-earth-700 border-t border-earth-300/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>{t('landing.footer_summary')}</span>
        <div className="flex items-center gap-2 text-brand-600 text-xs select-none">
          <span>❖</span>
          <span>❖</span>
          <span>❖</span>
        </div>
        <span className="text-earth-700 font-serif italic">{t('landing.footer_heritage')}</span>
      </footer>

      {/* About Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF5EC] rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-earth-300 relative">
            <button
              onClick={() => setAboutOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full text-earth-500 hover:text-earth-900 hover:bg-earth-200/70 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4 border border-brand-200">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-earth-900 mb-3">
              {t('landing.about_modal_title')}
            </h3>
            <p className="text-sm text-earth-700 leading-relaxed mb-4">
              {t('landing.about_modal_p1')}
            </p>
            <p className="text-sm text-earth-700 leading-relaxed mb-6">
              {t('landing.about_modal_p2')}
            </p>
            <button
              onClick={() => setAboutOpen(false)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              {t('landing.about_modal_close')}
            </button>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={addAccountModal !== null}
        initialType={addAccountModal}
        onClose={() => setAddAccountModal(null)}
      />
    </div>
  );
}
export default LandingPage;
