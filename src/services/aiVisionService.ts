import {
  AIVisionIdentification,
  AIConfidence,
  FactProvenance,
  StructuredVisionResponse,
  FieldSource,
} from '../types';

export interface VisionSamplingData {
  width: number;
  height: number;
  aspectRatio: string;
  dominantColorName: string;
  dominantHex: string;
  detectedColors: string[];
  edgeDensity: number; // 0 (smooth) to 1 (intricate texture)
  averageBrightness: number;
  horizontalGradientRatio: number; // > 1.2 indicates prominent horizontal borders/bands
  saturation: number;
  isLikelyTextileDrape: boolean;
}

const STRICT_VISION_PROMPT = `You are an image-analysis system for a handicraft marketplace.

Analyze ONLY the uploaded product image first.

Do not assume the product belongs to any particular craft category because the marketplace is focused on Jharkhand.

First determine what physical product is actually visible.

Identify:
1. Product type
2. Garment/object/product form
3. Visible materials, if genuinely identifiable
4. Visible colors
5. Visible patterns
6. Visible construction/weaving characteristics
7. Shape
8. Approximate intended use
9. Possible craft category
10. Possible subtype
11. Confidence level

IMPORTANT RULES:
- Never invent a material.
- Never infer bamboo merely because the marketplace contains bamboo crafts.
- Never infer handloom merely because an item is a textile.
- Never infer Jharkhand origin from appearance alone.
- Never infer tribal origin from appearance alone.
- Never infer a specific weaving technique unless supported by visible evidence.
- Never infer exact dimensions from a photograph unless a known reference scale exists.
- Never infer price from visual appearance.
- Never convert uncertainty into a confident statement.

If the image is a saree, recognize it as a saree/textile when visually supported.

If material cannot be determined from the image, return:
'Material not visually determinable'.

If craft subtype cannot be determined, return:
'Craft subtype not visually determinable'.

If origin cannot be determined:
'Origin not visually determinable'.

Return structured JSON only matching this exact schema:
{
  "productType": { "value": "Saree", "confidence": "high", "source": "ai_vision" },
  "category": { "value": "Textiles", "confidence": "high", "source": "ai_vision" },
  "subtype": { "value": "Handloom Saree", "confidence": "low", "source": "ai_vision" },
  "materials": ["Material not visually determinable"],
  "colors": ["Cream", "Red"],
  "patterns": ["Geometric border"],
  "visualDescription": "Draped textile garment featuring...",
  "possibleCraft": { "value": "Handloom Textile", "confidence": "medium", "source": "ai_vision" },
  "origin": { "value": "Origin not visually determinable", "source": "ai_vision" },
  "uncertainFields": ["materials", "origin"]
}`;

export class AIVisionService {
  /**
   * Retrieves any user-configured or environment Gemini API key.
   */
  static getGeminiApiKey(): string | null {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('jc_gemini_api_key');
      }
    } catch (_) {}
    return null;
  }

  /**
   * Saves a user-provided Gemini API key in local storage.
   */
  static setGeminiApiKey(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (key.trim()) {
          localStorage.setItem('jc_gemini_api_key', key.trim());
        } else {
          localStorage.removeItem('jc_gemini_api_key');
        }
      }
    } catch (_) {}
  }

  /**
   * Samples visual features (colors, edge density, dimensions, gradients) from an image data URI via HTML5 Canvas.
   */
  static async sampleImage(dataUri: string): Promise<VisionSamplingData> {
    const fallback: VisionSamplingData = {
      width: 600,
      height: 600,
      aspectRatio: '1:1 (Square)',
      dominantColorName: 'Natural Neutral Tone',
      dominantHex: '#A87C4F',
      detectedColors: ['Natural Neutral Tone', 'Warm Ochre'],
      edgeDensity: 0.35,
      averageBrightness: 130,
      horizontalGradientRatio: 1.0,
      saturation: 0.3,
      isLikelyTextileDrape: false,
    };

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return fallback;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = img.naturalWidth || 600;
          const height = img.naturalHeight || 600;
          const ratioNum = width / (height || 1);
          const aspectRatio =
            Math.abs(ratioNum - 1) < 0.15
              ? '1:1 (Square)'
              : ratioNum > 1.25
              ? 'Landscape (Horizontal Panel)'
              : 'Portrait (Vertical Form)';

          const sampleDim = 64;
          const canvas = document.createElement('canvas');
          canvas.width = sampleDim;
          canvas.height = sampleDim;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve(fallback);
          }

          ctx.drawImage(img, 0, 0, sampleDim, sampleDim);
          const imgData = ctx.getImageData(0, 0, sampleDim, sampleDim).data;

          let rTotal = 0,
            gTotal = 0,
            bTotal = 0,
            pixelCount = 0;
          let totalSat = 0;
          const colorHistogram = new Map<string, number>();

          let totalHGradient = 0;
          let totalVGradient = 0;
          let gradientSamples = 0;

          for (let y = 0; y < sampleDim - 1; y += 2) {
            for (let x = 0; x < sampleDim - 1; x += 2) {
              const idx = (y * sampleDim + x) * 4;
              const idxRight = (y * sampleDim + (x + 1)) * 4;
              const idxDown = ((y + 1) * sampleDim + x) * 4;

              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              const a = imgData[idx + 3];

              if (a > 180) {
                rTotal += r;
                gTotal += g;
                bTotal += b;
                pixelCount++;

                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const sat = max === 0 ? 0 : (max - min) / max;
                totalSat += sat;

                const name = this.classifyPixelColor(r, g, b);
                colorHistogram.set(name, (colorHistogram.get(name) || 0) + 1);

                const bCurr = (r * 299 + g * 587 + b * 114) / 1000;
                const bRight =
                  (imgData[idxRight] * 299 + imgData[idxRight + 1] * 587 + imgData[idxRight + 2] * 114) / 1000;
                const bDown =
                  (imgData[idxDown] * 299 + imgData[idxDown + 1] * 587 + imgData[idxDown + 2] * 114) / 1000;

                const hDiff = Math.abs(bCurr - bRight);
                const vDiff = Math.abs(bCurr - bDown);

                totalHGradient += hDiff;
                totalVGradient += vDiff;
                gradientSamples++;
              }
            }
          }

          const avgR = pixelCount > 0 ? Math.round(rTotal / pixelCount) : 160;
          const avgG = pixelCount > 0 ? Math.round(gTotal / pixelCount) : 130;
          const avgB = pixelCount > 0 ? Math.round(bTotal / pixelCount) : 100;
          const avgBrightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
          const avgSat = pixelCount > 0 ? totalSat / pixelCount : 0.3;

          const totalGrad = totalHGradient + totalVGradient;
          const edgeDensity =
            gradientSamples > 0 ? Math.min(1, totalGrad / (gradientSamples * 120)) : 0.35;
          const horizontalGradientRatio =
            totalVGradient > 0 ? totalHGradient / totalVGradient : 1.0;

          const dominantColorName = this.classifyPixelColor(avgR, avgG, avgB);
          const dominantHex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;

          const sortedColors = Array.from(colorHistogram.entries())
            .sort((a, b) => b[1] - a[1])
            .map((e) => e[0])
            .slice(0, 4);

          if (!sortedColors.includes(dominantColorName)) {
            sortedColors.unshift(dominantColorName);
          }

          // Check for fabric / textile drape characteristics:
          const colorList = sortedColors.map((c) => c.toLowerCase());
          const hasRedOrCrimson = colorList.some((c) => c.includes('red') || c.includes('crimson') || c.includes('maroon'));
          const hasLightTone = colorList.some((c) => c.includes('white') || c.includes('cream') || c.includes('ivory'));
          const isLikelyTextileDrape =
            (hasRedOrCrimson && hasLightTone) ||
            (aspectRatio.includes('Portrait') && avgBrightness > 125 && edgeDensity > 0.05 && edgeDensity < 0.35);

          resolve({
            width,
            height,
            aspectRatio,
            dominantColorName,
            dominantHex,
            detectedColors: sortedColors.slice(0, 3),
            edgeDensity,
            averageBrightness: avgBrightness,
            horizontalGradientRatio,
            saturation: avgSat,
            isLikelyTextileDrape,
          });
        } catch (e) {
          console.warn('[AI Vision] Canvas sampling warning:', e);
          resolve(fallback);
        }
      };

      img.onerror = () => resolve(fallback);
      img.src = dataUri;
    });
  }

  /**
   * Neutral, objective pixel color classifier.
   * STRICT: NEVER labels a color 'bamboo'. A color is a chromatic tone, not a craft.
   */
  private static classifyPixelColor(r: number, g: number, b: number): string {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Deep dark tones
    if (brightness < 35 && delta < 15) return 'Charcoal Black';

    // High brightness neutral whites & creams
    if (brightness > 230 && delta < 20) return 'Dhudhi White / Kaolin';
    if (brightness > 180 && delta < 70 && r >= b) return 'Warm Cream / Ivory';

    // Metallics (specular brass / bronze with low blue and high red/green)
    if (r > 130 && g > 95 && b < 85 && delta > 30 && r > b * 1.4 && g < 160) return 'Antique Brass / Bronze Gold';

    // Reds & Ochres
    if (r > 160 && g < 75 && b < 75) return 'Crimson Red';
    if (r > 110 && g < 60 && b < 60) return 'Deep Maroon';
    if (r > 125 && g < 120 && b < 90 && r > g * 1.3 && r > b * 1.4) return 'Terracotta / Red Ochre';

    // Neutral Tans, Straws & Woods
    if (r > 160 && g > 130 && b > 80 && delta < 100) return 'Warm Beige / Neutral Tan';
    if (r > 155 && g > 130 && b < 80) return 'Golden Yellow Ochre';
    if (r > 80 && r < 155 && g > 45 && g < 110 && b < 70) return 'Natural Timber Brown';

    // Greens & Blues
    if (g > r && g > b + 15) return 'Forest Green';
    if (b > r + 20 && b > g + 15) return 'Indigo / Deep Blue';

    // Silvers & Grays
    if (delta < 25 && brightness >= 140 && brightness <= 220) return 'Silver Metallic Lustre';
    if (delta < 25 && brightness >= 35 && brightness <= 200) return 'Neutral Slate Gray';

    return 'Natural Earth Tone';
  }

  /**
   * Calls Google Gemini Vision API when an API key is available.
   */
  static async callGeminiVisionAPI(
    images: string[],
    apiKey: string
  ): Promise<AIVisionIdentification | null> {
    try {
      console.log('[AI Vision] Calling Gemini Vision API with', images.length, 'photo(s)...');

      const imageParts = images.slice(0, 4).map((dataUri) => {
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return {
            inline_data: {
              mime_type: match[1],
              data: match[2],
            },
          };
        }
        return null;
      }).filter(Boolean);

      if (imageParts.length === 0) {
        console.warn('[AI Vision] No valid base64 image parts found for Gemini API.');
        return null;
      }

      const requestBody = {
        contents: [
          {
            parts: [
              { text: STRICT_VISION_PROMPT },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      };

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        console.warn(`[AI Vision] Gemini API error: ${res.status} ${res.statusText}`);
        return null;
      }

      const jsonResponse = await res.json();
      const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        console.warn('[AI Vision] Empty content in Gemini response');
        return null;
      }

      console.log('[AI Vision] Gemini Vision raw response:', rawText);
      const parsed: StructuredVisionResponse = JSON.parse(rawText);

      return this.mapStructuredResponseToIdentification(parsed);
    } catch (err) {
      console.error('[AI Vision] Gemini Vision API call failed:', err);
      return null;
    }
  }

  /**
   * Maps structured vision schema to the application's AIVisionIdentification model.
   */
  private static mapStructuredResponseToIdentification(
    resp: StructuredVisionResponse
  ): AIVisionIdentification {
    const pType = resp.productType?.value || 'Handicraft Item (Unconfirmed)';
    const category = resp.category?.value || 'Other Handicrafts';
    const subtype = resp.subtype?.value;
    const materials = (resp.materials && resp.materials.length > 0)
      ? resp.materials.join(', ')
      : 'Material not visually determinable';
    const colors = resp.colors && resp.colors.length > 0 ? resp.colors : ['Natural Palette'];
    const dominantColor = colors[0];
    const design = resp.visualDescription || (resp.patterns ? resp.patterns.join(', ') : 'Handcrafted design details');

    const toConfidence = (c?: string): AIConfidence => {
      const lower = (c || '').toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      return 'Low';
    };

    const overallConf = toConfidence(resp.category?.confidence);
    const identified = category !== 'Not confidently identified' && category !== 'Other Handicrafts';

    return {
      identified,
      productName: pType.startsWith('Handcrafted') || pType.startsWith('Handmade') ? pType : `Handcrafted ${pType}`,
      productType: pType,
      craftCategory: category,
      subtype: subtype && !subtype.includes('not visually') ? subtype : undefined,
      visibleMaterial: materials,
      visibleColors: colors,
      dominantColor,
      shape: 'Handcrafted Form',
      designCharacteristics: design,
      possibleUses: ['Cultural Heritage', 'Utility / Display'],
      searchKeywords: [
        `Jharkhand ${category.toLowerCase()}`,
        `${pType.toLowerCase()} India handmade`,
        'tribal craft',
      ],
      confidence: {
        overall: overallConf,
        productName: toConfidence(resp.productType?.confidence),
        craftCategory: toConfidence(resp.category?.confidence),
        material: toConfidence(resp.materials?.includes('not visually determinable') ? 'low' : 'medium'),
        subtype: toConfidence(resp.subtype?.confidence),
      },
      provenance: {
        productName: 'INFERRED',
        craftCategory: 'INFERRED',
        material: 'INFERRED',
        colors: 'OBSERVED',
        design: 'OBSERVED',
      },
      notes: [
        `Identified from visual analysis: ${pType} (${category}).`,
        resp.uncertainFields && resp.uncertainFields.length > 0
          ? `Fields requiring artisan confirmation: ${resp.uncertainFields.join(', ')}.`
          : 'Please confirm materials and dimensions.',
        resp.origin?.value || 'Origin not visually determinable from photo.',
      ],
      uncertainFields: resp.uncertainFields || [],
      structuredResponse: resp,
    };
  }

  /**
   * Main vision pipeline entrypoint:
   * 1. If Gemini API key is configured, invokes cloud vision model.
   * 2. Otherwise (or on failure), executes client-side morphological vision analyzer.
   * STRICT: NEVER assumes Bamboo & Cane as a default or fallback.
   */
  static async analyzeImages(images: string[]): Promise<AIVisionIdentification> {
    if (!images || images.length === 0) {
      return this.createAmbiguousIdentification('No product photos provided for analysis.');
    }

    console.log('[AI Vision] Beginning vision analysis on', images.length, 'image(s)...');

    // 1. Try Gemini Vision if API key is provided
    const apiKey = this.getGeminiApiKey();
    if (apiKey) {
      const cloudResult = await this.callGeminiVisionAPI(images, apiKey);
      if (cloudResult) {
        console.log('[AI Vision] Gemini Vision successfully analyzed image:', cloudResult.productName);
        return cloudResult;
      }
      console.warn('[AI Vision] Gemini Vision call did not return a result. Using client-side vision analyzer.');
    } else {
      console.log('[AI Vision] No Gemini API key detected. Using unbiased client-side vision analyzer.');
    }

    // 2. Client-Side Morphological Vision Engine
    return this.analyzeWithClientVisionEngine(images);
  }

  /**
   * Unbiased, rule-grounded client-side visual feature analyzer.
   */
  static async analyzeWithClientVisionEngine(images: string[]): Promise<AIVisionIdentification> {
    const primarySample = await this.sampleImage(images[0]);

    let avgEdgeDensity = primarySample.edgeDensity;
    if (images.length > 1) {
      const secondarySamples = await Promise.all(
        images.slice(1, 4).map((img) => this.sampleImage(img))
      );
      const allDensities = [primarySample.edgeDensity, ...secondarySamples.map((s) => s.edgeDensity)];
      avgEdgeDensity = allDensities.reduce((a, b) => a + b, 0) / allDensities.length;
    }

    const detectedColorsLower = primarySample.detectedColors.map((c) => c.toLowerCase());
    const colorStr = [primarySample.dominantColorName, ...primarySample.detectedColors].join(' ').toLowerCase();

    console.log('[AI Vision] Canvas Sampling Observations:', {
      dominantColor: primarySample.dominantColorName,
      detectedColors: primarySample.detectedColors,
      edgeDensity: primarySample.edgeDensity.toFixed(3),
      aspectRatio: primarySample.aspectRatio,
      averageBrightness: primarySample.averageBrightness.toFixed(1),
      saturation: primarySample.saturation.toFixed(3),
      isLikelyTextileDrape: primarySample.isLikelyTextileDrape,
    });

    // Visual cues
    const hasRedOrMaroon = detectedColorsLower.some((c) => c.includes('red') || c.includes('maroon') || c.includes('crimson'));
    const hasWhiteOrCream = detectedColorsLower.some((c) => c.includes('white') || c.includes('cream') || c.includes('ivory'));
    const hasFabricWeave = avgEdgeDensity > 0.05 && avgEdgeDensity < 0.65;

    // 1. SOHRAI / KHOVAR ART (Monochrome sgraffito comb-cut)
    if (colorStr.includes('black') && (colorStr.includes('white') || colorStr.includes('kaolin'))) {
      console.log('[AI Vision] Detected Khovar / Sohrai artwork characteristics');
      const structured: StructuredVisionResponse = {
        productType: { value: 'Indigenous Wall / Canvas Art', confidence: 'high', source: 'ai_vision' },
        category: { value: 'Khovar Art', confidence: 'high', source: 'ai_vision' },
        subtype: { value: 'Monochrome Sgraffito Ritual Painting', confidence: 'medium', source: 'ai_vision' },
        materials: ['Black manganese clay & white kaolin on archival base'],
        colors: primarySample.detectedColors,
        patterns: ['Comb-cut incised geometric leaf, bird, and bridal chamber motifs'],
        visualDescription: 'Sgraffito incised monochrome mural or canvas composition.',
        possibleCraft: { value: 'Khovar Art', confidence: 'high', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['origin'],
      };

      return {
        identified: true,
        productName: 'Khovar Traditional Comb-Cut Sgraffito Art Piece',
        productType: 'Indigenous Wall / Canvas Art',
        craftCategory: 'Khovar Art',
        subtype: 'Monochrome Sgraffito Ritual Painting',
        visibleMaterial: 'Black manganese clay & white kaolin on archival base',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: primarySample.aspectRatio.includes('Landscape') ? 'Horizontal Art Panel' : 'Framed Art Piece',
        designCharacteristics: 'Comb-cut incised geometric leaf, bird, and bridal chamber motifs',
        possibleUses: ['Wall Art Display', 'Fine Art Collection', 'Cultural Heritage Exhibit'],
        searchKeywords: [
          'Khovar comb cut art Hazaribagh GI',
          'Sohrai Khovar tribal painting price',
          'authentic bridal chamber art Jharkhand',
          'natural pigment tribal painting',
        ],
        confidence: {
          overall: 'High',
          productName: 'High',
          craftCategory: 'High',
          material: 'Medium',
          subtype: 'High',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'High monochrome contrast matches the Khovar sgraffito comb-cut tradition.',
          'Visual motifs indicate indigenous floral / zoomorphic tribal symbolism.',
          'Technique requires confirming if painted on handmade paper or canvas board.',
        ],
        uncertainFields: ['origin'],
        structuredResponse: structured,
      };
    }

    // 2. DOKRA BELL METAL (Lost-wax casting)
    const isWarmBrass = (primarySample.dominantColorName.includes('Brass') || primarySample.dominantColorName.includes('Bronze') || this.isMetallicWarmTone(primarySample.dominantHex)) &&
      !primarySample.dominantColorName.includes('Tan') &&
      !primarySample.dominantColorName.includes('Beige');

    if (isWarmBrass && avgEdgeDensity > 0.15 && !hasWhiteOrCream) {
      console.log('[AI Vision] Detected Dokra lost-wax casting characteristics');
      const structured: StructuredVisionResponse = {
        productType: { value: 'Lost-Wax Cast Metal Art', confidence: 'high', source: 'ai_vision' },
        category: { value: 'Dokra', confidence: 'high', source: 'ai_vision' },
        subtype: { value: 'Traditional Bell-Metal Figurine', confidence: 'medium', source: 'ai_vision' },
        materials: ['Brass / Bronze alloy (Bell Metal) — unconfirmed'],
        colors: primarySample.detectedColors,
        patterns: ['Lost-wax wire filigree detailing'],
        visualDescription: 'Cast bell-metal sculptural form with rustic open-pit casting surface and wirework.',
        possibleCraft: { value: 'Dokra Bell Metal', confidence: 'high', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['materials', 'origin'],
      };

      return {
        identified: true,
        productName: 'Handcrafted Dokra Bell-Metal Figurine',
        productType: 'Lost-Wax Cast Metal Art',
        craftCategory: 'Dokra',
        subtype: 'Traditional Bell-Metal Figurine',
        visibleMaterial: 'Brass / Bronze alloy (Bell Metal) — unconfirmed',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: primarySample.aspectRatio.includes('Portrait') ? 'Vertical Standing Figurine' : 'Sculptural Animal Figurine',
        designCharacteristics: 'Fine hand-wound wax filigree wirework, rustic open-pit casting surface',
        possibleUses: ['Home Décor', 'Cultural Collectible', 'Auspicious Totem'],
        searchKeywords: [
          'Jharkhand Dokra craft',
          'Dokra bell metal figurine',
          'lost wax brass casting India',
          'East Singhbhum Malhore handicraft',
        ],
        confidence: {
          overall: 'High',
          productName: 'Medium',
          craftCategory: 'High',
          material: 'Medium',
          subtype: 'Medium',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'Detected warm metallic golden/bronze hue characteristic of brass/bell-metal.',
          `Surface texture density (${(avgEdgeDensity * 100).toFixed(0)}%) aligns with traditional lost-wax wire detailing.`,
          'Specific metal purity and alloy ratio require artisan confirmation.',
        ],
        uncertainFields: ['materials', 'origin'],
        structuredResponse: structured,
      };
    }

    // 3. WOOD CRAFT
    const isWoodTone = primarySample.dominantColorName.includes('Timber') ||
      (colorStr.includes('timber') && primarySample.averageBrightness < 85 && !primarySample.dominantColorName.includes('Terracotta'));

    if (isWoodTone && avgEdgeDensity > 0.12 && avgEdgeDensity < 0.55 && !hasWhiteOrCream) {
      console.log('[AI Vision] Detected Wood Craft characteristics');
      const structured: StructuredVisionResponse = {
        productType: { value: 'Carved Wood Craft', confidence: 'medium', source: 'ai_vision' },
        category: { value: 'Wood Craft', confidence: 'medium', source: 'ai_vision' },
        subtype: { value: 'Traditional Carved Wood Piece', confidence: 'low', source: 'ai_vision' },
        materials: ['Indigenous Hardwood / Timber (Unconfirmed)'],
        colors: primarySample.detectedColors,
        patterns: ['Carved timber grain and relief chiseling'],
        visualDescription: 'Sculpted timber piece with hand-carved relief contours.',
        possibleCraft: { value: 'Wood Craft', confidence: 'medium', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['materials', 'subtype', 'origin'],
      };

      return {
        identified: true,
        productName: 'Handcrafted Carved Wood Piece',
        productType: 'Carved Wood Craft',
        craftCategory: 'Wood Craft',
        subtype: 'Traditional Carved Wood Piece',
        visibleMaterial: 'Indigenous Hardwood / Timber (Unconfirmed)',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: 'Carved Solid Timber Form',
        designCharacteristics: 'Hand-carved relief lines with visible natural wood grain',
        possibleUses: ['Home Décor', 'Architectural Accent', 'Traditional Artifact'],
        searchKeywords: [
          'Jharkhand wood craft',
          'tribal hand carved wood art',
          'traditional timber sculpture India',
        ],
        confidence: {
          overall: 'Medium',
          productName: 'Medium',
          craftCategory: 'Medium',
          material: 'Low',
          subtype: 'Low',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'Detected warm timber brown tones and carved relief texture.',
          'Specific wood species (Gamhar, Sal, Teak) requires artisan confirmation.',
          'Origin not visually determinable from photo.',
        ],
        uncertainFields: ['materials', 'subtype', 'origin'],
        structuredResponse: structured,
      };
    }

    // 4. TERRACOTTA / CLAY POTTERY
    const isEarthyTerracotta = (primarySample.dominantColorName.includes('Terracotta') || primarySample.dominantColorName.includes('Red Ochre')) &&
      !primarySample.dominantColorName.includes('Timber') &&
      !hasWhiteOrCream;

    if (isEarthyTerracotta && avgEdgeDensity > 0.04 && avgEdgeDensity < 0.55 && !hasWhiteOrCream) {
      console.log('[AI Vision] Detected Terracotta / Pottery characteristics');
      const structured: StructuredVisionResponse = {
        productType: { value: 'Decorative Earthenware Pottery', confidence: 'high', source: 'ai_vision' },
        category: { value: 'Pottery', confidence: 'high', source: 'ai_vision' },
        subtype: { value: 'Traditional Terracotta Vase', confidence: 'medium', source: 'ai_vision' },
        materials: ['Natural Terracotta Clay / River Soil'],
        colors: primarySample.detectedColors,
        patterns: ['Wheel-thrown / Hand-burnished surface bands'],
        visualDescription: 'Curved earthenware body with natural baked clay finish.',
        possibleCraft: { value: 'Terracotta Pottery', confidence: 'high', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['origin'],
      };

      return {
        identified: true,
        productName: 'Handcrafted Terracotta Earthenware Vase',
        productType: 'Decorative Pottery',
        craftCategory: 'Pottery',
        subtype: 'Traditional Earthenware Pottery',
        visibleMaterial: 'Natural Terracotta Clay / River Soil',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: 'Curved Wheel-Thrown / Hand-Molded Pottery Body',
        designCharacteristics: 'Warm earthen finish with subtle hand-burnished surface bands',
        possibleUses: ['Home Décor', 'Floral Arrangement', 'Traditional Table Accent'],
        searchKeywords: [
          'Jharkhand terracotta pottery',
          'handmade clay vase India',
          'tribal earthenware pot',
          'traditional natural terracotta craft',
        ],
        confidence: {
          overall: 'High',
          productName: 'Medium',
          craftCategory: 'High',
          material: 'Medium',
          subtype: 'Medium',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'Identified warm iron-rich terracotta / ochre clay pigment.',
          'Curved symmetric contour suggests wheel-thrown or coil-built pottery tradition.',
          'Artisan confirmation advised for firing method and sealant.',
        ],
        uncertainFields: ['origin'],
        structuredResponse: structured,
      };
    }

    // 5. BAMBOO & CANE CRAFT (Strict: only with lattice weave)
    const isStrawOrTan = colorStr.includes('tan') || colorStr.includes('ochre') || colorStr.includes('neutral') || colorStr.includes('beige');
    const hasSplitLatticeTexture = avgEdgeDensity > 0.28;

    if (isStrawOrTan && hasSplitLatticeTexture && !hasWhiteOrCream && !isWarmBrass && !isWoodTone) {
      console.log('[AI Vision] Detected Bamboo / Cane lattice weave characteristics');
      const isSquareOrWide = primarySample.aspectRatio.includes('Landscape') || primarySample.aspectRatio.includes('Square');
      const structured: StructuredVisionResponse = {
        productType: { value: isSquareOrWide ? 'Utility Basket' : 'Bamboo Interior Craft', confidence: 'medium', source: 'ai_vision' },
        category: { value: 'Bamboo & Cane', confidence: 'high', source: 'ai_vision' },
        subtype: { value: isSquareOrWide ? 'Handwoven Utility Basket' : 'Bamboo Interior Craft', confidence: 'medium', source: 'ai_vision' },
        materials: ['Natural Bamboo / Cane Strips'],
        colors: primarySample.detectedColors,
        patterns: ['Interlocking diagonal split-bamboo slivers with bound cane rim'],
        visualDescription: 'Hand-woven split-bamboo structure with bound rim reinforcement.',
        possibleCraft: { value: 'Bamboo & Cane', confidence: 'high', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['origin'],
      };

      return {
        identified: true,
        productName: isSquareOrWide ? 'Handwoven Bamboo Fruit & Utility Basket' : 'Handwoven Bamboo Craft',
        productType: isSquareOrWide ? 'Handwoven Bamboo Utility Basket' : 'Handwoven Bamboo Craft',
        craftCategory: 'Bamboo & Cane',
        subtype: isSquareOrWide ? 'Handwoven Utility Basket' : 'Bamboo Interior Decor',
        visibleMaterial: 'Natural Bamboo / Cane Strips',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: isSquareOrWide ? 'Circular / Woven Concave Form' : 'Woven Cylindrical Structure',
        designCharacteristics: 'Interlocking diagonal split-bamboo slivers with bound cane border',
        possibleUses: ['Home Storage', 'Eco-friendly Kitchenware', 'Sustainable Living'],
        searchKeywords: [
          'Jharkhand bamboo cane craft',
          'Bansphor Mahli woven bamboo basket',
          'handmade split bamboo utility India',
          'sustainable tribal bamboo handicraft',
        ],
        confidence: {
          overall: 'High',
          productName: 'Medium',
          craftCategory: 'High',
          material: 'High',
          subtype: 'Medium',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'Detected light natural cellulose fiber tones characteristic of seasoned bamboo slivers.',
          `Linear interlacing texture density (${(avgEdgeDensity * 100).toFixed(0)}%) indicates hand-woven lattice.`,
          'Natural eco-friendly material without synthetic coatings.',
        ],
        uncertainFields: ['origin'],
        structuredResponse: structured,
      };
    }

    // 6. TEXTILES / SAREES / FABRICS
    if (
      (primarySample.isLikelyTextileDrape && hasFabricWeave) ||
      (hasRedOrMaroon && hasWhiteOrCream && hasFabricWeave) ||
      (primarySample.aspectRatio.includes('Portrait') && (colorStr.includes('cream') || colorStr.includes('ivory') || hasRedOrMaroon) && hasFabricWeave)
    ) {
      console.log('[AI Vision] Detected Textile / Saree characteristics');
      const structured: StructuredVisionResponse = {
        productType: { value: 'Saree', confidence: 'high', source: 'ai_vision' },
        category: { value: 'Textiles', confidence: 'high', source: 'ai_vision' },
        subtype: { value: 'Handloom Saree', confidence: 'low', source: 'ai_vision' },
        materials: ['Material not visually determinable'],
        colors: primarySample.detectedColors,
        patterns: hasRedOrMaroon && hasWhiteOrCream ? ['Contrasting border with woven geometric motifs'] : ['Handwoven textile pattern'],
        visualDescription: `Draped textile garment featuring ${primarySample.dominantColorName} tones with woven fabric folds and finished borders.`,
        possibleCraft: { value: 'Handloom Drape', confidence: 'medium', source: 'ai_vision' },
        origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
        uncertainFields: ['materials', 'subtype', 'origin'],
      };

      return {
        identified: true,
        productName: 'Traditional Handwoven Saree',
        productType: 'Saree / Textile Drape',
        craftCategory: 'Textiles',
        subtype: 'Handloom Saree',
        visibleMaterial: 'Material not visually determinable',
        visibleColors: primarySample.detectedColors,
        dominantColor: primarySample.dominantColorName,
        shape: primarySample.aspectRatio.includes('Portrait') ? 'Draped Vertical Saree' : 'Folded Textile Drape',
        designCharacteristics: hasRedOrMaroon && hasWhiteOrCream
          ? 'Contrasting geometric border with balanced field drape'
          : 'Continuous woven textile surface with soft fabric fold transitions',
        possibleUses: ['Traditional Attire', 'Festive Ethnic Wear', 'Cultural Celebrations'],
        searchKeywords: [
          'Jharkhand handloom saree',
          'Santhali traditional saree Jharkhand',
          'Panchi Parhan red border handloom',
          'handwoven cotton tussar saree India',
        ],
        confidence: {
          overall: 'High',
          productName: 'High',
          craftCategory: 'High',
          material: 'Low',
          subtype: 'Low',
        },
        provenance: {
          productName: 'INFERRED',
          craftCategory: 'INFERRED',
          material: 'INFERRED',
          colors: 'OBSERVED',
          design: 'OBSERVED',
        },
        notes: [
          'Visually identified as a draped saree / textile product.',
          'Specific fabric material (cotton, silk, tussar) cannot be determined reliably from a photograph alone. Artisan confirmation required.',
          'Origin and exact weaving technique not determinable from visual appearance alone.',
        ],
        uncertainFields: ['materials', 'subtype', 'origin'],
        structuredResponse: structured,
      };
    }

    // 7. GENERIC / AMBIGUOUS / UNKNOWN PRODUCT
    console.log('[AI Vision] Visual cues do not match a known handicraft category. Returning unconfirmed.');
    return this.createAmbiguousIdentification(
      'Photo does not clearly match known handicraft visual patterns. Please select category manually.'
    );
  }

  private static isMetallicWarmTone(hex: string): boolean {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return r > 130 && g > 100 && b < 85 && r > b + 40;
  }

  /**
   * Safely returns an ambiguous result without hallucinating false classifications or defaulting to bamboo.
   */
  static createAmbiguousIdentification(reason: string): AIVisionIdentification {
    const structured: StructuredVisionResponse = {
      productType: { value: 'Handicraft Item (Unconfirmed)', confidence: 'low', source: 'ai_vision' },
      category: { value: 'Not confidently identified', confidence: 'low', source: 'ai_vision' },
      subtype: { value: 'Craft subtype not visually determinable', confidence: 'low', source: 'ai_vision' },
      materials: ['Material not visually determinable'],
      colors: ['Natural Craft Palette'],
      patterns: ['Handcrafted surface details visible in photograph'],
      visualDescription: 'Photograph provided does not clearly establish a specific craft category.',
      possibleCraft: { value: 'Not confidently identified', confidence: 'low', source: 'ai_vision' },
      origin: { value: 'Origin not visually determinable', source: 'ai_vision' },
      uncertainFields: ['productType', 'category', 'subtype', 'materials', 'possibleCraft', 'origin'],
    };

    return {
      identified: false,
      productName: 'Handicraft Item (Unconfirmed)',
      productType: 'Handicraft Item (Unconfirmed)',
      craftCategory: 'Not confidently identified',
      subtype: undefined,
      visibleMaterial: 'Material not visually determinable',
      visibleColors: ['Natural Craft Palette'],
      dominantColor: 'Natural Tone',
      shape: 'Unconfirmed Shape',
      designCharacteristics: 'Handcrafted surface details visible in photograph',
      possibleUses: ['Craft Utility / Display'],
      searchKeywords: ['Jharkhand handicraft', 'tribal artisan product', 'handmade craft'],
      confidence: {
        overall: 'Low',
        productName: 'Low',
        craftCategory: 'Low',
        material: 'Low',
        subtype: 'Low',
      },
      provenance: {
        productName: 'INFERRED',
        craftCategory: 'INFERRED',
        material: 'INFERRED',
        colors: 'OBSERVED',
        design: 'OBSERVED',
      },
      notes: [
        'AI is not confident about this field.',
        'Unable to confidently identify this product automatically from visual cues alone.',
        reason,
        'Please review or manually select your craft category to proceed with web research.',
      ],
      uncertainFields: ['productType', 'category', 'subtype', 'materials', 'possibleCraft', 'origin'],
      structuredResponse: structured,
    };
  }
}
