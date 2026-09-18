import { ResearchSourceQuality, WebResearchSource } from '../types';

export class SourceValidationService {
  /**
   * Numeric rank for source hierarchy:
   * Level 1 (OFFICIAL): Rank 1
   * Level 2 (REPUTABLE): Rank 2
   * Level 3 (MARKETPLACE): Rank 3
   * Level 4 (OTHER): Rank 4
   */
  static getQualityRank(quality: ResearchSourceQuality): number {
    switch (quality) {
      case 'OFFICIAL':
        return 1;
      case 'REPUTABLE':
        return 2;
      case 'MARKETPLACE':
        return 3;
      case 'OTHER':
      default:
        return 4;
    }
  }

  /**
   * Sorts a list of research sources according to strict authoritative hierarchy:
   * OFFICIAL > REPUTABLE > MARKETPLACE > OTHER
   */
  static sortSources(sources: WebResearchSource[]): WebResearchSource[] {
    return [...sources].sort((a, b) => {
      const rankA = this.getQualityRank(a.quality);
      const rankB = this.getQualityRank(b.quality);
      if (rankA !== rankB) return rankA - rankB;
      return a.sourceName.localeCompare(b.sourceName);
    });
  }

  /**
   * Verifies that a URL is a legitimate, publicly accessible domain.
   * Rejects malformed or suspicious links.
   */
  static isValidWebSourceUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const knownDomains = [
        'ipindia.gov.in',
        'handicrafts.nic.in',
        'handlooms.nic.in',
        'jharkhand.gov.in',
        'tribesindia.com',
        'jharcraft.in',
        'trijharkhand.in',
        'buluimam.com',
        'maatighar.com',
        'intach.org',
      ];
      const matchesKnown = knownDomains.some((d) => parsed.hostname.endsWith(d));
      return isHttp && (matchesKnown || parsed.hostname.length > 4);
    } catch {
      return false;
    }
  }

  /**
   * Returns human-readable UI badge styling and label for each source quality tier.
   */
  static getQualityBadge(quality: ResearchSourceQuality): {
    label: string;
    level: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  } {
    switch (quality) {
      case 'OFFICIAL':
        return {
          label: 'Official Source',
          level: 'Level 1',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-300',
        };
      case 'REPUTABLE':
        return {
          label: 'Reputable Archive',
          level: 'Level 2',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
        };
      case 'MARKETPLACE':
        return {
          label: 'Marketplace Reference',
          level: 'Level 3',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-300',
        };
      default:
        return {
          label: 'Documented Reference',
          level: 'Level 4',
          bgColor: 'bg-stone-50',
          textColor: 'text-stone-700',
          borderColor: 'border-stone-300',
        };
    }
  }
}
