import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { JHARKHAND_DISTRICTS, CRAFT_CATEGORIES, type BuyerType } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated?: (account: any) => void;
  initialType?: 'artisan' | 'buyer' | null;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onAccountCreated,
  initialType = null,
}: AddAccountModalProps) {
  const navigate = useNavigate();
  const { createArtisan, createBuyer } = useAccount();

  const [step, setStep] = useState<'select' | 'artisan_form' | 'buyer_form'>(
    initialType === 'artisan'
      ? 'artisan_form'
      : initialType === 'buyer'
      ? 'buyer_form'
      : 'select'
  );

  // Artisan Form
  const [artisanName, setArtisanName] = useState('');
  const [district, setDistrict] = useState<string>(JHARKHAND_DISTRICTS[0]);
  const [village, setVillage] = useState('');
  const [craftCategory, setCraftCategory] = useState<string>(CRAFT_CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [story, setStory] = useState('');
  const [artisanErrors, setArtisanErrors] = useState<Record<string, string>>({});

  // Buyer Form
  const [buyerName, setBuyerName] = useState('');
  const [buyerType, setBuyerType] = useState<BuyerType>('INDIVIDUAL');
  const [businessName, setBusinessName] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('Ranchi, Jharkhand');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerErrors, setBuyerErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleCreateArtisan = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!artisanName.trim()) errs.name = 'Full name is required';
    if (!village.trim()) errs.village = 'Village / Town is required';
    if (Object.keys(errs).length > 0) {
      setArtisanErrors(errs);
      return;
    }

    const newAccount = createArtisan({
      name: artisanName,
      district,
      village,
      craftCategory,
      phone,
      story: story.trim() || undefined,
    });

    onClose();
    if (onAccountCreated) onAccountCreated(newAccount);
    navigate('/artisan');
  };

  const handleCreateBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!buyerName.trim()) errs.name = 'Full name is required';
    if (buyerType === 'BUSINESS' && !businessName.trim()) {
      errs.businessName = 'Business/Company name is required';
    }
    if (Object.keys(errs).length > 0) {
      setBuyerErrors(errs);
      return;
    }

    const newAccount = createBuyer({
      name: buyerName,
      buyerType,
      phone: buyerPhone,
      email: buyerEmail,
      location: buyerLocation,
      businessName: buyerType === 'BUSINESS' ? businessName : undefined,
    });

    onClose();
    if (onAccountCreated) onAccountCreated(newAccount);
    navigate('/marketplace');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-earth-200 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-earth-400 hover:text-earth-700 hover:bg-earth-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Choose Account Type */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Add New Johar Craft Account
              </span>
              <h2 className="text-2xl font-serif font-bold text-earth-900">
                Choose Account Type
              </h2>
              <p className="text-xs text-earth-600 max-w-md mx-auto">
                Create multiple artisan or buyer accounts on this device. You can easily switch between them at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Choice 1: Artisan */}
              <button
                type="button"
                onClick={() => setStep('artisan_form')}
                className="p-5 rounded-2xl border-2 border-earth-200 hover:border-amber-600 bg-white hover:bg-amber-50/40 text-left transition-all group cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-earth-900 group-hover:text-amber-900 transition-colors">
                      Artisan / Craftsperson
                    </h3>
                    <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-earth-600 leading-relaxed mb-2">
                    Showcase tribal crafts, calculate fair prices, print QR identities for exhibitions, and verify identity.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-amber-800">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/70">Unique JC-ART ID</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/70">Fair Pricing</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100/70">QR Identity</span>
                  </div>
                </div>
              </button>

              {/* Choice 2: Buyer */}
              <button
                type="button"
                onClick={() => setStep('buyer_form')}
                className="p-5 rounded-2xl border-2 border-earth-200 hover:border-stone-800 bg-white hover:bg-stone-50 text-left transition-all group cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-earth-900 group-hover:text-stone-900 transition-colors">
                      Buyer (Individual or Business)
                    </h3>
                    <ArrowRight className="w-4 h-4 text-stone-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-earth-600 leading-relaxed mb-2">
                    Connect directly with verified master artisans, place custom/bulk orders, and earn verified buyer trust badges.
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-stone-700">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100">Unique JC-BUY ID</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100">Individual & Business</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100">Direct Inquiries</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2A: Artisan Form */}
        {step === 'artisan_form' && (
          <form onSubmit={handleCreateArtisan} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-serif font-bold text-earth-900">
                  New Artisan Profile
                </h3>
                <p className="text-xs text-earth-500">
                  Auto-generates a persistent JC-ART identifier
                </p>
              </div>
            </div>

            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                value={artisanName}
                onChange={e => setArtisanName(e.target.value)}
                placeholder="e.g. Birsa Hansda"
                className="input"
                autoFocus
              />
              {artisanErrors.name && (
                <p className="text-xs text-red-600 mt-1">{artisanErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">District (Jharkhand) *</label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="input"
                >
                  {JHARKHAND_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Village / Town *</label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="e.g. Torpa / Khunti"
                  className="input"
                />
                {artisanErrors.village && (
                  <p className="text-xs text-red-600 mt-1">{artisanErrors.village}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Craft Specialization *</label>
                <select
                  value={craftCategory}
                  onChange={e => setCraftCategory(e.target.value)}
                  className="input"
                >
                  {CRAFT_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Artisan Story / Heritage (Optional)</label>
              <textarea
                value={story}
                onChange={e => setStory(e.target.value)}
                placeholder="Briefly describe your craft lineage, techniques, or cooperative..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 rounded-xl border border-earth-300 text-earth-700 text-xs font-semibold hover:bg-earth-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Create & Switch to Artisan
              </button>
            </div>
          </form>
        )}

        {/* Step 2B: Buyer Form */}
        {step === 'buyer_form' && (
          <form onSubmit={handleCreateBuyer} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-serif font-bold text-earth-900">
                  New Buyer Profile
                </h3>
                <p className="text-xs text-earth-500">
                  Auto-generates a persistent JC-BUY identifier
                </p>
              </div>
            </div>

            {/* Buyer Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-earth-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBuyerType('INDIVIDUAL')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  buyerType === 'INDIVIDUAL'
                    ? 'bg-white text-earth-900 shadow-xs'
                    : 'text-earth-600 hover:text-earth-900'
                }`}
              >
                Individual Buyer
              </button>
              <button
                type="button"
                onClick={() => setBuyerType('BUSINESS')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  buyerType === 'BUSINESS'
                    ? 'bg-white text-earth-900 shadow-xs'
                    : 'text-earth-600 hover:text-earth-900'
                }`}
              >
                Business / Wholesale
              </button>
            </div>

            <div>
              <label className="label">Your Name *</label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                placeholder="e.g. Vikram Sethi"
                className="input"
                autoFocus
              />
              {buyerErrors.name && (
                <p className="text-xs text-red-600 mt-1">{buyerErrors.name}</p>
              )}
            </div>

            {buyerType === 'BUSINESS' && (
              <div>
                <label className="label">Business / Enterprise Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. FabCraft Retailers Pvt Ltd"
                  className="input"
                />
                {buyerErrors.businessName && (
                  <p className="text-xs text-red-600 mt-1">
                    {buyerErrors.businessName}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Location (City / State)</label>
                <input
                  type="text"
                  value={buyerLocation}
                  onChange={e => setBuyerLocation(e.target.value)}
                  placeholder="e.g. Ranchi, Jharkhand"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address (Optional)</label>
              <input
                type="email"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                placeholder="procurement@example.com"
                className="input"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 rounded-xl border border-earth-300 text-earth-700 text-xs font-semibold hover:bg-earth-100 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Create & Switch to Buyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
