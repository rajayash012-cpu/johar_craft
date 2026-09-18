import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  User,
  ShoppingBag,
  Plus,
  Settings,
  LogOut,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { AddAccountModal } from './AddAccountModal';
import { useLanguage } from '../i18n';

interface AccountSwitcherProps {
  compact?: boolean;
}

export function AccountSwitcher({ compact = false }: AccountSwitcherProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accounts, activeAccount, switchAccount, logout } = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherAccounts = accounts.filter(a => a.id !== activeAccount?.id);

  const handleSwitch = (id: string, type: 'artisan' | 'buyer') => {
    switchAccount(id);
    setDropdownOpen(false);
    if (type === 'artisan') {
      navigate('/artisan');
    } else {
      navigate('/marketplace');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/account/select');
  };

  const handleManageAccounts = () => {
    setDropdownOpen(false);
    navigate('/artisan/settings?tab=accounts');
  };

  if (!activeAccount) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => navigate('/account/select')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-earth-300 hover:bg-earth-100 text-xs font-semibold text-earth-800 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-earth-600" />
          <span>{t('account.select_account')}</span>
        </button>
      </div>
    );
  }

  const isArtisan = activeAccount.type === 'artisan';
  const artisanId = isArtisan ? (activeAccount as any).artisanId : null;
  const buyerId = !isArtisan ? (activeAccount as any).buyerId : null;
  const displayId = artisanId || buyerId || '';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setDropdownOpen(v => !v)}
        className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-earth-100 transition-colors text-left group cursor-pointer border border-transparent hover:border-earth-200"
        title={t('account.switch_account')}
      >
        {activeAccount.photo ? (
          <img
            src={activeAccount.photo}
            alt={activeAccount.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-brand-300 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-300">
            {activeAccount.name.charAt(0)}
          </div>
        )}

        {!compact && (
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-earth-900 leading-tight">
                {activeAccount.name}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  isArtisan
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-stone-200 text-stone-800'
                }`}
              >
                {isArtisan ? t('account.artisan_role') : t('account.buyer_role')}
              </span>
            </div>
            <p className="text-[11px] text-earth-500 leading-none mt-0.5 font-mono">
              {displayId}
            </p>
          </div>
        )}

        <ChevronDown
          className={`w-4 h-4 text-earth-400 group-hover:text-earth-700 transition-transform ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[320px] bg-white rounded-2xl shadow-xl border border-earth-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Active Account Section */}
          <div className="px-4 pb-3 border-b border-earth-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-earth-500">
                {t('account.active_account')}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('common.active')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeAccount.photo ? (
                <img
                  src={activeAccount.photo}
                  alt={activeAccount.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm border border-brand-300">
                  {activeAccount.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-earth-900 truncate">
                  {activeAccount.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-earth-600 font-medium">
                    {displayId}
                  </span>
                  <span className="text-xs text-earth-400">•</span>
                  <span className="text-xs text-earth-500 truncate">
                    {isArtisan
                      ? (activeAccount as any).craftCategory
                      : (activeAccount as any).buyerType === 'BUSINESS'
                      ? t('account.business_type')
                      : t('account.individual_type')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Accounts Section */}
          {otherAccounts.length > 0 && (
            <div className="px-2 py-2 border-b border-earth-100 max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-earth-400">
                {t('account.switch_account')}
              </div>
              {otherAccounts.map(acc => {
                const accIsArtisan = acc.type === 'artisan';
                const accId = accIsArtisan
                  ? (acc as any).artisanId
                  : (acc as any).buyerId;
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleSwitch(acc.id, acc.type)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-earth-50 text-left transition-colors group cursor-pointer"
                  >
                    {acc.photo ? (
                      <img
                        src={acc.photo}
                        alt={acc.name}
                        className="w-8 h-8 rounded-full object-cover border border-earth-300 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-earth-100 text-earth-700 flex items-center justify-center font-bold text-xs shrink-0 border border-earth-200">
                        {acc.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-earth-900 truncate group-hover:text-brand-700 transition-colors">
                          {acc.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded ${
                            accIsArtisan
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {accIsArtisan ? t('account.artisan_role') : t('account.buyer_role')}
                        </span>
                      </div>
                      <p className="text-[11px] text-earth-500 font-mono leading-none mt-0.5">
                        {accId}
                      </p>
                    </div>
                    <span className="text-[11px] text-brand-600 font-semibold group-hover:underline">
                      {t('account.switch_account')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-2 pt-2 space-y-0.5">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setAddModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-earth-50 text-xs font-semibold text-earth-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-600" />
              <span>{t('account.add_account')}</span>
            </button>

            <button
              onClick={handleManageAccounts}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-earth-50 text-xs font-semibold text-earth-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-earth-500" />
              <span>{t('account.manage_accounts')}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>{t('account.log_out')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
