import React, { useState, useMemo } from 'react';
import { ExternalLink, Search, ShieldCheck, BookOpen, ShoppingBag, Award, Info, Filter } from 'lucide-react';
import { REAL_REFERENCES } from '../data/references';
import { CredibilityBadge } from '../components/CredibilityBadge';
import type { VerificationLevel } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const ReferencesPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredReferences = useMemo(() => {
    return REAL_REFERENCES.filter((ref) => {
      const matchesSearch =
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ref.notes && ref.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ref.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedType === 'ALL') return matchesSearch;
      if (selectedType === 'LEVEL_1') return matchesSearch && ref.verificationLevel === 'VERIFIED_OFFICIAL';
      if (selectedType === 'LEVEL_2') return matchesSearch && ref.verificationLevel === 'PUBLICLY_DOCUMENTED';
      if (selectedType === 'LEVEL_3') return matchesSearch && ref.verificationLevel === 'MARKET_REFERENCE';
      return matchesSearch;
    });
  }, [searchQuery, selectedType]);

  const levelCounts = useMemo(() => {
    return {
      all: REAL_REFERENCES.length,
      level1: REAL_REFERENCES.filter(r => r.verificationLevel === 'VERIFIED_OFFICIAL').length,
      level2: REAL_REFERENCES.filter(r => r.verificationLevel === 'PUBLICLY_DOCUMENTED').length,
      level3: REAL_REFERENCES.filter(r => r.verificationLevel === 'MARKET_REFERENCE').length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('references.badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-stone-900 tracking-tight">
            {t('references.title')}
          </h1>
          <p className="mt-3 text-stone-600 text-base sm:text-lg max-w-3xl leading-relaxed">
            {t('references.desc')}
          </p>
        </div>

        {/* Methodology Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-xs">
          <h2 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-terracotta-600" />
            {t('references.hierarchy_title')}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CredibilityBadge level="VERIFIED_OFFICIAL" size="sm" />
              </div>
              <p className="font-semibold text-xs text-stone-900">Level 1: Official & Government</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Geographical Indications Registry (Govt. of India), DC Handicrafts, DC Handlooms, and state undertakings (Jharcraft).
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CredibilityBadge level="PUBLICLY_DOCUMENTED" size="sm" />
              </div>
              <p className="font-semibold text-xs text-stone-900">Level 2 & 4: Archives & Cooperatives</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Tribal Women Artists Cooperative (TWAC Hazaribagh), Tribal Research Institute (TRI), and ethnographic documentation.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CredibilityBadge level="MARKET_REFERENCE" size="sm" />
              </div>
              <p className="font-semibold text-xs text-stone-900">Level 3: Observed Market Price</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Tribes India (TRIFED) public catalogs and verified artisan platform listings researched in September 2026.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex items-start gap-2 text-xs text-stone-500">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p>
              <strong>Price Disclaimer:</strong> Observed online price ranges reflect public market benchmarks
              at the time of research (September 2026). Individual artisan prices reflect direct craft costs,
              unique handwork, size, and material authenticity.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by source, craft, cluster, or registration ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-stone-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedType === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              All Sources ({levelCounts.all})
            </button>
            <button
              onClick={() => setSelectedType('LEVEL_1')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedType === 'LEVEL_1'
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Level 1: Official / GI ({levelCounts.level1})
            </button>
            <button
              onClick={() => setSelectedType('LEVEL_2')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedType === 'LEVEL_2'
                  ? 'bg-blue-800 text-white border-blue-800'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              Level 2: Archives ({levelCounts.level2})
            </button>
            <button
              onClick={() => setSelectedType('LEVEL_3')}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedType === 'LEVEL_3'
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Level 3: Market Price ({levelCounts.level3})
            </button>
          </div>
        </div>

        {/* References List */}
        <div className="space-y-4">
          {filteredReferences.map((ref) => (
            <div
              key={ref.id}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-5 sm:p-6 transition-shadow shadow-xs hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                      {ref.id}
                    </span>
                    <CredibilityBadge level={ref.verificationLevel} size="sm" />
                    <span className="text-xs text-stone-400 font-medium">
                      Accessed: {ref.accessedDate}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-stone-900 text-lg leading-snug">
                    {ref.title}
                  </h3>

                  <p className="text-xs font-medium text-stone-600">
                    Source Authority: <strong className="text-stone-800">{ref.sourceName}</strong>
                  </p>

                  {ref.notes && (
                    <p className="text-sm text-stone-600 leading-relaxed pt-1">
                      {ref.notes}
                    </p>
                  )}
                </div>

                <div className="sm:text-right shrink-0 pt-2 sm:pt-0">
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
                  >
                    <span>Visit Source Registry</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {filteredReferences.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <p className="text-stone-500 text-sm">
                No references found matching "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
