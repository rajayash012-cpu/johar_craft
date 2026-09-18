import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, MapPin, Award, ExternalLink } from 'lucide-react';
import { getArtisan } from '../../utils/storage';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';

export function QRPage() {
  const navigate = useNavigate();
  const artisan = getArtisan();
  const { toasts, addToast, dismissToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  if (!artisan) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🪪</div>
        <h2 className="text-2xl font-display font-bold text-earth-900 mb-3">No Identity Yet</h2>
        <p className="text-earth-600 mb-6">Create your artisan profile to generate your QR Identity.</p>
        <button onClick={() => navigate('/artisan/profile')} className="btn-primary">Create Profile</button>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/artisan/${artisan.id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${artisan.name} – Johar Craft`, text: `Check out ${artisan.name}'s artisan profile on Johar Craft!`, url: profileUrl });
      } catch (_) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      addToast('success', 'Profile link copied!', 'Share it with buyers and customers.');
    });
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artisan.id}-qr-identity.svg`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'QR downloaded!', 'Print it and display at your stall.');
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-earth-900">Digital Artisan Identity</h1>
        <p className="text-earth-600 text-sm mt-1">Your unique QR identity card – share it with buyers</p>
      </div>

      {/* Identity Card */}
      <div className="card-warm overflow-hidden mb-6 border-2 border-earth-300 shadow-lg rounded-3xl">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#4A2C20] via-[#73351C] to-[#B85C38] p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 pattern-sohrai opacity-[0.08] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-brand-300 text-xs">❖</span>
                <span className="text-[11px] text-brand-200 font-sans font-semibold tracking-widest uppercase">
                  Digital Artisan Identity
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-mono">
                Jharkhand Living Craft
              </span>
            </div>
            <div className="flex items-center gap-4">
              {artisan.profilePhoto ? (
                <img
                  src={artisan.profilePhoto}
                  alt={artisan.name}
                  className="w-20 h-20 rounded-2xl object-cover border-3 border-white/40 shadow-sm"
                />
              ) : (
                <PhotoPlaceholder type="artisan" compact className="w-20 h-20 rounded-2xl border-3 border-white/40 bg-white/20 text-white" />
              )}
              <div>
                <h2 className="text-xl font-serif font-bold text-white">{artisan.name}</h2>
                <p className="text-brand-200 font-mono text-xs font-semibold mt-0.5">{artisan.id}</p>
                <div className="flex items-center gap-1.5 mt-2 text-earth-200 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-brand-300" />
                  <span>{artisan.district}, Jharkhand</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-earth-200 text-xs">
                  <span>🏺</span>
                  <span>
                    {artisan.craftCategory}
                    {typeof artisan.yearsExperience === 'number'
                      ? ` · ${artisan.yearsExperience} years`
                      : artisan.yearsExperience && artisan.yearsExperience !== 'Information not provided'
                      ? ` · ${artisan.yearsExperience}`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-4 sm:p-8 flex flex-col items-center bg-[#FAF5EC] border-t border-earth-300">
          <div ref={qrRef} className="p-4 bg-white border-2 border-earth-300 rounded-2xl shadow-xs mb-4">
            <QRCodeSVG
              value={profileUrl}
              size={Math.min(200, Math.max(160, typeof window !== 'undefined' ? window.innerWidth - 120 : 200))}
              fgColor="#4A2C20"
              bgColor="#ffffff"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-earth-700 text-center max-w-xs font-medium">
            Scan this QR code to view {artisan.name}'s verified artisan profile and authentic product catalog
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-700 font-semibold bg-[#FAF4EB] px-3 py-1 rounded-full border border-earth-200">
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs">{profileUrl}</span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-6 py-4 bg-[#F4E5D3] border-t border-earth-300">
          <div className="flex items-center justify-between text-xs text-earth-700">
            <span className="font-serif italic font-medium">Johar Craft Platform</span>
            <div className="flex items-center gap-1 font-semibold text-brand-800">
              <Award className="w-3.5 h-3.5 text-brand-700" />
              <span>Jharkhand Tribal Artisan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleDownloadQR} className="btn-secondary justify-center">
          <Download className="w-4 h-4" />
          Download QR
        </button>
        <button onClick={handleShare} className="btn-primary justify-center">
          <Share2 className="w-4 h-4" />
          Share Identity
        </button>
      </div>

      <div className="mt-4 text-center">
        <button onClick={() => navigate(`/artisan/${artisan.id}`)} className="btn-ghost text-sm">
          <ExternalLink className="w-4 h-4" />
          View Public Profile
        </button>
      </div>
    </div>
  );
}
