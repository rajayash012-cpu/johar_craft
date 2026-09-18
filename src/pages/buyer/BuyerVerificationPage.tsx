import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Info,
  ArrowLeft,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { getBuyerProfile, saveBuyerProfile } from '../../utils/storage';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  verifyGovernmentIdentity,
  verifyBusinessBuyer,
  type GovernmentDocChoice,
  OFFICIAL_PORTAL_URLS,
} from '../../services/verificationService';
import type {
  BuyerProfile,
  BuyerType,
  BusinessBuyerDetails,
  VerificationStatus,
} from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

export function BuyerVerificationPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<BuyerProfile>(() => getBuyerProfile());
  const [selectedBuyerType, setSelectedBuyerType] = useState<BuyerType>(
    profile.buyerType || 'INDIVIDUAL'
  );

  // Evaluator Demo Mode Controls
  const [simOutcome, setSimOutcome] = useState<VerificationStatus>('verified');
  const [showDemoControls, setShowDemoControls] = useState(true);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Individual Form State
  const [phoneNumber, setPhoneNumber] = useState(
    profile.phone?.replace(/[^0-9]/g, '').slice(-10) || '9876543210'
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GovernmentDocChoice>('Aadhaar');
  const [idLoading, setIdLoading] = useState(false);

  // Business Form State
  const [bizDetails, setBizDetails] = useState<BusinessBuyerDetails>({
    businessName: profile.businessDetails?.businessName || '',
    businessType: profile.businessDetails?.businessType || 'Private Limited Company',
    gstin: profile.businessDetails?.gstin || '',
    udyamRegistration: profile.businessDetails?.udyamRegistration || '',
    pan: profile.businessDetails?.pan || '',
    address: profile.businessDetails?.address || '',
  });
  const [bizPhone, setBizPhone] = useState(
    profile.phone?.replace(/[^0-9]/g, '').slice(-10) || '9876543210'
  );
  const [bizLoading, setBizLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const isPhoneVerified = profile.records.phone?.status === 'verified';
  const isIdentityVerified = profile.records.identity?.status === 'verified';
  const isIndividualFullyVerified = isPhoneVerified && isIdentityVerified;
  const isBusinessVerified = profile.records.business?.status === 'verified';

  // Handler: Send Phone OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      const res = await sendPhoneOTP(phoneNumber);
      if (res.success) {
        setOtpSent(true);
        setOtpCode(res.demoCode); // prefill demo OTP
        showToast(`${res.message} (Demo code: ${res.demoCode})`, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Error sending OTP. Please try again.', 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handler: Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      const record = await verifyPhoneOTP(profile.id, phoneNumber, otpCode, simOutcome);
      if (record.status === 'verified') {
        const updated: BuyerProfile = {
          ...profile,
          phone: `+91 ${phoneNumber}`,
          records: {
            ...profile.records,
            phone: record,
          },
        };
        saveBuyerProfile(updated);
        setProfile(updated);
        showToast('Phone number verified successfully.', 'success');
      } else {
        showToast('Incorrect OTP. (Demo code: 123456)', 'error');
      }
    } catch {
      showToast('Error verifying OTP.', 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handler: Verify Government ID (Individual)
  const handleVerifyIndividualId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdLoading(true);
    try {
      const record = await verifyGovernmentIdentity(profile.id, selectedDoc, simOutcome);
      if (record.status === 'verified') {
        const updated: BuyerProfile = {
          ...profile,
          buyerType: 'INDIVIDUAL',
          records: {
            ...profile.records,
            identity: record,
          },
        };
        saveBuyerProfile(updated);
        setProfile(updated);
        showToast('Identity verification completed. You are now a Verified Buyer.', 'success');
      } else {
        showToast('Verification could not be completed. Your information has not been changed.', 'error');
      }
    } catch {
      showToast('Error during verification. Please try again.', 'error');
    } finally {
      setIdLoading(false);
    }
  };

  // Handler: Verify Business Buyer
  const handleVerifyBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizDetails.businessName.trim()) {
      showToast('Please enter your Business Name.', 'error');
      return;
    }
    setBizLoading(true);
    try {
      const record = await verifyBusinessBuyer(profile.id, bizDetails, simOutcome);
      if (record.status === 'verified') {
        const updated: BuyerProfile = {
          ...profile,
          buyerType: 'BUSINESS',
          phone: `+91 ${bizPhone}`,
          businessDetails: bizDetails,
          records: {
            ...profile.records,
            business: record,
            ...(bizDetails.gstin ? { gstin: { type: 'gstin', status: 'verified', verifiedAt: new Date().toISOString(), maskedReference: bizDetails.gstin } } : {}),
            ...(bizDetails.udyamRegistration ? { udyam: { type: 'udyam', status: 'verified', verifiedAt: new Date().toISOString(), maskedReference: bizDetails.udyamRegistration } } : {}),
          },
        };
        saveBuyerProfile(updated);
        setProfile(updated);
        showToast('Business verification completed. You are now a Verified Business Buyer.', 'success');
      } else {
        showToast('Business verification could not be completed.', 'error');
      }
    } catch {
      showToast('Error validating business credentials.', 'error');
    } finally {
      setBizLoading(false);
    }
  };

  // Demo helper: Reset buyer profile
  const handleResetBuyer = () => {
    const fresh: BuyerProfile = {
      id: profile.id || 'buyer-default-01',
      name: profile.name || 'Anita Verma',
      phone: '+91 98765 43210',
      email: profile.email || 'buyer@example.com',
      buyerType: selectedBuyerType,
      records: {},
      wishlist: [],
    };
    saveBuyerProfile(fresh);
    setProfile(fresh);
    setOtpSent(false);
    setOtpCode('');
    showToast('Buyer verification reset to unverified.', 'info');
  };

  return (
    <div className="min-h-screen bg-stone-50/60 text-stone-800">
      {/* Top Navbar */}
      <header className="bg-white/95 border-b border-stone-200/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>
          <Link
            to="/marketplace"
            className="text-xs font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Marketplace
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            Buyer Verification
          </h1>
          <p className="text-sm text-stone-600">
            Verify your identity or business details to build trust when interacting with artisans.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role="alert"
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            ) : feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
        )}

        {/* Demo Verification Mode Banner */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs tracking-wide">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{t('verification.demo_mode')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoControls(!showDemoControls)}
              className="text-xs text-amber-800 hover:text-amber-950 font-medium underline"
            >
              {showDemoControls ? 'Hide Evaluator Controls' : 'Show Evaluator Controls'}
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            This prototype simulates the verification workflow. Production deployment requires integration with an authorized KYC/identity verification provider.
          </p>

          {showDemoControls && (
            <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-stone-700">Simulate Outcome:</span>
                {(
                  [
                    { val: 'verified', label: '✓ Verified' },
                    { val: 'pending', label: '⏳ Pending' },
                    { val: 'requires_review', label: '⚠️ Review' },
                    { val: 'failed', label: '❌ Failed' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSimOutcome(opt.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      simOutcome === opt.val
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleResetBuyer}
                  className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('verification.unverified')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* What type of buyer are you? */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            What type of buyer are you?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Individual Buyer */}
            <button
              type="button"
              onClick={() => setSelectedBuyerType('INDIVIDUAL')}
              className={`p-5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between ${
                selectedBuyerType === 'INDIVIDUAL'
                  ? 'bg-white border-amber-800 shadow-md ring-2 ring-amber-600/20'
                  : 'bg-white/70 border-stone-200 hover:border-stone-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedBuyerType === 'INDIVIDUAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{t('verification.individual_buyer')}</h3>
                    <p className="text-xs text-stone-500">Buying for personal use</p>
                  </div>
                </div>
                {isIndividualFullyVerified && selectedBuyerType === 'INDIVIDUAL' && (
                  <span className="text-emerald-700 bg-emerald-50 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('verification.verified')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-600">
                Phone OTP authentication + ONE government identity document.
              </p>
            </button>

            {/* Card 2: Business Buyer */}
            <button
              type="button"
              onClick={() => setSelectedBuyerType('BUSINESS')}
              className={`p-5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between ${
                selectedBuyerType === 'BUSINESS'
                  ? 'bg-white border-amber-800 shadow-md ring-2 ring-amber-600/20'
                  : 'bg-white/70 border-stone-200 hover:border-stone-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedBuyerType === 'BUSINESS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{t('verification.business_buyer')}</h3>
                    <p className="text-xs text-stone-500">
                      Buying for a business, organization or resale
                    </p>
                  </div>
                </div>
                {isBusinessVerified && selectedBuyerType === 'BUSINESS' && (
                  <span className="text-emerald-700 bg-emerald-50 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('verification.verified')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-600">
                Business details with optional GSTIN or Udyam credentials where applicable.
              </p>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INDIVIDUAL BUYER FLOW */}
        {/* ========================================================= */}
        {selectedBuyerType === 'INDIVIDUAL' && (
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Individual Buyer Verification
                </h3>
                <p className="text-xs text-stone-500">
                  Complete basic phone and identity verification
                </p>
              </div>
              {isIndividualFullyVerified && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Buyer
                </span>
              )}
            </div>

            {isIndividualFullyVerified ? (
              /* Completed Individual Buyer State */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Status</span>
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Buyer
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Phone Status</span>
                    <span className="font-medium text-stone-800">
                      {profile.records.phone?.maskedReference || `+91 XXXXX X${phoneNumber.slice(-4)}`} (Phone Verified)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Identity Document</span>
                    <span className="font-medium text-stone-800">
                      {profile.records.identity?.documentType ? profile.records.identity.documentType.toUpperCase() : 'Government ID'} (Identity Verified)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Verified on</span>
                    <span className="font-medium text-stone-800">
                      {profile.records.identity?.verifiedAt
                        ? new Date(profile.records.identity.verifiedAt).toLocaleDateString('en-GB')
                        : 'Today'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-stone-700 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Sensitive identity information is not displayed publicly. Artisans see only your <strong>✓ Verified Buyer</strong> badge.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetBuyer}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium border border-stone-300 hover:bg-stone-100 transition-colors"
                >
                  Change / Re-verify Details
                </button>
              </div>
            ) : (
              /* Two-step Verification Flow */
              <div className="space-y-5">
                {/* STEP 1: Phone Verification */}
                <div className="p-4 rounded-xl border border-stone-200/90 bg-stone-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                        1
                      </div>
                      <span className="font-bold text-xs text-stone-900">
                        Step 1: Phone Verification
                      </span>
                    </div>
                    {isPhoneVerified && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Phone Verified
                      </span>
                    )}
                  </div>

                  {isPhoneVerified ? (
                    <p className="text-xs text-stone-600">
                      ✓ Mobile number authenticated via SMS OTP ({profile.records.phone?.maskedReference || `+91 XXXXX X${phoneNumber.slice(-4)}`}).
                    </p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="flex gap-2">
                        <div className="flex items-center px-2.5 bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-600 font-medium">
                          +91
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Enter 10-digit mobile"
                          className="flex-1 text-xs p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={phoneLoading || phoneNumber.length < 10}
                          className="px-3 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs transition-colors disabled:opacity-50"
                        >
                          {phoneLoading ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                        </button>
                      </div>

                      {otpSent && (
                        <div className="flex gap-2 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 text-xs p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-center"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={phoneLoading || otpCode.length < 4}
                            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors disabled:opacity-50"
                          >
                            Verify OTP
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STEP 2: Government Identity */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    !isPhoneVerified
                      ? 'border-stone-200 bg-stone-50/40 opacity-60 pointer-events-none'
                      : 'border-stone-200/90 bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center">
                        2
                      </div>
                      <span className="font-bold text-xs text-stone-900">
                        Step 2: Government Identity
                      </span>
                    </div>
                    {isIdentityVerified && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Identity Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600">
                    Verify using ONE valid government-issued identity document.
                  </p>

                  <form onSubmit={handleVerifyIndividualId} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Choose one:
                      </label>
                      <select
                        value={selectedDoc}
                        onChange={e => setSelectedDoc(e.target.value as GovernmentDocChoice)}
                        className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      >
                        <option value="Aadhaar">Aadhaar (via DigiLocker)</option>
                        <option value="PAN">PAN (Permanent Account Number)</option>
                        <option value="Voter ID">Voter ID (Election Commission)</option>
                        <option value="Driving Licence">Driving Licence (MoRTH)</option>
                        <option value="Passport">Passport (MEA)</option>
                      </select>
                    </div>

                    <div className="p-2.5 rounded-lg bg-stone-100 text-[11px] text-stone-600 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Only masked authentication tokens are stored in the browser.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={idLoading || !isPhoneVerified}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {idLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Verifying Identity...
                        </>
                      ) : (
                        <>
                          <span>Verify Identity</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* BUSINESS BUYER FLOW */}
        {/* ========================================================= */}
        {selectedBuyerType === 'BUSINESS' && (
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Business Buyer Verification
                </h3>
                <p className="text-xs text-stone-500">
                  Verify business credentials to establish wholesale trust with artisans
                </p>
              </div>
              {isBusinessVerified && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Business Buyer
                </span>
              )}
            </div>

            {isBusinessVerified ? (
              /* Verified Business State */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Status</span>
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Business Buyer
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Business Name</span>
                    <span className="font-semibold text-stone-900">
                      {profile.businessDetails?.businessName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Entity Type</span>
                    <span className="font-medium text-stone-800">
                      {profile.businessDetails?.businessType}
                    </span>
                  </div>
                  {profile.businessDetails?.gstin && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">GSTIN</span>
                      <span className="font-mono text-purple-800 font-medium">
                        {profile.businessDetails.gstin} (✓ GST Verified)
                      </span>
                    </div>
                  )}
                  {profile.businessDetails?.udyamRegistration && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Udyam Registration</span>
                      <span className="font-mono text-emerald-800 font-medium">
                        {profile.businessDetails.udyamRegistration} (✓ Udyam Verified)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Verified on</span>
                    <span className="font-medium text-stone-800">
                      {profile.records.business?.verifiedAt
                        ? new Date(profile.records.business.verifiedAt).toLocaleDateString('en-GB')
                        : 'Today'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-stone-700 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Your business credentials are verified. Artisans will see your <strong>✓ Verified Business Buyer</strong> badge when you enquire about crafts.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetBuyer}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium border border-stone-300 hover:bg-stone-100 transition-colors"
                >
                  Change Business Credentials
                </button>
              </div>
            ) : (
              /* Business Verification Form */
              <form onSubmit={handleVerifyBusiness} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Business Name <span className="text-amber-800">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bizDetails.businessName}
                    onChange={e => setBizDetails({ ...bizDetails, businessName: e.target.value })}
                    placeholder="e.g. Tribal Heritage Craft Collective"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Business Type <span className="text-amber-800">*</span>
                  </label>
                  <select
                    value={bizDetails.businessType}
                    onChange={e =>
                      setBizDetails({
                        ...bizDetails,
                        businessType: e.target.value as BusinessBuyerDetails['businessType'],
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  >
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLP">LLP (Limited Liability Partnership)</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Society/Trust">Society / Cooperative / Trust</option>
                    <option value="Other">Other Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-stone-700">
                      Business Registration / Udyam
                    </label>
                    <span className="text-[10px] text-stone-500">Optional / Where applicable</span>
                  </div>
                  <input
                    type="text"
                    value={bizDetails.udyamRegistration || ''}
                    onChange={e =>
                      setBizDetails({ ...bizDetails, udyamRegistration: e.target.value })
                    }
                    placeholder="e.g. UDYAM-JH-08-0012789"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-stone-700">
                      GSTIN
                    </label>
                    <span className="text-[10px] text-stone-500">Optional / Where applicable</span>
                  </div>
                  <input
                    type="text"
                    value={bizDetails.gstin || ''}
                    onChange={e => setBizDetails({ ...bizDetails, gstin: e.target.value })}
                    placeholder="e.g. 20AAAAA0000A1Z5"
                    className="w-full text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <p className="text-[11px] text-stone-500">
                    Not all business buyers are required to have GST registration. Provide if applicable.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Phone Number <span className="text-amber-800">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-2.5 bg-stone-100 border border-stone-300 rounded-lg text-xs text-stone-600 font-medium">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={bizPhone}
                      onChange={e => setBizPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="10-digit phone"
                      className="flex-1 text-xs p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <span>
                    Johar Craft does not publicly reveal proprietary trade details. Only verified trust badges are displayed.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={bizLoading || !bizDetails.businessName.trim() || bizPhone.length < 10}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {bizLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Verifying Business...
                    </>
                  ) : (
                    <>
                      <span>Verify Business</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
