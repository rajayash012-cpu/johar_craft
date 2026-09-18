import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, CheckCircle } from 'lucide-react';
import { getArtisan, saveArtisan, generateArtisanId } from '../../utils/storage';
import { saveArtisanPhoto, loadArtisanPhoto, deleteArtisanPhoto } from '../../utils/photo';
import { JHARKHAND_DISTRICTS, CRAFT_CATEGORIES } from '../../types';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { PhotoUploader } from '../../components/PhotoUploader';
import type { Artisan } from '../../types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();
  const existing = getArtisan();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Photo state ────────────────────────────────────────────
  // Load from separate photo store first; fall back to existing URL only if
  // it is not already a data URI (i.e. old URL-based value stays).
  const [photoDataUri, setPhotoDataUri] = useState<string>(() => {
    const stored = loadArtisanPhoto();
    if (stored) return stored;
    // Legacy: existing profile photo that is a URL (not a data URI)
    const legacy = existing?.profilePhoto ?? '';
    return legacy.startsWith('data:') ? legacy : '';
  });

  // ── Form state (no profilePhoto field here anymore) ────────
  const [form, setForm] = useState({
    name: existing?.name || '',
    village: existing?.village || '',
    district: existing?.district || JHARKHAND_DISTRICTS[0],
    craftCategory: existing?.craftCategory || CRAFT_CATEGORIES[0],
    yearsExperience: existing?.yearsExperience || 1,
    phone: existing?.phone || '',
    story: existing?.story || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.village.trim()) e.village = 'Village / Town is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.story.trim()) e.story = 'Please share your artisan story';
    return e;
  };

  const update = (field: string, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  // ── Photo handlers ─────────────────────────────────────────
  const handlePhotoChange = (dataUri: string) => {
    setPhotoDataUri(dataUri);
    saveArtisanPhoto(dataUri);          // persist immediately
  };

  const handlePhotoRemove = () => {
    setPhotoDataUri('');
    deleteArtisanPhoto();
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    // Determine the photo value to embed in the Artisan object.
    // We store the data URI directly so every component that reads
    // artisan.profilePhoto gets the actual image without extra lookups.
    const resolvedPhoto = photoDataUri || undefined;

    const artisan: Artisan = {
      id: existing?.id || generateArtisanId(),
      name: form.name,
      profilePhoto: resolvedPhoto,
      village: form.village,
      district: form.district,
      state: 'Jharkhand',
      craftCategory: form.craftCategory,
      yearsExperience: Number(form.yearsExperience),
      phone: form.phone,
      story: form.story,
      isVerified: false,
      joinedAt: existing?.joinedAt || new Date().toISOString(),
      profileViews: existing?.profileViews ?? 0,
      productViews: existing?.productViews ?? 0,
      enquiries: existing?.enquiries ?? 0,
    };

    saveArtisan(artisan);
    setLoading(false);
    setSaved(true);
    addToast('success', 'Profile saved!', `Your artisan ID is ${artisan.id}`);
  };

  // ── Success screen ─────────────────────────────────────────
  if (saved && getArtisan()) {
    const artisan = getArtisan()!;
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-earth-900 mb-2">Profile Created! 🎉</h2>
        <p className="text-earth-600 mb-6">Your digital artisan identity has been created successfully.</p>

        <div className="card p-6 mb-8 text-left">
          <div className="flex items-center gap-4">
            <img
              src={artisan.profilePhoto}
              alt={artisan.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-200 flex-shrink-0"
            />
            <div>
              <p className="font-bold text-earth-900">{artisan.name}</p>
              <p className="text-brand-600 font-mono text-xl font-bold">{artisan.id}</p>
              <p className="text-sm text-earth-500">{artisan.craftCategory} · {artisan.district}, Jharkhand</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/artisan')} className="btn-primary">Go to Dashboard</button>
          <button onClick={() => navigate('/artisan/qr')} className="btn-secondary">View QR Identity</button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-earth-900">
            {existing ? 'Edit Your Profile' : 'Create Your Artisan Identity'}
          </h1>
        </div>
        <p className="text-earth-600">Your profile is your digital identity — make it count.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">

        {/* ── Profile Photo (new component) ── */}
        <PhotoUploader
          value={photoDataUri}
          onChange={handlePhotoChange}
          onRemove={handlePhotoRemove}
        />

        {/* ── Full Name ── */}
        <div>
          <label className="label">Full Name / Group Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className={`input ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`}
            placeholder="e.g. Birsa Munda Craft Group"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* ── Village + District ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Village / Town *</label>
            <input
              type="text"
              value={form.village}
              onChange={e => update('village', e.target.value)}
              className={`input ${errors.village ? 'border-red-400' : ''}`}
              placeholder="Your village or town"
            />
            {errors.village && <p className="text-red-500 text-xs mt-1">{errors.village}</p>}
          </div>
          <div>
            <label className="label">District</label>
            <select
              value={form.district}
              onChange={e => update('district', e.target.value)}
              className="input"
            >
              {JHARKHAND_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* ── State (locked) ── */}
        <div>
          <label className="label">State</label>
          <input
            type="text"
            value="Jharkhand"
            readOnly
            className="input bg-earth-50 cursor-not-allowed text-earth-500"
          />
        </div>

        {/* ── Craft Category + Years ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Craft Category</label>
            <select
              value={form.craftCategory}
              onChange={e => update('craftCategory', e.target.value)}
              className="input"
            >
              {CRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Years of Experience</label>
            <input
              type="number"
              min="1"
              max="60"
              value={form.yearsExperience}
              onChange={e => update('yearsExperience', Number(e.target.value))}
              className="input"
            />
          </div>
        </div>

        {/* ── Phone ── */}
        <div>
          <label className="label">Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            className={`input ${errors.phone ? 'border-red-400' : ''}`}
            placeholder="+91 XXXXX XXXXX"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* ── Story ── */}
        <div>
          <label className="label">Your Artisan Story *</label>
          <textarea
            rows={5}
            value={form.story}
            onChange={e => update('story', e.target.value)}
            className={`input resize-none ${errors.story ? 'border-red-400' : ''}`}
            placeholder="Tell buyers about your craft tradition, family heritage and skills…"
          />
          {errors.story && <p className="text-red-500 text-xs mt-1">{errors.story}</p>}
          <p className="text-xs text-earth-500 mt-1">
            This appears on your public profile and helps buyers connect with you.
          </p>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center !py-3.5"
        >
          <Save className="w-5 h-5" />
          {loading
            ? 'Saving…'
            : existing ? 'Update Profile' : 'Create My Artisan Identity'}
        </button>
      </form>
    </div>
  );
}
