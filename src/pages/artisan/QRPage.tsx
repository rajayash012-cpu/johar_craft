import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, MapPin, Award, ExternalLink } from 'lucide-react';
import { getArtisan, getArtisanById } from '../../utils/storage';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { useLanguage } from '../../i18n';

export function QRPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { t } = useLanguage();
  const artisan = id ? getArtisanById(id) || getArtisan() : getArtisan();
  const { toasts, addToast, dismissToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  if (!artisan) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🪪</div>
        <h2 className="text-2xl font-display font-bold text-earth-900 mb-3">{t('qr.no_identity_title')}</h2>
        <p className="text-earth-600 mb-6">{t('qr.no_identity_desc')}</p>
        <button onClick={() => navigate('/artisan/profile')} className="btn-primary cursor-pointer">
          {t('qr.create_profile')}
        </button>
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
      addToast('success', t('qr.link_copied'), t('qr.link_copied_desc'));
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
    addToast('success', t('qr.qr_downloaded'), t('qr.qr_downloaded_desc'));
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-earth-900">{t('artisan.qr_identity')}</h1>
        <p className="text-earth-600 text-sm mt-1">{t('qr.subtitle')}</p>
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
                  {t('qr.digital_artisan_identity')}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-mono">
                {t('qr.living_craft')}
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
                  <span>{artisan.district}, {t('crafts.jharkhand')}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-earth-200 text-xs">
                  <span>🏺</span>
                  <span>
                    {artisan.craftCategory}
                    {typeof artisan.yearsExperience === 'number'
                      ? ` · ${t('artisan.years_exp', { count: artisan.yearsExperience })}`
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
            {t('qr.scan_instruction', { name: artisan.name })}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-700 font-semibold bg-[#FAF4EB] px-3 py-1 rounded-full border border-earth-200">
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs">{profileUrl}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#FAF4EB] border-t border-earth-200 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 btn-primary justify-center flex items-center gap-2 text-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('qr.share_profile')}</span>
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex-1 btn-secondary justify-center flex items-center gap-2 text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('qr.download_qr')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRPage;
