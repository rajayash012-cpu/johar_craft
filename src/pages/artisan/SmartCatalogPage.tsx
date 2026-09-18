import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  RotateCcw,
  Plus,
  X,
  Calculator,
  ShieldCheck,
  Tag,
  Palette,
  ExternalLink,
  ShoppingBag,
  HelpCircle,
  TrendingUp,
  Search,
  Check,
  FileText,
  Clock,
  Layers,
  Info
} from 'lucide-react';
import { ProductPhotoUploader } from '../../components/ProductPhotoUploader';
import {
  AICatalogService,
  CompleteAICatalogResult
} from '../../services/aiCatalogService';
import { SourceValidationService } from '../../services/sourceValidationService';
import { SAMPLE_CRAFT_PRESETS, SampleCraftPreset } from '../../data/sampleCraftPresets';
import {
  getArtisan,
  getArtisanVerification,
  saveProduct,
  generateProductId
} from '../../utils/storage';
import {
  CRAFT_CATEGORIES,
  FieldSource,
  Product,
  AIConfidence,
  FactProvenance,
  PriceRange,
  PriceReferenceItem
} from '../../types';
import { formatRupees } from '../../utils/pricing';
import { useLanguage } from '../../i18n';
import { getTierLabel } from '../../services/verificationService';

export function SmartCatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const artisan = getArtisan();
  const verifProfile = artisan ? getArtisanVerification(artisan.id) : null;

  // Stages: 'input' -> 'analyzing' -> 'review' -> 'success'
  const [stage, setStage] = useState<'input' | 'analyzing' | 'review' | 'success'>('input');

  // Stage 1: Photos
  const [images, setImages] = useState<string[]>([]);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  // Stage 2: Live Pipeline Animation State
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [pipelineQuery, setPipelineQuery] = useState<string>('');

  // Stage 3: AI Catalog & Research Results
  const [aiResult, setAiResult] = useState<CompleteAICatalogResult | null>(null);
  const [showPriceSourcesModal, setShowPriceSourcesModal] = useState(false);
  const [showResearchSourcesModal, setShowResearchSourcesModal] = useState(false);

  // Editable Catalog Fields in Review Stage
  const [title, setTitle] = useState('');
  const [craftCategory, setCraftCategory] = useState(artisan?.craftCategory || CRAFT_CATEGORIES[0]);
  const [subtype, setSubtype] = useState('');
  const [materials, setMaterials] = useState('');
  const [isMaterialConfirmed, setIsMaterialConfirmed] = useState(false);
  const [color, setColor] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [productionTimeDays, setProductionTimeDays] = useState('3');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [careInstructions, setCareInstructions] = useState('');

  // Fair Price Assistant Suggestion (from URL or localStorage)
  const [suggestedFairPrice, setSuggestedFairPrice] = useState<number | null>(null);

  // Stage 4: Saved Product
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load any price info from search params or localStorage
  useEffect(() => {
    const pParam = searchParams.get('price');
    const dParam = searchParams.get('days');
    const qParam = searchParams.get('qty');

    if (pParam && !isNaN(Number(pParam))) {
      const pNum = Number(pParam);
      setSuggestedFairPrice(pNum);
    } else {
      try {
        const savedPricing = localStorage.getItem('jc_recent_pricing');
        if (savedPricing) {
          const parsed = JSON.parse(savedPricing);
          if (parsed && parsed.suggestedPrice) {
            setSuggestedFairPrice(parsed.suggestedPrice);
          }
        }
      } catch (_) {}
    }

    if (dParam && !isNaN(Number(dParam))) {
      setProductionTimeDays(dParam);
    }
    if (qParam && !isNaN(Number(qParam))) {
      setQuantity(qParam);
    }
  }, [searchParams]);

  // Load sample preset photos
  const handleSelectSample = (sample: SampleCraftPreset) => {
    setSelectedSample(sample.id);
    setImages([sample.image]);
    setErrorMsg('');
  };

  // Run AI Vision & Web Research Pipeline
  const handleStartAnalysis = async () => {
    if (images.length === 0) {
      setErrorMsg('Please upload at least one photo of your handicraft to begin AI analysis.');
      return;
    }

    setErrorMsg('');
    setStage('analyzing');
    setPipelineStep(0);

    // Step 1: AI Vision (Scanning image)
    setPipelineQuery('Scanning photo resolution, colors, and surface texture density...');
    await new Promise((r) => setTimeout(r, 200));
    setPipelineStep(1);

    // Step 2: Craft Classification
    setPipelineQuery('Classifying handicraft form against Jharkhand indigenous craft traditions...');
    await new Promise((r) => setTimeout(r, 200));
    setPipelineStep(2);

    // Step 3: Generating Targeted Search Queries
    setPipelineQuery('Generating targeted queries for DC Handicrafts, GI Registry & Tribes India...');
    await new Promise((r) => setTimeout(r, 200));
    setPipelineStep(3);

    // Step 4: Web Researching Official Sources
    setPipelineQuery('Querying authentic public citations (GI No. 645/646, DC Handicrafts clusters)...');
    await new Promise((r) => setTimeout(r, 200));
    setPipelineStep(4);

    // Step 5: Market Price Research
    setPipelineQuery('Searching comparable handmade listings to compute observed online price range...');
    await new Promise((r) => setTimeout(r, 200));
    setPipelineStep(5);

    try {
      const result = await AICatalogService.processHandicraftPhotos(images, artisan);
      setAiResult(result);

      // Populate editable fields with AI generated results
      setTitle(result.catalog.title);
      setCraftCategory(result.catalog.craftCategory);
      setSubtype(result.catalog.subtype);
      setMaterials(result.catalog.materials);
      setIsMaterialConfirmed(!result.catalog.materialConfirmationRequired);
      setColor(result.catalog.color);
      setDimensions(result.catalog.dimensions === 'Not available' ? '' : result.catalog.dimensions);
      setWeight(result.catalog.weight === 'Not available' ? '' : result.catalog.weight);
      setDescription(result.catalog.detailedDescription);
      setPrice(String(result.catalog.price));
      setTags(result.catalog.tags);
      setProductionTimeDays(String(result.catalog.productionTimeDays));
      setQuantity(String(result.catalog.quantity));

      setPipelineStep(6);
      await new Promise((r) => setTimeout(r, 300));
      setStage('review');
    } catch (err) {
      console.error('AI Catalog Pipeline Error:', err);
      setErrorMsg('AI analysis encountered an issue. You can try again or continue manually.');
      setStage('input');
    }
  };

  // Re-run research if user changes craft category manually during review
  const handleCategoryChangeInReview = async (newCat: string) => {
    setCraftCategory(newCat);
    if (!aiResult) return;
    try {
      const updated = await AICatalogService.processHandicraftPhotos(images, artisan, {
        craftCategory: newCat,
        productName: title,
        materials: isMaterialConfirmed ? materials : undefined,
        dimensions,
        weight,
      });
      setAiResult(updated);
      setDescription(updated.catalog.detailedDescription);
      setPrice(String(updated.catalog.price));
      setTags(updated.catalog.tags);
    } catch (err) {
      console.warn('Failed to refresh research for category:', err);
    }
  };

  // Regenerate description based on current confirmed fields
  const handleRegenerateDescription = async () => {
    if (!aiResult) return;
    try {
      const updated = await AICatalogService.processHandicraftPhotos(images, artisan, {
        craftCategory,
        productName: title,
        materials,
        dimensions,
        weight,
      });
      setDescription(updated.catalog.detailedDescription);
    } catch (err) {
      console.warn('Regenerate failed:', err);
    }
  };

  // Tag Management
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Save and Publish to Marketplace
  const handleSaveAndPublish = (status: 'published' | 'draft') => {
    if (!title.trim()) {
      setErrorMsg('Please enter a product title before publishing.');
      return;
    }

    const prodId = generateProductId();
    const primaryImg = images.length > 0 ? images[0] : undefined;

    // Convert price research to Product format
    const priceRange: PriceRange | undefined = aiResult
      ? {
          min: aiResult.priceResearch.observedMin,
          max: aiResult.priceResearch.observedMax,
          currency: 'INR',
          observedDate: aiResult.priceResearch.researchedDate,
          disclaimer: aiResult.priceResearch.disclaimer,
        }
      : undefined;

    const priceReferences: PriceReferenceItem[] | undefined = aiResult
      ? aiResult.priceResearch.comparables.map((c) => ({
          sourceName: c.sourceName,
          sourceUrl: c.sourceUrl,
          price: c.price,
          currency: 'INR',
          accessedDate: c.accessedDate,
          notes: `${c.title} (${c.matchCriteria.join(', ')})`,
        }))
      : undefined;

    const sourceIds: string[] = aiResult ? aiResult.sources.map((s) => s.id) : [];

    const productToSave: Product = {
      id: prodId,
      artisanId: artisan?.id || 'JC-ART-0001',
      artisanName: artisan?.name || 'Jharkhand Artisan',
      artisanDistrict: artisan?.district || 'Jharkhand',
      name: title.trim(),
      image: primaryImg,
      images: images,
      craftCategory: craftCategory,
      description: description,
      materials: materials || 'Information not provided',
      dimensions: dimensions.trim() || 'Not available',
      productionTimeDays: parseInt(productionTimeDays, 10) || 3,
      stockQuantity: parseInt(quantity, 10) || 1,
      price: parseFloat(price) || 0,
      status: status,
      views: 0,
      createdAt: new Date().toISOString(),
      tags: tags,
      priceRange: priceRange,
      priceReferences: priceReferences,
      sourceIds: sourceIds,
      verificationLevel: aiResult?.culturalContext?.giTagStatus
        ? 'VERIFIED_OFFICIAL'
        : 'PUBLICLY_DOCUMENTED',
      smartCatalog: {
        isSmartCatalogGenerated: true,
        generatedAt: new Date().toISOString(),
        aiIdentification: aiResult?.identification,
        priceResearch: aiResult?.priceResearch,
        researchSources: aiResult?.sources,
        fieldProvenance: aiResult?.catalog.fieldProvenance,
      },
      catalogSource: 'ai_vision',
    };

    saveProduct(productToSave);
    setSavedProduct(productToSave);
    setStage('success');
  };

  // Provenance Badge Renderer
  const renderProvenancePill = (prov?: FactProvenance, source?: FieldSource) => {
    if (prov === 'ARTISAN_PROVIDED' || source === 'artisan') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-md">
          ARTISAN PROVIDED
        </span>
      );
    }
    if (source === 'web_research' || prov === 'RESEARCHED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          WEB RESEARCH
        </span>
      );
    }
    if (prov === 'OBSERVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
          PHOTO OBSERVED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-md">
        <Sparkles className="w-3 h-3 text-purple-600" />
        AI SUGGESTION
      </span>
    );
  };

  // Confidence Chip Renderer
  const renderConfidenceChip = (conf?: AIConfidence) => {
    const val = conf || 'Medium';
    const colorClass =
      val === 'High'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : val === 'Medium'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-stone-600 bg-stone-100 border-stone-200';

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
        title={`AI Confidence Level: ${val}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            val === 'High' ? 'bg-emerald-500' : val === 'Medium' ? 'bg-amber-500' : 'bg-stone-400'
          }`}
        />
        {val} Confidence
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/artisan" className="text-xs text-earth-600 hover:underline">
              Dashboard
            </Link>
            <span className="text-xs text-earth-400">/</span>
            <span className="text-xs font-semibold text-brand-700">Smart Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600" />
            AI Smart Catalog & Web Research
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1 max-w-2xl leading-relaxed">
            Upload your handicraft photo. AI vision identifies the craft, researches real market prices & official sources, and builds your complete listing.
          </p>
        </div>

        {/* Demo AI Mode Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 bg-forest-50 border border-forest-200 px-3 py-1.5 rounded-full shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            Verified Research Engine Active
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STAGE 1: PHOTO-FIRST INPUT                                    */}
      {/* ============================================================ */}
      {stage === 'input' && (
        <div className="space-y-6">
          {/* Main Hero Photo Upload Box */}
          <div className="card-warm p-6 sm:p-8 border-2 border-earth-300 text-center space-y-6 shadow-xs rounded-3xl">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Photo-First Listing
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-earth-900">
                ✨ AI Smart Catalog
              </h2>
              <p className="text-xs sm:text-sm text-earth-700 leading-relaxed">
                Upload a photo of your handicraft and let AI identify, research and prepare your product listing. You can review and edit everything before publishing.
              </p>
            </div>

            {/* Reused ProductPhotoUploader */}
            <div className="max-w-3xl mx-auto text-left">
              <ProductPhotoUploader images={images} onChange={setImages} />
            </div>

            {/* Quick Test Sample Presets (For all 6 test cases) */}
            <div className="pt-4 border-t border-earth-200 max-w-3xl mx-auto text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-earth-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-600" />
                  Or test instantly with a real Jharkhand craft sample:
                </span>
                <span className="text-[11px] text-earth-500">Click any preset to load</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {SAMPLE_CRAFT_PRESETS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedSample === sample.id
                        ? 'border-brand-600 bg-brand-50/80 shadow-xs ring-2 ring-brand-400/40'
                        : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50'
                    }`}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-1.5 bg-earth-100 border border-earth-200 flex items-center justify-center">
                      <img
                        src={sample.image}
                        alt={sample.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-bold text-earth-900 block truncate text-[11px]">
                      {sample.label}
                    </span>
                    <span className="text-[10px] text-earth-600 block truncate">
                      {sample.isAmbiguous ? 'Unknown Test' : sample.craftCategory}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 max-w-lg mx-auto text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <button
                type="button"
                disabled={images.length === 0}
                onClick={handleStartAnalysis}
                className="btn-primary w-full justify-center !py-3.5 !text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5 text-brand-200" />
                <span>✨ Analyze with AI</span>
              </button>

              <div className="flex items-center justify-between text-xs text-earth-500 px-2">
                <span>Accepts up to 4 photos (Main, side, detail, back)</span>
                <Link
                  to="/artisan/add-product"
                  className="text-earth-700 hover:text-earth-950 underline"
                >
                  Continue manually instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STAGE 2: LIVE AI PIPELINE ANIMATION                          */}
      {/* ============================================================ */}
      {stage === 'analyzing' && (
        <div className="card p-8 sm:p-12 border border-stone-200 text-center max-w-2xl mx-auto space-y-6 animate-fade-in shadow-md">
          {/* Main Photo Preview */}
          <div className="relative w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
            {images[0] ? (
              <img
                src={images[0]}
                alt="Analyzing handicraft"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-stone-200" />
            )}
            <div className="absolute inset-0 bg-amber-950/20 backdrop-blur-[1px] flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-white/60 border-t-white rounded-full animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              Analyzing your handicraft...
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              AI Vision & Web Research Engine are compiling verified information.
            </p>
          </div>

          {/* Step-by-Step Progress Pipeline */}
          <div className="space-y-3 text-left max-w-md mx-auto text-xs bg-stone-50 p-5 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-3">
              {pipelineStep > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              )}
              <span className={pipelineStep >= 1 ? 'font-semibold text-stone-900' : 'text-stone-500'}>
                1. AI Vision Analysis (Color, texture, contour)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pipelineStep > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : pipelineStep === 1 ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className={pipelineStep >= 2 ? 'font-semibold text-stone-900' : 'text-stone-400'}>
                2. Craft Classification & Confidence Assessment
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pipelineStep > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : pipelineStep === 2 ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className={pipelineStep >= 3 ? 'font-semibold text-stone-900' : 'text-stone-400'}>
                3. Generating Targeted Web Search Queries
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pipelineStep > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : pipelineStep === 3 ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className={pipelineStep >= 4 ? 'font-semibold text-stone-900' : 'text-stone-400'}>
                4. Researching Official & Reputable Craft Portals
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pipelineStep > 4 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : pipelineStep === 4 ? (
                <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className={pipelineStep >= 5 ? 'font-semibold text-stone-900' : 'text-stone-400'}>
                5. Market Price Research & Comparable Product Matching
              </span>
            </div>

            <div className="flex items-center gap-3">
              {pipelineStep >= 6 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
              )}
              <span className={pipelineStep >= 6 ? 'font-semibold text-stone-900' : 'text-stone-400'}>
                6. Assembling Structured Reviewable Catalog
              </span>
            </div>
          </div>

          {/* Live Action Query Snippet */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-mono">
            <span className="opacity-75">Status: </span>
            {pipelineQuery}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STAGE 3: INTERACTIVE REVIEW & WORKSPACE                      */}
      {/* ============================================================ */}
      {stage === 'review' && aiResult && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  AI CATALOG READY
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-500">Researched 17 September 2026</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
                Review & Confirm Product Listing
              </h2>
              <p className="text-xs text-stone-600">
                AI has researched craft details and online prices. Please review and make any changes before publishing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStage('input')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Upload Different Photo
            </button>
          </div>

          {/* Ambiguous Craft Notice if Not Confidently Identified */}
          {!aiResult.identification.identified && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <span className="font-bold">Unable to Confidently Identify Product: </span>
                  AI could not determine the exact craft category from the photo alone. To prevent errors, please select your craft category below:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CRAFT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChangeInReview(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        craftCategory === cat
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Split Workspace: Left = AI Findings & Research (5 cols) | Right = Editable Form & Preview (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ======================================================== */}
            {/* LEFT COLUMN: AI Vision, Price Research & Verified Sources */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 space-y-5">
              {/* Photo & Thumbnail Gallery */}
              <div className="card p-4 border border-stone-200 space-y-3">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
                  <img
                    src={images[0]}
                    alt="Analyzed Handicraft"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs border border-stone-200">
                      Primary Photo
                    </span>
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0"
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 1: AI Vision Analysis */}
              <div className="card p-5 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-700" />
                    <h3 className="font-bold text-sm text-stone-900">AI Vision Findings</h3>
                  </div>
                  {renderConfidenceChip(aiResult.identification.confidence.overall)}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Likely Product:</span>
                    <div className="text-right">
                      <span className="font-semibold text-stone-800 block">
                        {aiResult.identification.productName}
                      </span>
                      {renderProvenancePill(aiResult.identification.provenance.productName)}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Craft Category:</span>
                    <div className="text-right">
                      <span className="font-semibold text-stone-800 block">
                        {aiResult.identification.craftCategory}
                      </span>
                      {renderConfidenceChip(aiResult.identification.confidence.craftCategory)}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Visible Material:</span>
                    <div className="text-right">
                      <span className="font-semibold text-stone-800 block">
                        {aiResult.identification.visibleMaterial}
                      </span>
                      {renderProvenancePill(aiResult.identification.provenance.material)}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Observed Colors:</span>
                    <div className="flex gap-1 justify-end flex-wrap">
                      {aiResult.identification.visibleColors.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Shape / Form:</span>
                    <span className="font-medium text-stone-800 text-right">
                      {aiResult.identification.shape}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-stone-500">Intended Uses:</span>
                    <span className="font-medium text-stone-800 text-right">
                      {aiResult.identification.possibleUses.join(', ')}
                    </span>
                  </div>
                </div>

                {/* AI Notes */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-600">
                  <span className="font-bold text-stone-700 block">Analysis Details:</span>
                  {aiResult.identification.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-700">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: AI Market Price Research */}
              <div className="card p-5 border-2 border-amber-300 bg-amber-50/40 space-y-3.5">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-700" />
                    <h3 className="font-bold text-sm text-stone-900">
                      AI Market Price Research
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {aiResult.priceResearch.comparableCount} Listings Found
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-stone-500 block">
                    Observed Online Price Range:
                  </span>
                  <div className="text-2xl font-serif font-extrabold text-amber-950">
                    {formatRupees(aiResult.priceResearch.observedMin)} —{' '}
                    {formatRupees(aiResult.priceResearch.observedMax)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-stone-600">
                      Reference Price: <strong>{formatRupees(aiResult.priceResearch.referencePrice)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPriceSourcesModal(true)}
                      className="text-xs text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      [ View Sources ({aiResult.priceResearch.comparableCount}) ]
                    </button>
                  </div>
                </div>

                {/* Mandatory Disclaimer */}
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-stone-600 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    ⚠ This is a reference based on online listings, not a guaranteed market price. You remain free to set your own price.
                  </span>
                </div>

                {/* Quick Price Actions for the Artisan */}
                <div className="pt-2 border-t border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900">Your Selling Price (₹)</label>
                    <button
                      type="button"
                      onClick={() => setPrice(String(aiResult.priceResearch.referencePrice))}
                      className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
                    >
                      Use Reference Price ({formatRupees(aiResult.priceResearch.referencePrice)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      className="input pl-8 font-bold text-stone-900 text-base"
                    />
                  </div>

                  {suggestedFairPrice !== null && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                        Fair Price Assistant: {formatRupees(suggestedFairPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrice(String(suggestedFairPrice))}
                        className="font-bold underline cursor-pointer hover:text-emerald-950"
                      >
                        Use Cost-Based Price
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Research Sources Summary */}
              <div className="card p-5 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm text-stone-900">🔎 AI Research Sources</h3>
                  </div>
                  <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                    {aiResult.sources.length} Sources
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      ✓ Official Sources:
                    </span>
                    <span className="font-bold">
                      {aiResult.sources.filter((s) => s.quality === 'OFFICIAL').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                      ✓ Reputable Archives:
                    </span>
                    <span className="font-bold">
                      {aiResult.sources.filter((s) => s.quality === 'REPUTABLE').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      ✓ Market References:
                    </span>
                    <span className="font-bold">
                      {aiResult.sources.filter((s) => s.quality === 'MARKETPLACE').length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResearchSourcesModal(true)}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View All Verified Sources & Citations
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: Editable Structured Catalog & Live Preview */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 space-y-5">
              {/* Artisan Identity Confirmation Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                    {artisan?.name ? artisan.name[0] : 'A'}
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">
                      {artisan?.name || 'Jharkhand Artisan'} ({artisan?.id || 'JC-ART-0001'})
                    </span>
                    <span className="text-stone-500">
                      {artisan?.district || 'Jharkhand'} · {verifProfile ? getTierLabel(verifProfile.tier) : 'Identity Verified'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-md">
                  Artisan Verified Identity
                </span>
              </div>

              {/* Editable Field 1: Title */}
              <div className="card p-5 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="label !mb-0 font-bold">Product Name</label>
                  {renderProvenancePill(undefined, 'ai_vision')}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input font-medium text-base"
                />
              </div>

              {/* Editable Field 2: Classification & Material */}
              <div className="card p-5 border border-stone-200 space-y-4">
                <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
                  Classification & Materials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="label">Craft Category</label>
                    <select
                      value={craftCategory}
                      onChange={(e) => handleCategoryChangeInReview(e.target.value)}
                      className="input cursor-pointer font-medium"
                    >
                      {CRAFT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="Other Handicrafts">Other Handicrafts</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Craft Subtype</label>
                    <input
                      type="text"
                      value={subtype}
                      onChange={(e) => setSubtype(e.target.value)}
                      placeholder="e.g. Lost-Wax Bell Metal, Utility Basket..."
                      className="input"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="label !mb-0">
                        Material <span className="text-red-500">*</span>
                      </label>
                      {isMaterialConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Artisan Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠ AI Inference — Please Confirm
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={materials}
                        onChange={(e) => {
                          setMaterials(e.target.value);
                          setIsMaterialConfirmed(true);
                        }}
                        className="input"
                      />
                      {!isMaterialConfirmed && (
                        <button
                          type="button"
                          onClick={() => setIsMaterialConfirmed(true)}
                          className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">Dimensions / Size</label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="Not available — enter if known (e.g. 15 x 10 cm)"
                      className="input"
                    />
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Never invented by AI. Enter only if measured.
                    </span>
                  </div>

                  <div>
                    <label className="label">Weight</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Not available — enter if known (e.g. 650g)"
                      className="input"
                    />
                    <span className="text-[10px] text-stone-400 block mt-1">
                      Never invented by AI. Enter only if weighed.
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Field 3: Structured Factual Description */}
              <div className="card p-5 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label !mb-0 font-bold">Structured Product Description</label>
                    <p className="text-[11px] text-stone-500">
                      Generated strictly from confirmed materials and verified research. No exaggerated claims.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateDescription}
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Regenerate Description"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="input font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Editable Field 4: Tags & Production */}
              <div className="card p-5 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-700" />
                    <label className="label !mb-0 font-bold">Searchable Marketplace Tags</label>
                  </div>
                  {renderProvenancePill(undefined, 'ai_vision')}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tg) => (
                    <span
                      key={tg}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-900 border border-amber-200 font-medium"
                    >
                      #{tg}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tg)}
                        className="p-0.5 rounded-full hover:bg-amber-200 text-amber-800 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add custom tag (e.g. EcoFriendly)..."
                    className="input !py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    + Add Tag
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 text-xs">
                  <div>
                    <label className="label">Stock Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Production Time (Days)</label>
                    <input
                      type="number"
                      value={productionTimeDays}
                      onChange={(e) => setProductionTimeDays(e.target.value)}
                      min="1"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveAndPublish('published')}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-serif font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Save & Publish to Marketplace</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndPublish('draft')}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MODAL 1: Price Sources Details                                */}
          {/* ============================================================ */}
          {showPriceSourcesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-700" />
                    <h3 className="font-serif font-bold text-lg text-stone-900">
                      Comparable Price Sources
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPriceSourcesModal(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-stone-600 leading-relaxed">
                  The observed online price range (
                  <strong>
                    {formatRupees(aiResult.priceResearch.observedMin)} —{' '}
                    {formatRupees(aiResult.priceResearch.observedMax)}
                  </strong>
                  ) is derived from public market listings checked on{' '}
                  <strong>{aiResult.priceResearch.researchedDate}</strong>.
                </div>

                <div className="space-y-3">
                  {aiResult.priceResearch.comparables.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-stone-900 text-sm block">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            {item.sourceName} · {item.accessedDate}
                          </span>
                        </div>
                        <span className="font-serif font-bold text-base text-amber-900 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                          {formatRupees(item.price)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.matchCriteria.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-white text-stone-600 px-2 py-0.5 rounded border border-stone-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>

                      {item.sourceUrl && (
                        <div className="pt-1">
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-amber-800 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            View Original Public Listing <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPriceSourcesModal(false)}
                    className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODAL 2: Research Citations & Sources                          */}
          {/* ============================================================ */}
          {showResearchSourcesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-serif font-bold text-lg text-stone-900">
                      Verified Research Citations
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResearchSourcesModal(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {aiResult.sources.map((src, idx) => {
                    const badge = SourceValidationService.getQualityBadge(src.quality);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-stone-900 text-sm block">
                              {src.title}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {src.sourceName} · Accessed {src.accessedDate}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {src.excerpt && (
                          <p className="text-stone-600 leading-relaxed italic bg-white p-2.5 rounded-xl border border-stone-200/60">
                            "{src.excerpt}"
                          </p>
                        )}

                        <div>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-amber-800 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Access Official Portal <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-stone-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResearchSourcesModal(false)}
                    className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STAGE 4: PUBLISHED SUCCESS VIEW                              */}
      {/* ============================================================ */}
      {stage === 'success' && savedProduct && (
        <div className="card p-8 border border-stone-200 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {savedProduct.status === 'published' ? 'Published to Marketplace' : 'Draft Saved'}
            </span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">
              "{savedProduct.name}"
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Catalog ID: {savedProduct.id} · Linked to Artisan {savedProduct.artisanId}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Craft Category:</span>
              <span className="font-semibold text-stone-800">{savedProduct.craftCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Selling Price:</span>
              <span className="font-semibold text-stone-800">
                {savedProduct.price ? formatRupees(savedProduct.price) : 'Price on Enquiry'}
              </span>
            </div>
            {savedProduct.priceRange && (
              <div className="flex justify-between">
                <span className="text-stone-500">Online Reference:</span>
                <span className="font-medium text-amber-900">
                  {formatRupees(savedProduct.priceRange.min)} — {formatRupees(savedProduct.priceRange.max)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-500">Marketplace Status:</span>
              <span className="font-semibold text-emerald-700 capitalize">{savedProduct.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {savedProduct.status === 'published' && (
              <button
                type="button"
                onClick={() => navigate(`/product/${savedProduct.id}`)}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View in Marketplace</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/artisan/products')}
              className="flex-1 py-3 px-4 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              My Products
            </button>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setImages([]);
                setAiResult(null);
                setStage('input');
              }}
              className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
            >
              + Create Another Smart Catalog Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartCatalogPage;
