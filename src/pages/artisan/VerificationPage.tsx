import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Lock,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  Sliders,
  Award,
  Building2,
  FileCheck,
} from 'lucide-react';
import {
  getArtisan,
  getArtisanVerification,
  saveArtisanVerification,
} from '../../utils/storage';
import {
  verifyGovernmentIdentity,
  verifyPehchan,
  verifyUdyam,
  verifyGSTIN,
  calculateArtisanTier,
  getDocTypeLabel,
  OFFICIAL_PORTAL_URLS,
  type GovernmentDocChoice,
} from '../../services/verificationService';
import type {
  ArtisanVerificationProfile,
  VerificationStatus,
} from '../../types';
import { VerificationDetailsModal } from '../../components/VerificationDetailsModal';

export function VerificationPage() {
  const currentArtisan = getArtisan();
  const artisanId = currentArtisan?.id || 'JH-ART-0001';
  const artisanName = currentArtisan?.name || 'Artisan';

  const [profile, setProfile] = useState<ArtisanVerificationProfile>(() =>
    getArtisanVerification(artisanId)
  );

  // Form Inputs
  const [selectedDoc, setSelectedDoc] = useState<GovernmentDocChoice>('Aadhaar');
  const [pehchanInput, setPehchanInput] = useState('');
  const [udyamInput, setUdyamInput] = useState('');
  const [gstinInput, setGstinInput] = useState('');

  // Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Loading States
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Evaluator / Demo Simulator State
  const [simulatedOutcome, setSimulatedOutcome] = useState<VerificationStatus>('verified');
  const [showDemoControls, setShowDemoControls] = useState(true);

  useEffect(() => {
    const updated = getArtisanVerification(artisanId);
    setProfile(updated);
  }, [artisanId]);

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const identityRecord = profile.records.identity;
  const isIdentityVerified = identityRecord?.status === 'verified';

  // 1. Submit Single Government Identity
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingType('identity');
    try {
      const record = await verifyGovernmentIdentity(
        artisanId,
        selectedDoc,
        simulatedOutcome
      );
      const updatedRecords = { ...profile.records, identity: record };
      const newTier = calculateArtisanTier(updatedRecords);
      const updatedProfile: ArtisanVerificationProfile = {
        artisanId,
        tier: newTier,
        records: updatedRecords,
        lastUpdated: new Date().toISOString(),
        isDemoMode: true,
      };
      saveArtisanVerification(updatedProfile);
      setProfile(updatedProfile);

      if (record.status === 'verified') {
        showToast('Your government identity verification has been completed.', 'success');
      } else if (record.status === 'pending') {
        showToast('Identity verification is pending review.', 'info');
      } else {
        showToast('Verification could not be completed. Your information has not been changed.', 'error');
      }
    } catch {
      showToast('Verification could not be completed. Please try again.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  // 2. Optional: Submit Pehchan Card
  const handleVerifyPehchan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pehchanInput.trim()) {
      showToast('Please enter your Pehchan number.', 'error');
      return;
    }
    setLoadingType('pehchan');
    try {
      const record = await verifyPehchan(artisanId, pehchanInput, simulatedOutcome);
      const updatedRecords = { ...profile.records, pehchan: record };
      const newTier = calculateArtisanTier(updatedRecords);
      const updatedProfile: ArtisanVerificationProfile = {
        artisanId,
        tier: newTier,
        records: updatedRecords,
        lastUpdated: new Date().toISOString(),
        isDemoMode: true,
      };
      saveArtisanVerification(updatedProfile);
      setProfile(updatedProfile);

      if (record.status === 'verified') {
        showToast('Pehchan Artisan Card verified successfully.', 'success');
        setPehchanInput('');
      } else {
        showToast(record.notes || 'Pehchan verification failed.', 'error');
      }
    } catch {
      showToast('Error validating Pehchan number.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  // 3. Optional: Submit Udyam
  const handleVerifyUdyam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udyamInput.trim()) {
      showToast('Please enter your Udyam registration number.', 'error');
      return;
    }
    setLoadingType('udyam');
    try {
      const record = await verifyUdyam(artisanId, udyamInput, simulatedOutcome);
      const updatedRecords = { ...profile.records, udyam: record };
      const newTier = calculateArtisanTier(updatedRecords);
      const updatedProfile: ArtisanVerificationProfile = {
        artisanId,
        tier: newTier,
        records: updatedRecords,
        lastUpdated: new Date().toISOString(),
        isDemoMode: true,
      };
      saveArtisanVerification(updatedProfile);
      setProfile(updatedProfile);

      if (record.status === 'verified') {
        showToast('Udyam MSME registration verified successfully.', 'success');
        setUdyamInput('');
      } else {
        showToast(record.notes || 'Udyam verification failed.', 'error');
      }
    } catch {
      showToast('Error validating Udyam registration.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  // 4. Optional: Submit GSTIN
  const handleVerifyGSTIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gstinInput.trim()) {
      showToast('Please enter your 15-digit GSTIN.', 'error');
      return;
    }
    setLoadingType('gstin');
    try {
      const record = await verifyGSTIN(artisanId, gstinInput, simulatedOutcome);
      const updatedRecords = { ...profile.records, gstin: record };
      const newTier = calculateArtisanTier(updatedRecords);
      const updatedProfile: ArtisanVerificationProfile = {
        artisanId,
        tier: newTier,
        records: updatedRecords,
        lastUpdated: new Date().toISOString(),
        isDemoMode: true,
      };
      saveArtisanVerification(updatedProfile);
      setProfile(updatedProfile);

      if (record.status === 'verified') {
        showToast('GSTIN registration verified successfully.', 'success');
        setGstinInput('');
      } else {
        showToast(record.notes || 'GSTIN verification failed.', 'error');
      }
    } catch {
      showToast('Error validating GSTIN.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  // Demo helper: Reset to unverified
  const handleResetVerification = () => {
    const fresh: ArtisanVerificationProfile = {
      artisanId,
      tier: 'LEVEL_0_UNVERIFIED',
      records: {},
      lastUpdated: new Date().toISOString(),
      isDemoMode: true,
    };
    saveArtisanVerification(fresh);
    setProfile(fresh);
    showToast('Verification reset to unverified.', 'info');
  };

  // Demo helper: Fast auto-fill
  const handleQuickFillDemo = () => {
    setPehchanInput('PEH-JH-8921-2024');
    setUdyamInput('UDYAM-JH-08-0012789');
    setGstinInput('20AAAAA0000A1Z5');
    showToast('Demo credential numbers filled for evaluation.', 'info');
  };

  const verifiedDateStr = identityRecord?.verifiedAt
    ? new Date(identityRecord.verifiedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in text-earth-900">
      {/* Page Header */}
      <div className="text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FAF4EB] border border-earth-300 text-xs text-earth-700 mb-1 font-medium">
          <span className="text-brand-600">❖</span>
          <span>Trust & Credibility System</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-earth-900">
          Trust & Verification Center
        </h1>
        <p className="text-sm text-earth-700">
          Build lasting trust with buyers and galleries through transparent, verified craft identity.
        </p>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-forest-50 text-forest-800 border-forest-200'
              : feedbackMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-brand-50 text-brand-800 border-brand-200'
          }`}
        >
          {feedbackMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-forest-700" />
          ) : (
            <Info className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Demo Verification Mode Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-earth-300 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 text-earth-900 font-semibold text-xs tracking-wide">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            <span>Demo Verification Mode</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoControls(!showDemoControls)}
            className="text-xs text-brand-700 hover:text-brand-900 font-medium underline cursor-pointer"
          >
            {showDemoControls ? 'Hide Evaluator Controls' : 'Show Evaluator Controls'}
          </button>
        </div>
        <p className="text-xs text-earth-600 leading-relaxed">
          This prototype simulates the verification workflow. Production deployment requires integration with an authorized KYC/identity verification provider.
        </p>

        {showDemoControls && (
          <div className="mt-3 pt-3 border-t border-earth-200 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-earth-700">
                Simulated Outcome:
              </span>
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
                  onClick={() => setSimulatedOutcome(opt.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    simulatedOutcome === opt.val
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white text-earth-800 border border-earth-300 hover:bg-earth-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-100 text-brand-900 border border-brand-300 hover:bg-brand-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick-Fill Demo Numbers
                </button>
                <button
                  type="button"
                  onClick={handleResetVerification}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-earth-100 text-earth-800 border border-earth-300 hover:bg-earth-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Unverified
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. PRIMARY CARD: Artisan Identity Verification */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-[#FAF5EC] border border-earth-300 shadow-xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shadow-xs border border-forest-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-earth-900">
                {isIdentityVerified ? 'Identity Verified' : 'Artisan Identity'}
              </h2>
              <p className="text-xs text-earth-600">
                {isIdentityVerified
                  ? 'Your identity has been successfully verified.'
                  : 'Verify using ONE government ID'}
              </p>
            </div>
          </div>

          <div>
            {isIdentityVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-100 text-forest-800 border border-forest-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                Identity Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-earth-100 text-earth-700 border border-earth-200">
                Status: Not Verified
              </span>
            )}
          </div>
        </div>

        {isIdentityVerified ? (
          /* Verified State Display */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Verification method</span>
                <span className="font-semibold text-stone-900">
                  {identityRecord?.documentType
                    ? getDocTypeLabel(identityRecord.documentType)
                    : 'Government ID'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Verified on</span>
                <span className="font-medium text-stone-800">{verifiedDateStr || 'Today'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Masked Reference</span>
                <span className="font-mono text-stone-700 font-medium">
                  {identityRecord?.maskedReference || 'XXXX XXXX 1234'}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                <span>Information shared publicly</span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  Identity Verified badge only
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                View Verification Details
              </button>
              <button
                type="button"
                onClick={handleResetVerification}
                className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium border border-stone-300 hover:bg-stone-100 transition-colors"
              >
                Change / Re-verify Document
              </button>
            </div>
          </div>
        ) : (
          /* Unverified State: Form to choose ONE Government ID */
          <form onSubmit={handleVerifyIdentity} className="space-y-4 pt-2">
            <p className="text-xs text-stone-600 leading-relaxed">
              Verify your identity using one valid government-issued identity document to build trust with buyers.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-700">
                Select ID
              </label>
              <select
                value={selectedDoc}
                onChange={e => setSelectedDoc(e.target.value as GovernmentDocChoice)}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="Aadhaar">Aadhaar (via DigiLocker)</option>
                <option value="PAN">PAN (Permanent Account Number)</option>
                <option value="Voter ID">Voter ID (Election Commission)</option>
                <option value="Driving Licence">Driving Licence (MoRTH)</option>
                <option value="Passport">Passport (MEA)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <span>
                Johar Craft never stores raw identity documents in browser storage. Only masked reference codes are saved.
              </span>
            </div>

            <button
              type="submit"
              disabled={loadingType === 'identity'}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loadingType === 'identity' ? (
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
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. ADDITIONAL CREDENTIALS (OPTIONAL) */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Additional Credentials
          </h3>
          <p className="text-xs text-stone-500">
            Optional artisan registrations for recognized craftspersons, SHGs, and registered craft enterprises. These do not block basic Identity Verified status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Pehchan Artisan Card */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-stone-900">
                    Pehchan Artisan Card
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium px-1.5 py-0.5 rounded bg-stone-100">
                  Optional
                </span>
              </div>

              <p className="text-[11px] text-stone-600">
                Official artisan identity card issued by the Office of DC (Handicrafts), Ministry of Textiles.
              </p>

              {profile.records.pehchan?.status === 'verified' ? (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pehchan Verified</span>
                  </div>
                  <p className="text-[10px] text-blue-700 font-mono">
                    {profile.records.pehchan.maskedReference}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyPehchan} className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={pehchanInput}
                    onChange={e => setPehchanInput(e.target.value)}
                    placeholder="e.g. PEH-JH-8921-2024"
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loadingType === 'pehchan'}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loadingType === 'pehchan' ? 'Verifying...' : 'Add Credential'}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
              <span>DC (Handicrafts)</span>
              <a
                href={OFFICIAL_PORTAL_URLS.PEHCHAN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline flex items-center gap-0.5"
              >
                Portal <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Card B: Udyam Registration */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-stone-900">
                    Udyam Registration
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium px-1.5 py-0.5 rounded bg-stone-100">
                  Optional
                </span>
              </div>

              <p className="text-[11px] text-stone-600">
                Enterprise MSME registration issued by the Ministry of MSME, Govt. of India.
              </p>

              {profile.records.udyam?.status === 'verified' ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Udyam Verified</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    {profile.records.udyam.maskedReference}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyUdyam} className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={udyamInput}
                    onChange={e => setUdyamInput(e.target.value)}
                    placeholder="e.g. UDYAM-JH-08-0012789"
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loadingType === 'udyam'}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loadingType === 'udyam' ? 'Verifying...' : 'Add Credential'}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
              <span>Ministry of MSME</span>
              <a
                href={OFFICIAL_PORTAL_URLS.UDYAM}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                Portal <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Card C: GSTIN Registration */}
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-stone-900">
                    GSTIN
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium px-1.5 py-0.5 rounded bg-stone-100">
                  Optional
                </span>
              </div>

              <p className="text-[11px] text-stone-600">
                15-digit Goods and Services Tax Identification Number for registered businesses.
              </p>

              {profile.records.gstin?.status === 'verified' ? (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>GST Verified</span>
                  </div>
                  <p className="text-[10px] text-purple-700 font-mono">
                    {profile.records.gstin.maskedReference}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerifyGSTIN} className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={gstinInput}
                    onChange={e => setGstinInput(e.target.value)}
                    placeholder="e.g. 20AAAAA0000A1Z5"
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loadingType === 'gstin'}
                    className="w-full py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loadingType === 'gstin' ? 'Verifying...' : 'Add Credential'}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-2 mt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
              <span>GST Network</span>
              <a
                href={OFFICIAL_PORTAL_URLS.GST}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 hover:underline flex items-center gap-0.5"
              >
                Portal <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Details Modal */}
      <VerificationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        artisanName={artisanName}
        tier={profile.tier}
        records={profile.records}
      />
    </div>
  );
}
