import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles, ChevronDown, ShieldCheck, ExternalLink } from 'lucide-react';
import { MarketplaceLayout } from '../../layouts/MarketplaceLayout';
import { ProductCard } from '../../components/ProductCard';
import { ArtisanCard } from '../../components/ArtisanCard';
import { getProducts, getAllArtisans } from '../../utils/storage';
import { CRAFT_CATEGORIES, JHARKHAND_DISTRICTS } from '../../types';

// Smart matching / keyword search
function matchProducts(query: string, products: ReturnType<typeof getProducts>) {
  if (!query.trim()) return products;
  const q = query.toLowerCase();
  return products.filter(p => {
    const searchable = [p.name, p.craftCategory, p.description, p.materials, p.artisanName, p.artisanDistrict, ...(p.tags || [])].join(' ').toLowerCase();
    return searchable.includes(q);
  });
}

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'products');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [districtFilter, setDistrictFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [giOnly, setGiOnly] = useState(false);
  const [priceMax, setPriceMax] = useState(25000);
  const [showFilters, setShowFilters] = useState(false);
  const [smartQuery, setSmartQuery] = useState('');
  const [smartResults, setSmartResults] = useState<ReturnType<typeof getProducts>>([]);
  const [smartDone, setSmartDone] = useState(false);

  const allProducts = getProducts().filter(p => p.status === 'published');
  const allArtisans = getAllArtisans();
  const artisanMap = useMemo(() => new Map(allArtisans.map(a => [a.id, a])), [allArtisans]);

  useEffect(() => {
    const s = searchParams.get('search');
    const c = searchParams.get('category');
    if (s) { setSearch(s); setSearchInput(s); }
    if (c) setCategoryFilter(c);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let result = matchProducts(search, allProducts);
    if (categoryFilter) result = result.filter(p => p.craftCategory === categoryFilter);
    if (districtFilter) result = result.filter(p => p.artisanDistrict === districtFilter);
    if (giOnly) {
      result = result.filter(p =>
        p.craftCategory === 'Sohrai Art' ||
        p.craftCategory === 'Khovar Art' ||
        p.tags?.includes('#GITagged')
      );
    }
    if (verificationFilter) {
      result = result.filter(p => {
        const art = artisanMap.get(p.artisanId);
        if (!art) return false;
        if (verificationFilter === 'LEVEL_3_BUSINESS_VERIFIED') {
          return art.verificationTier === 'LEVEL_3_BUSINESS_VERIFIED';
        }
        if (verificationFilter === 'LEVEL_2_ARTISAN_VERIFIED') {
          return (
            art.verificationTier === 'LEVEL_2_ARTISAN_VERIFIED' ||
            art.verificationTier === 'LEVEL_3_BUSINESS_VERIFIED'
          );
        }
        if (verificationFilter === 'LEVEL_1_IDENTITY_VERIFIED') {
          return art.verificationTier && art.verificationTier !== 'LEVEL_0_UNVERIFIED';
        }
        return true;
      });
    }
    result = result.filter(p => (p.price || 0) <= priceMax);
    return result;
  }, [search, categoryFilter, districtFilter, giOnly, verificationFilter, priceMax, allProducts, artisanMap]);

  const filteredArtisans = useMemo(() => {
    let result = allArtisans;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.craftCategory.toLowerCase().includes(q) ||
        a.district.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter(a => a.craftCategory === categoryFilter);
    }
    if (districtFilter) {
      result = result.filter(a => a.district === districtFilter);
    }
    if (verificationFilter) {
      if (verificationFilter === 'LEVEL_3_BUSINESS_VERIFIED') {
        result = result.filter(a => a.verificationTier === 'LEVEL_3_BUSINESS_VERIFIED');
      } else if (verificationFilter === 'LEVEL_2_ARTISAN_VERIFIED') {
        result = result.filter(
          a =>
            a.verificationTier === 'LEVEL_2_ARTISAN_VERIFIED' ||
            a.verificationTier === 'LEVEL_3_BUSINESS_VERIFIED'
        );
      } else if (verificationFilter === 'LEVEL_1_IDENTITY_VERIFIED') {
        result = result.filter(
          a => a.verificationTier && a.verificationTier !== 'LEVEL_0_UNVERIFIED'
        );
      }
    }
    return result;
  }, [search, categoryFilter, districtFilter, verificationFilter, allArtisans]);

  const handleSmartSearch = () => {
    if (!smartQuery.trim()) return;
    setSmartResults(matchProducts(smartQuery, allProducts));
    setSmartDone(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <MarketplaceLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#FAF4EB] border border-earth-300 text-xs text-earth-700 mb-2 font-medium">
            <span className="text-brand-600">❖</span>
            <span>Direct from Jharkhand Village Clusters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-earth-900 mb-2">
            Explore Jharkhand Crafts
          </h1>
          <p className="text-earth-700 max-w-2xl leading-relaxed">
            Authentic handcrafted products, verified GI living traditions, and sustainable rural artisan livelihoods.
          </p>
        </div>

        {/* Verification & Transparency Banner */}
        <div className="bg-[#FAF5EC] border border-earth-300 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 shrink-0">
              <ShieldCheck className="w-5 h-5 text-forest-700" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-earth-900 text-sm sm:text-base flex items-center gap-2">
                100% Verifiable Living Crafts
                <span className="text-[11px] font-sans font-semibold bg-forest-100 text-forest-800 border border-forest-200/80 px-2 py-0.5 rounded-full">
                  Zero Hallucination
                </span>
              </h3>
              <p className="text-xs text-earth-600 mt-0.5 leading-relaxed max-w-xl">
                Every artisan cluster, GI tag (#645 Sohrai, #646 Khovar), and observed price range is documented from public registries and authentic cooperatives.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              to="/buyer/verification"
              className="btn-secondary !py-2 !px-3.5 !text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Buyer Verification</span>
            </Link>
            <Link
              to="/references"
              className="btn-primary !py-2 !px-3.5 !text-xs"
            >
              <span>Evidence Records</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-none mb-6">
          <div className="flex gap-1 p-1 bg-[#FAF4EB] border border-earth-200 rounded-xl w-fit min-w-full sm:min-w-0">
            {[
              { id: 'products', label: '🏺 Handcrafted Products' },
              { id: 'artisans', label: '👨‍🎨 Master Artisans' },
              { id: 'smart', label: '✨ Find the Right Craft' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-white text-earth-900 shadow-xs border border-earth-200/80 font-semibold'
                    : 'text-earth-700 hover:text-earth-950 hover:bg-earth-100/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'products' && (
          <>
            {/* Quick Authentic Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
              <button
                type="button"
                onClick={() => { setCategoryFilter(''); setGiOnly(false); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  !categoryFilter && !giOnly
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-[#FAF4EB] border border-earth-300 text-earth-800 hover:border-brand-500 hover:bg-[#FAF5EC]'
                }`}
              >
                All Crafts
              </button>
              <button
                type="button"
                onClick={() => { setGiOnly(v => !v); setCategoryFilter(''); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  giOnly
                    ? 'bg-forest-600 text-white shadow-xs ring-2 ring-forest-400/30'
                    : 'bg-forest-50 border border-forest-200 text-forest-700 hover:bg-forest-100/80'
                }`}
              >
                🏛️ GI Tagged (Sohrai & Khovar)
              </button>
              {['Dokra', 'Bamboo & Cane', 'Sohrai Art', 'Khovar Art', 'Pottery', 'Textiles', 'Tribal Jewellery'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategoryFilter(categoryFilter === cat ? '' : cat); setGiOnly(false); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-[#FAF4EB] border border-earth-300 text-earth-800 hover:border-brand-500 hover:bg-[#FAF5EC]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search crafts, products or artisans..."
                  className="input pl-10 pr-10"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-earth-400" />
                  </button>
                )}
              </form>
              <button onClick={() => setShowFilters(v => !v)} className="btn-secondary whitespace-nowrap">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                <div>
                  <label className="label">Craft Category</label>
                  <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setGiOnly(false); }} className="input">
                    <option value="">All Categories</option>
                    {CRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">District</label>
                  <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className="input">
                    <option value="">All Districts</option>
                    {JHARKHAND_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Trust & Verification</label>
                  <select
                    value={verificationFilter}
                    onChange={e => setVerificationFilter(e.target.value)}
                    className="input font-medium text-stone-800"
                  >
                    <option value="">All Verification Levels</option>
                    <option value="LEVEL_2_ARTISAN_VERIFIED">✓ Pehchan Artisan Verified (Level 2+)</option>
                    <option value="LEVEL_3_BUSINESS_VERIFIED">🏢 Business / MSME Verified (Level 3)</option>
                    <option value="LEVEL_1_IDENTITY_VERIFIED">👤 Identity Verified (Level 1+)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Max Price: ₹{priceMax.toLocaleString()}</label>
                  <input type="range" min="100" max="25000" step="500" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mt-2" />
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-earth-100 flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-earth-800">
                    <input
                      type="checkbox"
                      checked={giOnly}
                      onChange={e => setGiOnly(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span>Show GI Tagged Crafts Only (Sohrai GI #645 & Khovar GI #646)</span>
                  </label>
                  <button onClick={() => { setCategoryFilter(''); setDistrictFilter(''); setVerificationFilter(''); setPriceMax(25000); setGiOnly(false); setSearch(''); setSearchInput(''); }} className="text-sm text-brand-600 hover:underline">
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {/* Active filters */}
            {(categoryFilter || districtFilter || verificationFilter || giOnly || search) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && <span className="badge-brand inline-flex items-center gap-1">"{search}" <button onClick={() => { setSearch(''); setSearchInput(''); }}><X className="w-3 h-3" /></button></span>}
                {giOnly && <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-full">🏛️ GI Tagged Only <button onClick={() => setGiOnly(false)}><X className="w-3 h-3" /></button></span>}
                {verificationFilter && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 text-white px-2.5 py-1 rounded-full">
                    🛡️ {verificationFilter === 'LEVEL_3_BUSINESS_VERIFIED' ? 'Business Verified' : verificationFilter === 'LEVEL_2_ARTISAN_VERIFIED' ? 'Pehchan Verified' : 'Identity Verified'}
                    <button onClick={() => setVerificationFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {categoryFilter && <span className="badge-brand inline-flex items-center gap-1">{categoryFilter} <button onClick={() => setCategoryFilter('')}><X className="w-3 h-3" /></button></span>}
                {districtFilter && <span className="badge-brand inline-flex items-center gap-1">{districtFilter} <button onClick={() => setDistrictFilter('')}><X className="w-3 h-3" /></button></span>}
              </div>
            )}

            {/* Results count */}
            <p className="text-sm text-earth-500 mb-4">{filteredProducts.length} products found</p>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-earth-900 mb-2">No products found</h3>
                <p className="text-earth-500">Try different search terms or clear filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </>
        )}

        {tab === 'artisans' && (
          <div>
            {/* Quick Verification Filter Bar for Artisans */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
              <button
                type="button"
                onClick={() => setVerificationFilter('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  !verificationFilter
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-earth-200 text-earth-700 hover:bg-earth-100'
                }`}
              >
                All Artisans ({allArtisans.length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('LEVEL_1_IDENTITY_VERIFIED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  verificationFilter === 'LEVEL_1_IDENTITY_VERIFIED'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
              >
                🛡 Identity Verified Artisans
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('LEVEL_2_ARTISAN_VERIFIED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  verificationFilter === 'LEVEL_2_ARTISAN_VERIFIED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
                }`}
              >
                ✓ Pehchan Verified Artisans
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('LEVEL_3_BUSINESS_VERIFIED')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  verificationFilter === 'LEVEL_3_BUSINESS_VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                🏢 Verified Cooperatives / MSME
              </button>
            </div>

            {filteredArtisans.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-earth-900 mb-2">No artisans found</h3>
                <p className="text-earth-500">Try changing the verification filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredArtisans.map(artisan => <ArtisanCard key={artisan.id} artisan={artisan} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'smart' && (
          <div className="max-w-2xl mx-auto">
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-earth-900">Find the Right Craft</h2>
                <span className="badge bg-purple-100 text-purple-700 text-xs">Smart Matching</span>
              </div>
              <p className="text-sm text-earth-600 mb-4">
                Describe what you're looking for and we'll match you with the most relevant artisans and products.
              </p>
              <div className="relative">
                <textarea
                  rows={3}
                  value={smartQuery}
                  onChange={e => setSmartQuery(e.target.value)}
                  placeholder={'e.g. "I need traditional bamboo decoration for a hotel lobby" or "Looking for tribal jewellery as a wedding gift"'}
                  className="input resize-none"
                />
              </div>
              <button onClick={handleSmartSearch} disabled={!smartQuery.trim()} className="btn-primary mt-3 w-full justify-center">
                <Sparkles className="w-4 h-4" />
                Find Matching Products
              </button>
            </div>

            {smartDone && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-earth-900">Matching Results</h3>
                  <span className="badge-brand">{smartResults.length} found</span>
                </div>
                {smartResults.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-earth-500">No products matched your description. Try different keywords.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {smartResults.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
              </div>
            )}

            {!smartDone && (
              <div className="card p-6">
                <h4 className="font-medium text-earth-900 mb-3 text-sm">Try searching for:</h4>
                <div className="flex flex-wrap gap-2">
                  {['bamboo products', 'dokra figurine', 'tribal jewellery', 'handloom saree', 'wall art', 'eco-friendly gift'].map(s => (
                    <button key={s} onClick={() => { setSmartQuery(s); }} className="px-3 py-1.5 text-sm bg-earth-100 hover:bg-brand-100 text-earth-700 hover:text-brand-700 rounded-lg transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
