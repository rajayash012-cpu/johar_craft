import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  X,
  Package,
} from 'lucide-react';
import { getBuyerProfile, createEnquiry } from '../utils/storage';
import { BuyerVerificationModal } from './BuyerVerificationModal';
import type { BuyerProfile } from '../types';

interface ContactArtisanModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisanId: string;
  artisanName: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  onSuccess?: () => void;
}

export const ContactArtisanModal: React.FC<ContactArtisanModalProps> = ({
  isOpen,
  onClose,
  artisanId,
  artisanName,
  productId = '',
  productName = 'Handmade Craft',
  productPrice,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>(() =>
    getBuyerProfile()
  );
  const [buyerModalOpen, setBuyerModalOpen] = useState(false);

  const [buyerName, setBuyerName] = useState(buyerProfile.name || '');
  const [buyerContact, setBuyerContact] = useState(
    buyerProfile.phone || buyerProfile.email || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(
    `Namaste, I am interested in purchasing ${productName}. Please let me know the availability and delivery details.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [successSent, setSuccessSent] = useState(false);

  const isPhoneVerified = buyerProfile.records.phone?.status === 'verified';
  const isIdentityVerified = buyerProfile.records.identity?.status === 'verified';
  const isBusinessVerified = buyerProfile.records.business?.status === 'verified';

  const verificationBadges: string[] = [];
  if (isBusinessVerified) {
    verificationBadges.push('Verified Business Buyer');
    if (buyerProfile.records.gstin?.status === 'verified' || buyerProfile.businessDetails?.gstin) {
      verificationBadges.push('GST Verified');
    }
    if (buyerProfile.records.udyam?.status === 'verified' || buyerProfile.businessDetails?.udyamRegistration) {
      verificationBadges.push('Udyam Verified');
    }
  } else if (isIdentityVerified) {
    verificationBadges.push('Verified Buyer');
  } else if (isPhoneVerified) {
    verificationBadges.push('Phone Verified');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerContact.trim()) return;

    setSubmitting(true);

    const enquiry = createEnquiry({
      productId,
      productName,
      artisanId,
      buyer: {
        id: buyerProfile.id,
        name: buyerName,
        phone: buyerContact.includes('@') ? undefined : buyerContact,
        email: buyerContact.includes('@') ? buyerContact : undefined,
        buyerType: buyerProfile.buyerType,
        businessName: buyerProfile.businessDetails?.businessName,
        verificationBadges,
      },
      message,
      quantity: Math.max(1, quantity),
    });

    setSubmitting(false);
    setSuccessSent(true);
    onSuccess?.();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-stone-50 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">
                Contact Artisan Directly
              </h2>
              <p className="text-xs text-stone-600">
                Send an authentic enquiry directly to{' '}
                <span className="font-semibold text-stone-800">{artisanName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {successSent ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-serif">
                  Enquiry Sent Successfully!
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto">
                  Your enquiry has been delivered to {artisanName}. The artisan will see your trust credentials and contact details.
                </p>
              </div>
            ) : (
              <>
                {/* Product Summary */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-stone-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-stone-800 line-clamp-1">
                        {productName}
                      </div>
                      {productPrice !== undefined && (
                        <div className="text-amber-800 font-medium">
                          ₹{productPrice.toLocaleString('en-IN')} per unit
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buyer Trust Status Bar */}
                <div className="p-3.5 rounded-xl border bg-gradient-to-r from-stone-50 to-amber-50/40 border-stone-200">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Your Buyer Credibility:</span>
                    </span>
                    {verificationBadges.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {verificationBadges.map(b => (
                          <span
                            key={b}
                            className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> {b}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
                        Unverified Contact
                      </span>
                    )}
                  </div>

                  {verificationBadges.length === 0 ? (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-stone-500">
                        Artisans prioritize verified buyers.
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuyerModalOpen(true)}
                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline"
                      >
                        Verify in 30 Seconds →
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-700">
                      Artisans will see your verified status on this enquiry.
                    </p>
                  )}
                </div>

                {/* Enquiry Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        placeholder="e.g. Anita Verma"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Phone or Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerContact}
                        onChange={e => setBuyerContact(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Quantity Required
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Message / Customization Request
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-3"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending Enquiry...' : 'Send Enquiry to Artisan'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Buyer Verification Modal */}
      {buyerModalOpen && (
        <BuyerVerificationModal
          isOpen={buyerModalOpen}
          onClose={() => setBuyerModalOpen(false)}
          onSuccess={updated => {
            setBuyerProfile(updated);
            if (updated.name) setBuyerName(updated.name);
            if (updated.phone) setBuyerContact(updated.phone);
          }}
        />
      )}
    </>
  );
};
