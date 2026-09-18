import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Lock,
  Award,
  Building2,
} from 'lucide-react';
import type {
  ArtisanVerificationTier,
  VerificationRecord,
  VerificationType,
} from '../types';
import { OFFICIAL_PORTAL_URLS, getDocTypeLabel } from '../services/verificationService';

interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisanName: string;
  tier?: ArtisanVerificationTier;
  records?: Partial<Record<VerificationType, VerificationRecord>>;
}

export const VerificationDetailsModal: React.FC<VerificationDetailsModalProps> = ({
  isOpen,
  onClose,
  artisanName,
  records = {},
}) => {
  if (!isOpen) return null;

  const identityRecord = records.identity;
  const isIdentityVerified = identityRecord?.status === 'verified';

  // Format verified date
  const verifiedDateStr = identityRecord?.verifiedAt
    ? new Date(identityRecord.verifiedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Active';

  const docLabel = identityRecord?.documentType
    ? getDocTypeLabel(identityRecord.documentType)
    : 'Government ID verification';

  // Optional credentials
  const hasPehchan = records.pehchan?.status === 'verified';
  const hasUdyam = records.udyam?.status === 'verified';
  const hasGstin = records.gstin?.status === 'verified';
  const hasAnyOptional = hasPehchan || hasUdyam || hasGstin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-details-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="verification-details-title" className="text-base font-bold text-stone-900">
                Verification Details
              </h2>
              <p className="text-xs text-stone-500">
                Artisan: <span className="font-semibold text-stone-700">{artisanName}</span>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800">
          {/* Main Identity Box */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 space-y-3.5">
            {/* Row 1: Identity Status */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <span className="text-xs font-medium text-stone-500">Identity</span>
              {isIdentityVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : identityRecord?.status === 'pending' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  Not Verified
                </span>
              )}
            </div>

            {/* Row 2: Verification Method */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Verification method</span>
              <span className="font-medium text-stone-900">{docLabel}</span>
            </div>

            {/* Row 3: Verified On */}
            {isIdentityVerified && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500">Verified on</span>
                <span className="font-medium text-stone-900">{verifiedDateStr}</span>
              </div>
            )}

            {/* Row 4: Information shared publicly */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-500">Information shared publicly</span>
              <span className="font-medium text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded text-[11px] border border-emerald-200/50">
                Identity Verified badge only
              </span>
            </div>
          </div>

          {/* Privacy Notice Card */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-stone-700 flex items-start gap-2.5 leading-relaxed">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900 mb-0.5">
                Sensitive identity information is not displayed publicly.
              </p>
              <p className="text-stone-600 text-[11px]">
                Official document numbers, photos, and biometric data are never shared or stored in browser storage.
              </p>
            </div>
          </div>

          {/* Optional Additional Credentials Section */}
          {hasAnyOptional && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Additional Verified Credentials
              </h4>
              <div className="space-y-2">
                {hasPehchan && (
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-700" />
                      <div>
                        <span className="font-semibold text-blue-950">Pehchan Artisan Card</span>
                        <p className="text-[11px] text-blue-700">DC (Handicrafts), Ministry of Textiles</p>
                      </div>
                    </div>
                    <a
                      href={OFFICIAL_PORTAL_URLS.PEHCHAN}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
                    >
                      Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {hasUdyam && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <div>
                        <span className="font-semibold text-emerald-950">Udyam MSME Registration</span>
                        <p className="text-[11px] text-emerald-700">Ministry of MSME, Govt. of India</p>
                      </div>
                    </div>
                    <a
                      href={OFFICIAL_PORTAL_URLS.UDYAM}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {hasGstin && (
                  <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <div>
                        <span className="font-semibold text-purple-950">GSTIN Registration</span>
                        <p className="text-[11px] text-purple-700">Goods and Services Tax Network</p>
                      </div>
                    </div>
                    <a
                      href={OFFICIAL_PORTAL_URLS.GST}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-700 hover:underline flex items-center gap-1"
                    >
                      Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Johar Craft Trust System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 text-white font-medium text-xs hover:bg-stone-900 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
