import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Building2,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  getBuyerProfile,
  saveBuyerProfile,
} from '../utils/storage';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  verifyBusinessBuyer,
} from '../services/verificationService';
import type { BuyerProfile, BuyerType, BusinessBuyerDetails } from '../types';

interface BuyerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: BuyerProfile) => void;
}

export const BuyerVerificationModal: React.FC<BuyerVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [currentProfile, setCurrentProfile] = useState<BuyerProfile>(() =>
    getBuyerProfile()
  );

  const [activeTab, setActiveTab] = useState<BuyerType>(
    currentProfile.buyerType || 'INDIVIDUAL'
  );

  // Individual Phone OTP flow state
  const [phoneNumber, setPhoneNumber] = useState(
    currentProfile.phone?.replace(/[^0-9]/g, '').slice(-10) || '9876543210'
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Business Buyer flow state
  const [bizDetails, setBizDetails] = useState<BusinessBuyerDetails>({
    businessName: currentProfile.businessDetails?.businessName || '',
    businessType: currentProfile.businessDetails?.businessType || 'Private Limited Company',
    gstin: currentProfile.businessDetails?.gstin || '',
    pan: currentProfile.businessDetails?.pan || '',
    udyamRegistration: currentProfile.businessDetails?.udyamRegistration || '',
    address: currentProfile.businessDetails?.address || '',
  });
  const [bizLoading, setBizLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setFeedback(null);
    try {
      const res = await sendPhoneOTP(phoneNumber);
      if (res.success) {
        setOtpSent(true);
        setDemoCodeHint(res.demoCode);
        setOtpCode(res.demoCode); // prefill for easy evaluation
        setFeedback({ text: `${res.message} (Demo code prefilled: ${res.demoCode})`, type: 'success' });
      } else {
        setFeedback({ text: res.message, type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Failed to send OTP. Please retry.', type: 'error' });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setFeedback(null);
    try {
      const record = await verifyPhoneOTP(currentProfile.id, phoneNumber, otpCode, 'verified');
      if (record.status === 'verified') {
        const updated: BuyerProfile = {
          ...currentProfile,
          phone: `+91 ${phoneNumber}`,
          buyerType: 'INDIVIDUAL',
          records: {
            ...currentProfile.records,
            phone: record,
          },
        };
        saveBuyerProfile(updated);
        setCurrentProfile(updated);
        setFeedback({ text: 'Phone number successfully authenticated!', type: 'success' });
        onSuccess?.(updated);
        setTimeout(() => onClose(), 1200);
      } else {
        setFeedback({ text: record.notes || 'Verification failed.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Error authenticating OTP.', type: 'error' });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizDetails.businessName.trim()) {
      setFeedback({ text: 'Please enter your registered Business / Organization Name.', type: 'error' });
      return;
    }
    setBizLoading(true);
    setFeedback(null);
    try {
      const record = await verifyBusinessBuyer(currentProfile.id, bizDetails, 'verified');
      if (record.status === 'verified') {
        const updated: BuyerProfile = {
          ...currentProfile,
          buyerType: 'BUSINESS',
          businessDetails: bizDetails,
          records: {
            ...currentProfile.records,
            business: record,
          },
        };
        saveBuyerProfile(updated);
        setCurrentProfile(updated);
        setFeedback({ text: 'Enterprise buyer verification successful!', type: 'success' });
        onSuccess?.(updated);
        setTimeout(() => onClose(), 1200);
      } else {
        setFeedback({ text: record.notes || 'Business verification failed.', type: 'error' });
      }
    } catch {
      setFeedback({ text: 'Error verifying business credentials.', type: 'error' });
    } finally {
      setBizLoading(false);
    }
  };

  const isPhoneVerified = currentProfile.records.phone?.status === 'verified';
  const isBusinessVerified = currentProfile.records.business?.status === 'verified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-amber-50/50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                Buyer Trust & Verification
              </h2>
              <p className="text-xs text-stone-600">
                Verify your contact credentials or business entity to establish authenticity with tribal artisans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Individual vs Business */}
        <div className="px-6 pt-4 border-b border-stone-200 flex gap-4 bg-stone-50/60">
          <button
            type="button"
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'INDIVIDUAL'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Individual Buyer (Phone OTP)</span>
            {isPhoneVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BUSINESS')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'BUSINESS'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Business / Enterprise Buyer</span>
            {isBusinessVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: INDIVIDUAL BUYER (Phone OTP) */}
          {activeTab === 'INDIVIDUAL' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-stone-700 leading-relaxed">
                Artisans prioritize enquiries from verified phone numbers. Verify your mobile number with a quick SMS OTP to receive the <strong className="text-stone-900 font-semibold">✓ Phone Verified</strong> credibility badge on your enquiries.
              </div>

              {isPhoneVerified ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900">
                      Mobile Number Verified
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Your enquiries will display the verified badge: <span className="font-mono font-medium text-stone-800">{currentProfile.records.phone?.maskedReference}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Mobile Number (+91)
                      </label>
                      <div className="flex gap-2">
                        <span className="px-3 py-2 text-xs bg-stone-100 border border-stone-300 rounded-xl text-stone-600 font-mono flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="9876543210"
                          className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="submit"
                          disabled={phoneLoading || phoneNumber.length < 10}
                          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {phoneLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {otpSent && (
                    <form onSubmit={handleVerifyOtp} className="space-y-3 pt-3 border-t border-stone-200 animate-in fade-in duration-200">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-stone-700">
                            Enter 6-Digit OTP
                          </label>
                          <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-mono">
                            Demo Code: {demoCodeHint}
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="123456"
                          className="w-full text-center tracking-widest text-lg font-mono p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={phoneLoading || otpCode.length !== 6}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {phoneLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>Confirm & Verify Phone Number</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUSINESS BUYER */}
          {activeTab === 'BUSINESS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-stone-700 leading-relaxed">
                For retail brands, ethical fashion houses, NGOs, and bulk corporate buyers. Verified business buyers get direct artisan cluster introductions and custom quotation support.
              </div>

              {isBusinessVerified ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900">
                      Enterprise Buyer Verified
                    </h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Business Entity: <span className="font-semibold text-stone-800">{currentProfile.businessDetails?.businessName}</span> ({currentProfile.businessDetails?.businessType})
                    </p>
                    <p className="text-[11px] font-mono text-stone-500 mt-1">
                      Reference: {currentProfile.records.business?.maskedReference}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerifyBusiness} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Organization / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizDetails.businessName}
                      onChange={e =>
                        setBizDetails({ ...bizDetails, businessName: e.target.value })
                      }
                      placeholder="e.g. FabCraft India Pvt Ltd"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Business Entity Type
                      </label>
                      <select
                        value={bizDetails.businessType}
                        onChange={e =>
                          setBizDetails({
                            ...bizDetails,
                            businessType: e.target.value as any,
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Private Limited Company">Private Limited Company</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership / LLP</option>
                        <option value="Society/Trust">Society / Non-Profit Trust</option>
                        <option value="Public Limited Company">Public Limited Company</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        GSTIN (Optional / Recommended)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={bizDetails.gstin}
                        onChange={e =>
                          setBizDetails({
                            ...bizDetails,
                            gstin: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g. 20AAAAA0000A1Z5"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Business Operating City / State
                    </label>
                    <input
                      type="text"
                      value={bizDetails.address}
                      onChange={e =>
                        setBizDetails({ ...bizDetails, address: e.target.value })
                      }
                      placeholder="e.g. Ranchi, Jharkhand / Mumbai, Maharashtra"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBizDetails({
                          businessName: 'FabCraft India Pvt Ltd',
                          businessType: 'Private Limited Company',
                          gstin: '20AAACF1234F1Z9',
                          address: 'Ranchi, Jharkhand',
                        })
                      }
                      className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Fill Sample Enterprise Data
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={bizLoading || !bizDetails.businessName.trim()}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50 mt-2"
                  >
                    {bizLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Register Enterprise Buyer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Buyer data is stored locally in your browser session for prototype evaluation.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <a
            href="/buyer/verification"
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
          >
            <span>Open Dedicated Verification Center</span>
            <ArrowRight className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
