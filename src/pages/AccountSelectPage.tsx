import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAccount } from '../context/AccountContext';
import { AddAccountModal } from '../components/AddAccountModal';
import { ViewModeSwitcher } from '../components/ViewModeSwitcher';
import { useLanguage } from '../i18n';

export function AccountSelectPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accounts, activeAccount, switchAccount } = useAccount();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleSelectAccount = (id: string, type: 'artisan' | 'buyer') => {
    switchAccount(id);
    if (type === 'artisan') {
      navigate('/artisan');
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-200">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <ViewModeSwitcher compact />
          <Link
            to="/"
            className="text-xs font-semibold text-earth-600 hover:text-earth-900 transition-colors"
          >
            ← {t('common.back')} {t('nav.home')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="card p-6 sm:p-8 bg-white border border-earth-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900">
              {t('account.choose_account')}
            </h1>
            <p className="text-xs sm:text-sm text-earth-600 max-w-md mx-auto">
              {t('account.choose_account_desc')}
            </p>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-earth-50 border border-earth-200">
                <User className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-earth-900">
                  {t('account.no_accounts_saved')}
                </p>
                <p className="text-xs text-earth-500 mt-1 mb-4">
                  {t('account.no_accounts_desc')}
                </p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {t('account.create_first_account')}
                </button>
              </div>
            ) : (
              accounts.map(acc => {
                const isArtisan = acc.type === 'artisan';
                const idLabel = isArtisan
                  ? (acc as any).artisanId
                  : (acc as any).buyerId;
                const isActive = activeAccount?.id === acc.id;

                return (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc.id, acc.type)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'border-brand-600 bg-brand-50/30 shadow-xs'
                        : 'border-earth-200 hover:border-earth-400 bg-white hover:bg-earth-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {acc.photo ? (
                        <img
                          src={acc.photo}
                          alt={acc.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-brand-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-base shrink-0 border border-brand-200">
                          {acc.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-earth-900 group-hover:text-brand-700 transition-colors">
                            {acc.name}
                          </h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isArtisan
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-stone-100 text-stone-800 border border-stone-200'
                            }`}
                          >
                            {isArtisan ? t('account.artisan_role') : t('account.buyer_role')}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {t('common.active')}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-earth-500 font-mono mt-0.5">
                          {idLabel}
                        </p>

                        <p className="text-xs text-earth-600 mt-1">
                          {isArtisan
                            ? `${(acc as any).craftCategory} • ${
                                (acc as any).district
                              }`
                            : `${(acc as any).location || t('crafts.jharkhand')}`}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-earth-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })
            )}

            {/* Add Account Button */}
            {accounts.length > 0 && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="w-full p-3.5 rounded-2xl border-2 border-dashed border-earth-300 hover:border-brand-600 hover:bg-brand-50/20 text-earth-700 hover:text-brand-700 transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('account.add_account')}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-earth-500 py-4">
        {t('brand.built_for_community')}
      </footer>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}

export default AccountSelectPage;
