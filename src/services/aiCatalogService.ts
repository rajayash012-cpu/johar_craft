import {
  AIVisionIdentification,
  PriceResearchResult,
  WebResearchSource,
  Artisan,
  FieldSource,
  AIConfidence,
} from '../types';
import { AIVisionService } from './aiVisionService';
import { ProductResearchService, CraftCulturalContext } from './productResearchService';
import { PriceResearchService } from './priceResearchService';
import { SourceValidationService } from './sourceValidationService';

export interface CompleteAICatalogResult {
  identification: AIVisionIdentification;
  priceResearch: PriceResearchResult;
  sources: WebResearchSource[];
  culturalContext: CraftCulturalContext | null;
  catalog: {
    title: string;
    shortDescription: string;
    detailedDescription: string;
    craftCategory: string;
    subtype: string;
    materials: string;
    materialConfirmationRequired: boolean;
    color: string;
    design: string;
    possibleUses: string[];
    dimensions: string;
    weight: string;
    originLocation: string;
    artisanName: string;
    quantity: number;
    productionTimeDays: number;
    price: number;
    referencePrice: number;
    observedRange: { min: number; max: number };
    tags: string[];
    searchKeywords: string[];
    careInstructions?: string;
    fieldProvenance: Record<
      string,
      {
        value: any;
        source: FieldSource;
        confidence?: AIConfidence;
        notes?: string;
      }
    >;
  };
}

export class AICatalogService {
  /**
   * Complete end-to-end AI Smart Catalog generation:
   * Photo(s) -> AI Vision -> Craft Identification -> Web Research -> Price Benchmarking -> Synthesized Catalog.
   */
  static async processHandicraftPhotos(
    images: string[],
    artisan: Artisan | null,
    manualOverrides?: {
      craftCategory?: string;
      productName?: string;
      materials?: string;
      dimensions?: string;
      weight?: string;
    }
  ): Promise<CompleteAICatalogResult> {
    // 1. AI Vision Analysis
    let identification = await AIVisionService.analyzeImages(images);

    // Apply manual category/name overrides if provided by artisan
    if (manualOverrides?.craftCategory && manualOverrides.craftCategory !== 'Other Handicrafts') {
      identification = {
        ...identification,
        identified: true,
        craftCategory: manualOverrides.craftCategory,
        productName:
          manualOverrides.productName ||
          `Handcrafted ${manualOverrides.craftCategory} Piece`,
        provenance: {
          ...identification.provenance,
          craftCategory: 'ARTISAN_PROVIDED',
        },
      };
    }

    const craftCategory = manualOverrides?.craftCategory || identification.craftCategory;
    const productName = manualOverrides?.productName || identification.productName;

    // 2. Web Research for verified sources and cultural context
    const rawSources = await ProductResearchService.researchCraftSources(
      craftCategory,
      productName
    );
    const sortedSources = SourceValidationService.sortSources(rawSources);
    const culturalContext = ProductResearchService.getCulturalContext(craftCategory);

    // 3. Web Price Research for comparable listings and observed range
    const priceResearch = await PriceResearchService.researchMarketPrices(
      craftCategory,
      productName,
      identification.subtype
    );

    // 4. Assemble Structured Catalog Copy strictly grounded in confirmed facts
    const materials =
      manualOverrides?.materials ||
      (identification.identified
        ? identification.visibleMaterial
        : 'Information not provided — please specify');

    const materialSource: FieldSource = manualOverrides?.materials
      ? 'artisan'
      : identification.identified
      ? 'ai_vision'
      : 'artisan';

    const originDistrict = artisan?.district || culturalContext?.originDistrict?.split(',')[0] || 'Jharkhand';
    const originLocation = `${originDistrict}, Jharkhand, India`;

    const cleanTitle = productName.startsWith('Handcrafted') || productName.startsWith('Handmade')
      ? productName
      : `Handcrafted ${productName}`;

    const shortDescription = this.generateShortDescription({
      productName: cleanTitle,
      craftCategory,
      materials,
      district: originDistrict,
      isArtisanMaterial: !!manualOverrides?.materials,
    });

    const detailedDescription = this.generateFactualDescription({
      productName: cleanTitle,
      craftCategory,
      subtype: identification.subtype || 'Traditional Handicraft',
      materials,
      design: identification.designCharacteristics,
      district: originDistrict,
      culturalContext,
      isArtisanMaterial: !!manualOverrides?.materials,
      dimensions: manualOverrides?.dimensions,
      weight: manualOverrides?.weight,
    });

    const tags = this.generateTags({
      productName: cleanTitle,
      craftCategory,
      materials,
      district: originDistrict,
      giTagStatus: culturalContext?.giTagStatus,
    });

    // 5. Track detailed provenance for each field
    const fieldProvenance: Record<
      string,
      {
        value: any;
        source: FieldSource;
        confidence?: AIConfidence;
        notes?: string;
      }
    > = {
      title: {
        value: cleanTitle,
        source: manualOverrides?.productName ? 'artisan' : 'ai_vision',
        confidence: identification.confidence.productName,
      },
      craftCategory: {
        value: craftCategory,
        source: manualOverrides?.craftCategory ? 'artisan' : 'ai_vision',
        confidence: identification.confidence.craftCategory,
      },
      materials: {
        value: materials,
        source: materialSource,
        confidence: identification.confidence.material,
        notes: manualOverrides?.materials
          ? 'Confirmed by artisan'
          : 'Inferred from photo surface cues; please confirm',
      },
      color: {
        value: identification.dominantColor,
        source: 'ai_vision',
        confidence: 'High',
      },
      originLocation: {
        value: originLocation,
        source: artisan?.district ? 'artisan' : 'web_research',
        confidence: 'High',
      },
      priceReference: {
        value: `₹${priceResearch.observedMin} – ₹${priceResearch.observedMax}`,
        source: 'web_research',
        confidence: 'High',
        notes: `Based on ${priceResearch.comparableCount} comparable online listings checked on ${priceResearch.researchedDate}`,
      },
      dimensions: {
        value: manualOverrides?.dimensions || 'Not available — please specify if known',
        source: manualOverrides?.dimensions ? 'artisan' : 'artisan',
        confidence: manualOverrides?.dimensions ? 'High' : 'Low',
        notes: 'Cannot be determined reliably from 2D photos without a physical scale.',
      },
      weight: {
        value: manualOverrides?.weight || 'Not available — please specify if known',
        source: manualOverrides?.weight ? 'artisan' : 'artisan',
        confidence: manualOverrides?.weight ? 'High' : 'Low',
        notes: 'Weight requires physical weighing.',
      },
    };

    return {
      identification,
      priceResearch,
      sources: sortedSources,
      culturalContext,
      catalog: {
        title: cleanTitle,
        shortDescription,
        detailedDescription,
        craftCategory,
        subtype: identification.subtype || 'Traditional Handicraft',
        materials,
        materialConfirmationRequired: !manualOverrides?.materials,
        color: identification.dominantColor,
        design: identification.designCharacteristics,
        possibleUses: identification.possibleUses,
        dimensions: manualOverrides?.dimensions || 'Not available',
        weight: manualOverrides?.weight || 'Not available',
        originLocation,
        artisanName: artisan?.name || 'Jharkhand Artisan',
        quantity: 1,
        productionTimeDays: 3,
        price: priceResearch.referencePrice, // default to reference price as an editable starting point
        referencePrice: priceResearch.referencePrice,
        observedRange: {
          min: priceResearch.observedMin,
          max: priceResearch.observedMax,
        },
        tags,
        searchKeywords: identification.searchKeywords,
        fieldProvenance,
      },
    };
  }

  private static generateShortDescription(params: {
    productName: string;
    craftCategory: string;
    materials: string;
    district: string;
    isArtisanMaterial: boolean;
  }): string {
    const matText = params.isArtisanMaterial
      ? `crafted from ${params.materials}`
      : `featuring traditional ${params.materials}`;
    return `${params.productName} in the ${params.craftCategory} tradition, ${matText} by an indigenous artisan in ${params.district}, Jharkhand.`;
  }

  private static generateFactualDescription(params: {
    productName: string;
    craftCategory: string;
    subtype: string;
    materials: string;
    design: string;
    district: string;
    culturalContext: CraftCulturalContext | null;
    isArtisanMaterial: boolean;
    dimensions?: string;
    weight?: string;
  }): string {
    const sections: string[] = [];

    // 1. About the piece
    sections.push(
      `ABOUT THIS PIECE\n${params.productName} handcrafted by an artisan in ${params.district}, Jharkhand. Formed with traditional ${params.craftCategory} techniques, featuring distinct ${params.design.toLowerCase()}.`
    );

    // 2. Specifications & Craft Details
    const specs: string[] = [
      `Craft Category: ${params.craftCategory}`,
      `Subtype / Style: ${params.subtype}`,
      `Materials: ${params.materials}${params.isArtisanMaterial ? ' (Confirmed by Artisan)' : ' (Visual inference — subject to artisan confirmation)'}`,
      `Origin: ${params.district}, Jharkhand, India`,
    ];

    if (params.dimensions && params.dimensions !== 'Not available') {
      specs.push(`Dimensions: ${params.dimensions}`);
    } else {
      specs.push('Dimensions: Not specified (artisan can provide exact measurements)');
    }

    if (params.weight && params.weight !== 'Not available') {
      specs.push(`Weight: ${params.weight}`);
    } else {
      specs.push('Weight: Not specified');
    }

    sections.push(`CRAFT & SPECIFICATIONS\n${specs.join('\n')}`);

    // 3. Cultural & Heritage Context (Grounded in real research, NO HYPERBOLE)
    if (params.culturalContext) {
      const heritage: string[] = [
        params.culturalContext.traditionalContext,
      ];
      if (params.culturalContext.giTagStatus) {
        heritage.push(`Certification / Heritage: ${params.culturalContext.giTagStatus}`);
      }
      heritage.push(
        `Documented Reference: ${params.culturalContext.primarySource.sourceName} (${params.culturalContext.primarySource.accessedDate})`
      );
      sections.push(`TRADITIONAL HERITAGE CONTEXT\n${heritage.join('\n')}`);
    }

    return sections.join('\n\n');
  }

  private static generateTags(params: {
    productName: string;
    craftCategory: string;
    materials: string;
    district: string;
    giTagStatus?: string;
  }): string[] {
    const tags = new Set<string>();

    tags.add(params.craftCategory);
    tags.add('Handmade');
    tags.add('Jharkhand Craft');
    tags.add(params.district);

    if (params.giTagStatus) {
      tags.add('GITagged');
    }

    // Extract core words from product name
    const words = params.productName
      .replace(/Handcrafted|Handmade|Traditional|Authentic/gi, '')
      .trim()
      .split(/\s+/);

    words.forEach((w) => {
      if (w.length > 2 && w.length < 20) tags.add(w);
    });

    return Array.from(tags).slice(0, 7);
  }
}
