import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings,
  ShieldCheck,
  Bell,
  Lock,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  LogOut,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { getArtisan, getArtisanVerification } from '../../utils/storage';
import { getTierLabel } from '../../services/verificationService';
import { useAccount } from '../../context/AccountContext';
import { AddAccountModal } from '../../components/AddAccountModal';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import type { Account } from '../../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'accounts';

  const {
    accounts,
    activeAccount,
    switchAccount,
    deleteAccount,
    logout,
  } = useAccount();

  const artisan = getArtisan();
  const [activeTab, setActiveTab] = useState<
    'accounts' | 'profile' | 'verification' | 'notifications' | 'privacy'
  >(initialTab);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalAccount, setDeleteModalAccount] = useState<Account | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const verifProfile = getArtisanVerification(
    artisan?.id || (activeAccount as any)?.artisanId || 'JH-ART-0001'
  );

  const otherAccounts = accounts.filter(a => a.id !== activeAccount?.id);

  const handleSwitch = (id: string, type: 'artisan' | 'buyer') => {
    switchAccount(id);
    setFeedback({
      type: 'success',
      text: `Switched account successfully.`,
    });
    setTimeout(() => setFeedback(null), 3000);
    if (type !== 'artisan') {
      navigate('/marketplace');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteModalAccount) return;
    const name = deleteModalAccount.name;
    const result = deleteAccount(deleteModalAccount.id);
    setDeleteModalAccount(null);

    setFeedback({
      type: 'info',
      text: `Account "${name}" and all associated products and verification data were permanently deleted.`,
    });
    setTimeout(() => setFeedback(null), 4000);

    if (!result.newActiveId) {
      navigate('/account/select');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/account/select');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-earth-900">
            Settings
          </h1>
          <p className="text-xs text-earth-600">
            Manage accounts, security credentials, and preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-earth-200 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 min-h-[44px] ${
            activeTab === 'accounts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-earth-600 hover:text-earth-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Accounts</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-earth-100 text-earth-700">
            {accounts.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-earth-600 hover:text-earth-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'verification'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-earth-600 hover:text-earth-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Trust & Verification</span>
          {verifProfile.tier !== 'LEVEL_0_UNVERIFIED' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'notifications'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-earth-600 hover:text-earth-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'privacy'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-earth-600 hover:text-earth-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Data & Privacy</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* Tab 0: ACCOUNTS MANAGEMENT (PROMPT SPECIFIED)                */}
      {/* ============================================================ */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Top Bar of Accounts Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-earth-900">Accounts</h2>
              <p className="text-xs text-earth-600">
                Manage your Johar Craft accounts stored on this device
              </p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Account</span>
            </button>
          </div>

          {/* 1. Active Account Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              Active Account
            </h3>

            {activeAccount ? (
              <div className="card p-5 border-2 border-brand-500 bg-white shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {activeAccount.photo ? (
                      <img
                        src={activeAccount.photo}
                        alt={activeAccount.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-brand-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xl shrink-0 border border-brand-200">
                        {activeAccount.name.charAt(0)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <h4 className="text-base font-bold text-earth-900">
                          {activeAccount.name}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            activeAccount.type === 'artisan'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-stone-100 text-stone-800 border border-stone-200'
                          }`}
                        >
                          {activeAccount.type === 'artisan'
                            ? 'Artisan'
                            : 'Buyer'}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Status: Active
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-earth-600">
                        <span className="font-mono font-medium text-brand-700">
                          ID:{' '}
                          {activeAccount.type === 'artisan'
                            ? (activeAccount as any).artisanId
                            : (activeAccount as any).buyerId}
                        </span>
                        {activeAccount.type === 'artisan' ? (
                          <>
                            <span>
                              District: {(activeAccount as any).district}
                            </span>
                            <span>
                              Craft: {(activeAccount as any).craftCategory}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Type:{' '}
                              {(activeAccount as any).buyerType === 'BUSINESS'
                                ? 'Business Buyer'
                                : 'Individual Buyer'}
                            </span>
                            <span>
                              Location:{' '}
                              {(activeAccount as any).location || 'Jharkhand'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Active Account */}
                  <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-earth-100">
                    <div className="flex items-center gap-2">
                      {activeAccount.type === 'artisan' ? (
                        <Link
                          to="/artisan/profile"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-earth-300 text-earth-800 text-xs font-semibold hover:bg-earth-50 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </Link>
                      ) : (
                        <Link
                          to="/buyer/verification"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-earth-300 text-earth-800 text-xs font-semibold hover:bg-earth-50 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-earth-300 text-earth-700 text-xs font-semibold hover:bg-earth-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteModalAccount(activeAccount)}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 hover:underline transition-colors mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-earth-100 text-center text-xs text-earth-600">
                No active account selected.{' '}
                <button
                  onClick={() => navigate('/account/select')}
                  className="font-semibold text-brand-600 underline"
                >
                  Select an account
                </button>
              </div>
            )}
          </div>

          {/* 2. Other Accounts Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-earth-500">
              Other Accounts
            </h3>

            {otherAccounts.length === 0 ? (
              <div className="card p-6 text-center border-dashed border-earth-300 bg-earth-50/50">
                <p className="text-xs text-earth-500">
                  No other accounts on this device. Click "+ Add Account" to add a buyer or another artisan profile.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {otherAccounts.map(acc => {
                  const isArtisan = acc.type === 'artisan';
                  const accId = isArtisan
                    ? (acc as any).artisanId
                    : (acc as any).buyerId;

                  return (
                    <div
                      key={acc.id}
                      className="card p-4 bg-white border border-earth-200 hover:border-earth-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        {acc.photo ? (
                          <img
                            src={acc.photo}
                            alt={acc.name}
                            className="w-10 h-10 rounded-xl object-cover border border-earth-300 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-earth-100 text-earth-700 flex items-center justify-center font-bold text-sm shrink-0 border border-earth-200">
                            {acc.name.charAt(0)}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-earth-300 shrink-0" />
                            <h4 className="text-sm font-bold text-earth-900">
                              {acc.name}
                            </h4>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                isArtisan
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {isArtisan ? 'Artisan' : 'Buyer'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 text-xs text-earth-500">
                            <span className="font-mono text-earth-600 font-medium">
                              ID: {accId}
                            </span>
                            <span>
                              {isArtisan
                                ? `District: ${(acc as any).district}`
                                : `Type: ${
                                    (acc as any).buyerType === 'BUSINESS'
                                      ? 'Business'
                                      : 'Individual'
                                  }`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Other Account */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-earth-100 justify-end">
                        <button
                          onClick={() => handleSwitch(acc.id, acc.type)}
                          className="px-3 py-1.5 rounded-xl bg-earth-100 hover:bg-brand-600 hover:text-white text-earth-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => setDeleteModalAccount(acc)}
                          className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                          title="Delete this account"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Tab 1: Profile                                               */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-earth-900">Account Details</h3>
            <Link
              to="/artisan/profile"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>Edit Full Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Artisan ID</label>
              <input
                type="text"
                value={
                  artisan?.id || (activeAccount as any)?.artisanId || 'Not created'
                }
                readOnly
                className="input bg-earth-50 cursor-not-allowed text-earth-500 font-mono"
              />
            </div>
            <div>
              <label className="label">Registered Name</label>
              <input
                type="text"
                value={artisan?.name || activeAccount?.name || '-'}
                readOnly
                className="input bg-earth-50 cursor-not-allowed text-earth-500"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="text"
                value={artisan?.phone || (activeAccount as any)?.phone || '-'}
                readOnly
                className="input bg-earth-50 cursor-not-allowed text-earth-500"
              />
            </div>
            <div>
              <label className="label">Craft Category</label>
              <input
                type="text"
                value={
                  artisan?.craftCategory ||
                  (activeAccount as any)?.craftCategory ||
                  '-'
                }
                readOnly
                className="input bg-earth-50 cursor-not-allowed text-earth-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Tab 2: Trust & Verification                                  */}
      {/* ============================================================ */}
      {activeTab === 'verification' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-earth-900">
                Verification Status
              </h3>
              <p className="text-xs text-earth-600">
                Single Government Identity Verification + Optional Artisan & Business Credentials
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {getTierLabel(verifProfile.tier)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-earth-900 font-semibold block">
                  Government Identity
                </span>
                <span className="text-[11px] text-earth-500">
                  Primary Verification (1 ID)
                </span>
              </div>
              {verifProfile.records.identity?.status === 'verified' ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified
                </span>
              ) : (
                <span className="text-xs text-stone-500">Not Verified</span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-earth-900 font-semibold block">
                  Pehchan Artisan Card
                </span>
                <span className="text-[11px] text-earth-500">
                  Optional Credential
                </span>
              </div>
              {verifProfile.records.pehchan?.status === 'verified' ? (
                <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pehchan Verified
                </span>
              ) : (
                <span className="text-xs text-stone-500">Optional</span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <span className="text-xs text-earth-700 font-medium">
                Udyam MSME
              </span>
              {verifProfile.records.udyam?.status === 'verified' ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="text-xs text-stone-500">Optional</span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <span className="text-xs text-earth-700 font-medium">
                GSTIN Active
              </span>
              {verifProfile.records.gstin?.status === 'verified' ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="text-xs text-stone-500">Optional</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/artisan/verification"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>Manage Credentials in Verification Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Tab 3: Notifications                                         */}
      {/* ============================================================ */}
      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-earth-900 mb-2">
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {[
              'Buyer enquiries & quote requests',
              'Profile view milestones',
              'Verification status updates',
              'Platform announcements & craft exhibitions',
            ].map(pref => (
              <label
                key={pref}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm text-earth-700">{pref}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-earth-200 peer-focus:ring-2 peer-focus:ring-brand-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Tab 4: Data & Privacy                                        */}
      {/* ============================================================ */}
      {activeTab === 'privacy' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-earth-900 mb-2">Data & Privacy</h3>
          <p className="text-sm text-earth-600 leading-relaxed">
            Johar Craft stores session data and masked verification tokens in your browser's local storage. Raw Aadhaar numbers, biometric data, or identity copies are never held in client-side storage.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Clear all local data? This will reset all simulated accounts and products.'
                  )
                ) {
                  localStorage.clear();
                  window.location.href = '/';
                }
              }}
              className="text-xs text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors font-semibold"
            >
              Clear Local Browser Data
            </button>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-earth-200 relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-earth-900">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-earth-600 leading-relaxed">
                You are about to permanently delete{' '}
                <strong className="text-earth-900">
                  {deleteModalAccount.name}
                </strong>{' '}
                (
                {deleteModalAccount.type === 'artisan'
                  ? (deleteModalAccount as any).artisanId
                  : (deleteModalAccount as any).buyerId}
                ).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs text-red-800 space-y-1.5">
              <p className="font-semibold">This action will immediately purge:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-700">
                <li>The local profile and identification credentials</li>
                {deleteModalAccount.type === 'artisan' ? (
                  <>
                    <li>All products and photos created by this artisan</li>
                    <li>Digital verification records and KYC references</li>
                  </>
                ) : (
                  <>
                    <li>Buyer verification records and active craft enquiries</li>
                  </>
                )}
                <li>Saved preferences on this browser</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalAccount(null)}
                className="px-4 py-2 rounded-xl border border-earth-300 text-earth-700 text-xs font-semibold hover:bg-earth-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SettingsPage;
