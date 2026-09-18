import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, PlusCircle, Sparkles, CheckCircle, Calculator, ArrowLeft } from 'lucide-react';
import { getArtisan, saveProduct, generateProductId, getProductById } from '../../utils/storage';
import { CRAFT_CATEGORIES } from '../../types';
import { formatRupees } from '../../utils/pricing';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';
import { ProductPhotoUploader } from '../../components/ProductPhotoUploader';
import { SmartCatalogService } from '../../services/smartCatalogService';
import type { Product } from '../../types';

function generateCatalogDescription(name: string, material: string, category: string, days: number): string {
  return SmartCatalogService.generateDescription({
    name,
    materials: material,
    category,
    productionTimeDays: days
  });
}

export function AddProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toasts, addToast, dismissToast } = useToast();
  const artisan = getArtisan();

  const [step, setStep] = useState<'form' | 'catalog' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [catalogPreview, setCatalogPreview] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    craftCategory: artisan?.craftCategory || CRAFT_CATEGORIES[0],
    description: '',
    materials: '',
    productionTimeDays: 3,
    stockQuantity: 10,
    rawMaterial: 0,
    labour: 0,
    packaging: 0,
    transportation: 0,
    other: 0,
    price: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if in edit mode
  useEffect(() => {
    if (editId) {
      const existingProduct = getProductById(editId);
      if (existingProduct) {
        setForm({
          name: existingProduct.name,
          craftCategory: existingProduct.craftCategory,
          description: existingProduct.description,
          materials: existingProduct.materials,
          productionTimeDays: typeof existingProduct.productionTimeDays === 'number' ? existingProduct.productionTimeDays : 1,
          stockQuantity: existingProduct.stockQuantity ?? 1,
          rawMaterial: existingProduct.costs?.rawMaterial || 0,
          labour: existingProduct.costs?.labour || 0,
          packaging: existingProduct.costs?.packaging || 0,
          transportation: existingProduct.costs?.transportation || 0,
          other: existingProduct.costs?.other || 0,
          price: existingProduct.price ?? 0,
        });
        if (existingProduct.images && existingProduct.images.length > 0) {
          setImages(existingProduct.images);
        } else if (existingProduct.image) {
          setImages([existingProduct.image]);
        }
      }
    }
  }, [editId]);

  const update = (field: string, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const totalCost = form.rawMaterial + form.labour + form.packaging + form.transportation + form.other;
  const suggestedPrice = totalCost > 0 ? Math.ceil(totalCost * 1.25) : 0;

  const handleGenerateCatalog = () => {
    if (!form.name.trim()) {
      addToast('warning', 'Please enter a product name first');
      setErrors((e) => ({ ...e, name: 'Product name is required' }));
      return;
    }
    const preview = generateCatalogDescription(
      form.name,
      form.materials,
      form.craftCategory,
      form.productionTimeDays
    );
    setCatalogPreview(preview);
    setStep('catalog');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (form.price <= 0 && suggestedPrice <= 0) e.price = 'Please set a price';
    return e;
  };

  const handlePublish = async () => {
    const effectivePrice = form.price > 0 ? form.price : suggestedPrice;
    if (effectivePrice <= 0) {
      setErrors((e) => ({ ...e, price: 'Please enter a selling price' }));
      return;
    }
    if (!artisan) {
      addToast('error', 'Please create your artisan profile first');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const mainImage = images.length > 0 ? images[0] : undefined;

    const product: Product = {
      id: editId || generateProductId(),
      artisanId: artisan.id,
      artisanName: artisan.name,
      artisanDistrict: artisan.district,
      name: form.name.trim(),
      image: mainImage,
      images: images.length > 0 ? images : undefined,
      craftCategory: form.craftCategory,
      description:
        form.description.trim() ||
        catalogPreview ||
        `A handcrafted ${form.craftCategory} product from ${artisan.district}, Jharkhand.`,
      materials: form.materials.trim() || 'Traditional materials',
      productionTimeDays: form.productionTimeDays,
      stockQuantity: form.stockQuantity,
      price: effectivePrice,
      status: 'published',
      views: editId ? (getProductById(editId)?.views || 0) : 0,
      createdAt: editId ? (getProductById(editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      tags: [
        `#${form.craftCategory.replace(/\s+&\s+/g, '').replace(/\s+/g, '')}`,
        '#JharkhandCraft',
        '#Handmade',
        '#TribalArt',
        `#${artisan.district}Crafts`,
      ],
      costs: {
        rawMaterial: form.rawMaterial,
        labour: form.labour,
        packaging: form.packaging,
        transportation: form.transportation,
        other: form.other,
      },
    };

    saveProduct(product);
    setLoading(false);
    setStep('success');
    addToast('success', editId ? 'Product updated!' : 'Product published!', 'It is now live in the marketplace.');
  };

  if (!artisan) {
    return (
      <div className="text-center py-20">
        <p className="text-earth-500 mb-4">Please create your artisan profile first.</p>
        <button onClick={() => navigate('/artisan/profile')} className="btn-primary">
          Create Profile
        </button>
      </div>
    );
  }

  // ─── SUCCESS SCREEN ──────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-earth-900 mb-2">
          {editId ? 'Product Updated! 🎉' : 'Product Published! 🎉'}
        </h2>
        <p className="text-earth-600 mb-6">
          Your product is live in the marketplace with {images.length} photo{images.length !== 1 ? 's' : ''}.
        </p>

        {images.length > 0 && (
          <div className="card p-4 mb-6 flex items-center gap-4 text-left">
            <img
              src={images[0]}
              alt={form.name}
              className="w-16 h-16 rounded-xl object-cover border border-earth-200"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-earth-900 text-sm truncate">{form.name}</h4>
              <p className="text-xs text-brand-600 font-semibold">{form.craftCategory}</p>
              <p className="text-xs text-earth-500 mt-0.5">
                Price: {formatRupees(form.price > 0 ? form.price : suggestedPrice)}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/marketplace')} className="btn-primary">
            View in Marketplace
          </button>
          <button onClick={() => navigate('/artisan/products')} className="btn-secondary">
            Manage Products
          </button>
          <button
            onClick={() => {
              setStep('form');
              setImages([]);
              setForm({
                name: '',
                craftCategory: artisan.craftCategory || CRAFT_CATEGORIES[0],
                description: '',
                materials: '',
                productionTimeDays: 3,
                stockQuantity: 10,
                rawMaterial: 0,
                labour: 0,
                packaging: 0,
                transportation: 0,
                other: 0,
                price: 0,
              });
            }}
            className="btn-outline"
          >
            + Add Another
          </button>
        </div>
      </div>
    );
  }

  // ─── SMART CATALOG PREVIEW STEP ──────────────────────────────
  if (step === 'catalog') {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-earth-900">Smart Catalog Preview</h1>
            <p className="text-sm text-earth-500">AI-powered catalog listing generated for your product</p>
          </div>
        </div>

        {/* Product photo banner in smart catalog */}
        {images.length > 0 && (
          <div className="card p-4 mb-6 bg-earth-50/70 border-earth-200 flex items-center gap-4">
            <div className="relative">
              <img
                src={images[0]}
                alt={form.name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-xs"
              />
              <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                Main
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="badge-brand text-xs mb-1 inline-block">{form.craftCategory}</span>
              <h3 className="font-bold text-earth-900 truncate">{form.name}</h3>
              <p className="text-xs text-earth-500">
                {images.length} photo{images.length !== 1 ? 's' : ''} ready to publish
              </p>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-earth-100">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Smart Catalog Generated</span>
            <span className="ml-auto badge bg-purple-100 text-purple-700">AI-Assisted</span>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-earth-800 leading-relaxed">
            {catalogPreview}
          </pre>
        </div>

        <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> This is a template-based catalog description generated from your product details.
            Review and adjust your price before publishing.
          </p>
        </div>

        {/* Set Price */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-earth-900 mb-4">Set Your Selling Price</h3>
          {totalCost > 0 && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-brand-700">
                <span className="font-semibold">Suggested price:</span> {formatRupees(suggestedPrice)}
                <span className="text-xs ml-2 text-brand-500">(based on your costs + 25% margin)</span>
              </p>
            </div>
          )}
          <div>
            <label className="label">Selling Price (₹) *</label>
            <input
              type="number"
              value={form.price || (suggestedPrice > 0 ? suggestedPrice : '')}
              onChange={(e) => update('price', Number(e.target.value))}
              className={`input ${errors.price ? 'border-red-400' : ''}`}
              placeholder={suggestedPrice > 0 ? String(suggestedPrice) : 'Enter price in Rupees'}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </button>
          <button onClick={handlePublish} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Publishing...' : <><Save className="w-4 h-4" /> Publish Product</>}
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM STEP ──────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-earth-900">
            {editId ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-earth-600 text-sm">List an authentic handicraft product in the marketplace</p>
        </div>
      </div>

      {/* Smart Catalog Callout Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900">Try Smart Cataloging</h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Upload photos & let assistive AI organize structured descriptions and tags.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/artisan/smart-catalog')}
          className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shrink-0 shadow-2xs transition-colors cursor-pointer"
        >
          ✨ Open Smart Catalog →
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Product Photos Component */}
        <div className="card p-6">
          <ProductPhotoUploader
            images={images}
            onChange={(newImages) => {
              setImages(newImages);
            }}
          />
        </div>

        {/* 2. Product Information */}
        <div className="card p-6">
          <h2 className="font-semibold text-earth-900 mb-4">Product Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={`input ${errors.name ? 'border-red-400' : ''}`}
                placeholder="e.g. Traditional Handcrafted Dokra Elephant"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Craft Category</label>
              <select
                value={form.craftCategory}
                onChange={(e) => update('craftCategory', e.target.value)}
                className="input"
              >
                {CRAFT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="input resize-none"
                placeholder="Describe your product tradition, features, and styling (or click Generate Smart Catalog below)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Materials Used</label>
                <input
                  type="text"
                  value={form.materials}
                  onChange={(e) => update('materials', e.target.value)}
                  className="input"
                  placeholder="e.g. Brass, Clay, Beeswax"
                />
              </div>
              <div>
                <label className="label">Production Time (days)</label>
                <input
                  type="number"
                  min="1"
                  value={form.productionTimeDays}
                  onChange={(e) => update('productionTimeDays', Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Stock Quantity Available</label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => update('stockQuantity', Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* 3. Production Costs & Pricing */}
        <div className="card p-6">
          <h2 className="font-semibold text-earth-900 mb-1">Production Costs & Fair Price</h2>
          <p className="text-sm text-earth-500 mb-4">
            Enter your costs to calculate a fair, profitable selling price
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { field: 'rawMaterial', label: 'Raw Material Cost (₹)' },
              { field: 'labour', label: 'Artisan Labour Cost (₹)' },
              { field: 'packaging', label: 'Packaging Cost (₹)' },
              { field: 'transportation', label: 'Transportation Cost (₹)' },
              { field: 'other', label: 'Other Tooling / Fuel (₹)' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={(form as Record<string, any>)[field] || ''}
                  onChange={(e) => update(field, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {totalCost > 0 && (
            <div className="mt-4 p-4 bg-earth-50 rounded-xl border border-earth-200">
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">Total Production Cost:</span>
                <span className="font-bold text-earth-900">{formatRupees(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-earth-600">Suggested Selling Price (+25% margin):</span>
                <span className="font-bold text-brand-600">{formatRupees(suggestedPrice)}</span>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-earth-100">
            <label className="label">Final Selling Price (₹) *</label>
            <input
              type="number"
              value={form.price || ''}
              onChange={(e) => update('price', Number(e.target.value))}
              className={`input ${errors.price ? 'border-red-400' : ''}`}
              placeholder={suggestedPrice > 0 ? String(suggestedPrice) : 'Enter price in Rupees'}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGenerateCatalog}
            className="btn-secondary flex-1 justify-center !py-3"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Generate Smart Catalog
          </button>
          <button
            type="button"
            onClick={() => {
              const errs = validate();
              setErrors(errs);
              if (Object.keys(errs).length === 0) {
                handlePublish();
              }
            }}
            className="btn-primary flex-1 justify-center !py-3"
          >
            <Save className="w-4 h-4" />
            {editId ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/artisan/pricing')}
            className="btn-ghost text-sm text-earth-600"
          >
            <Calculator className="w-4 h-4" /> Need help? Open Fair Price Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
