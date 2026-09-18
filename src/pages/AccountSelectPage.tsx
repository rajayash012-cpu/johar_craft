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

export function AccountSelectPage() {
  const navigate = useNavigate();
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
        <Link
          to="/"
          className="text-xs font-semibold text-earth-600 hover:text-earth-900 transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="card p-6 sm:p-8 bg-white border border-earth-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900">
              Choose an Account
            </h1>
            <p className="text-xs sm:text-sm text-earth-600 max-w-md mx-auto">
              Select an existing Johar Craft account stored on this device, or create a new profile.
            </p>
          </div>

          {/* Accounts List */}
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-earth-50 border border-earth-200">
                <User className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-earth-900">
                  No accounts saved on this device
                </p>
                <p className="text-xs text-earth-500 mt-1 mb-4">
                  Create an Artisan profile to showcase your crafts, or a Buyer account to place orders.
                </p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Create Your First Account
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
                            {isArtisan ? 'Artisan' : 'Buyer'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Active
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
                            : `${(acc as any).location || 'Jharkhand'}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                      <span>Select</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-earth-100">
            <button
              onClick={() => setAddModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-earth-900 hover:bg-earth-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Account</span>
            </button>

            <Link
              to="/marketplace"
              className="text-xs font-semibold text-earth-600 hover:text-earth-900 transition-colors"
            >
              Browse Marketplace as Guest →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-earth-500">
        Johar Craft · Preserving Jharkhand's Tribal Heritage
      </footer>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
