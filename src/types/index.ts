// ============================================================
// JOHAR CRAFT – Core TypeScript Types
// ============================================================

export type VerificationLevel =
  | 'VERIFIED_OFFICIAL'     // Level 1: Govt / Official GI Registry / TRIFED / Ministry
  | 'PUBLICLY_DOCUMENTED'   // Level 2 & 4: INTACH / Reputable NGO / Museum / Academic / News
  | 'MARKET_REFERENCE'      // Level 3: Public marketplace listings
  | 'USER_PROVIDED'         // Provided directly by user
  | 'UNKNOWN';              // Unconfirmed

export interface PriceReferenceItem {
  sourceName: string;
  sourceUrl: string;
  price: number;
  currency: 'INR';
  accessedDate: string;
  notes?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: 'INR';
  observedDate: string;
  disclaimer: string;
}

export interface ReferenceSource {
  id: string;                      // e.g. "REF-GI-645"
  title: string;                   // Document / Listing Title
  sourceName: string;              // e.g. "Geographical Indications Registry, Govt of India"
  sourceType: 'Government / Official' | 'Institution / NGO' | 'Marketplace' | 'Documented Publication';
  verificationLevel: VerificationLevel;
  url: string;                     // Verifiable public URL
  accessedDate: string;            // e.g. "September 2026"
  relatedArtisanId?: string;
  relatedProductId?: string;
  relatedCraftId?: string;
  notes?: string;
  image?: string;
}

export type CraftReference = ReferenceSource;

export interface Artisan {
  id: string;           // e.g. JH-ART-0001
  name: string;
  profilePhoto?: string;
  village: string;
  district: string;
  state: string;
  craftCategory: string;
  yearsExperience?: number | string;
  phone?: string;
  story: string;
  craftDescription?: string;
  isVerified: boolean;
  joinedAt: string;    // ISO date
  profileViews: number;
  productViews: number;
  enquiries: number;
  reference?: string;
  organization?: string;
  cluster?: string;
  sourceIds?: string[];
  verificationLevel?: VerificationLevel;
  sourceUrl?: string;
  verificationTier?: ArtisanVerificationTier;
  verificationRecords?: Partial<Record<VerificationType, VerificationRecord>>;
}

export type FieldSource = 'artisan' | 'ai_suggestion' | 'verified_reference' | 'ai_vision' | 'web_research';

export type AIConfidence = 'High' | 'Medium' | 'Low' | 'high' | 'medium' | 'low';

export type FactProvenance = 'OBSERVED' | 'INFERRED' | 'RESEARCHED' | 'ARTISAN_PROVIDED';

export type ResearchSourceQuality = 'OFFICIAL' | 'REPUTABLE' | 'MARKETPLACE' | 'OTHER';

export interface AIField<T = string> {
  value: T;
  confidence: AIConfidence;
  source: FieldSource;
}

export interface StructuredVisionResponse {
  productType: AIField<string>;
  category: AIField<string>;
  subtype: AIField<string>;
  materials: string[];
  colors: string[];
  patterns: string[];
  visualDescription: string;
  possibleCraft: AIField<string>;
  origin: {
    value: string;
    source: FieldSource;
  };
  uncertainFields: string[];
}

export interface AIVisionIdentification {
  identified: boolean;
  productName: string;
  productType: string;
  craftCategory: string;
  subtype?: string;
  visibleMaterial: string;
  visibleColors: string[];
  dominantColor: string;
  shape: string;
  designCharacteristics: string;
  possibleUses: string[];
  searchKeywords: string[];
  confidence: {
    overall: AIConfidence;
    productName: AIConfidence;
    craftCategory: AIConfidence;
    material: AIConfidence;
    subtype: AIConfidence;
  };
  provenance: {
    productName: FactProvenance;
    craftCategory: FactProvenance;
    material: FactProvenance;
    colors: FactProvenance;
    design: FactProvenance;
  };
  notes: string[];
  uncertainFields?: string[];
  structuredResponse?: StructuredVisionResponse;
}

export interface WebResearchSource {
  id: string;
  title: string;
  sourceName: string;
  quality: ResearchSourceQuality;
  url: string;
  accessedDate: string; // e.g. "17 September 2026"
  excerpt?: string;
  matchedCraftId?: string;
}

export interface ComparableProductMatch {
  id: string;
  title: string;
  craftCategory: string;
  subtype?: string;
  material: string;
  approxSize?: string;
  price: number;
  currency: 'INR';
  sourceName: string;
  sourceQuality: ResearchSourceQuality;
  sourceUrl: string;
  accessedDate: string;
  matchCriteria: string[];
}

export interface PriceResearchResult {
  craftType: string;
  subtype: string;
  observedMin: number;
  observedMax: number;
  referencePrice: number;
  comparableCount: number;
  currency: 'INR';
  researchedDate: string;
  disclaimer: string;
  comparables: ComparableProductMatch[];
  searchQueriesUsed: string[];
}

export interface SmartCatalogMetadata {
  isSmartCatalogGenerated?: boolean;
  generatedAt?: string;
  fieldSources?: Record<string, FieldSource>;
  imageAnalysis?: {
    detectedColors?: string[];
    dominantColorName?: string;
    suggestedCategory?: string;
    possibleMaterial?: string;
    quality?: string;
  };
  searchKeywords?: string[];
  aiIdentification?: AIVisionIdentification;
  priceResearch?: PriceResearchResult;
  researchSources?: WebResearchSource[];
  fieldProvenance?: Record<string, {
    value: any;
    source: FieldSource;
    confidence?: AIConfidence;
    notes?: string;
  }>;
}

export type ImageEnhancementPreset = 'auto' | 'product' | 'catalog' | 'custom';

export interface ImageEnhancementOptions {
  denoise?: boolean;
  deblur?: boolean;
  light?: boolean;
  color?: boolean;
  upscale?: 'none' | '2x' | '4x';
}

export interface ImageEnhancementMetadata {
  isEnhanced: boolean;
  originalUrl: string;
  enhancedUrl: string;
  preset?: ImageEnhancementPreset;
  operationsApplied?: string[];
  enhancedAt: string;
}

export interface Product {
  id: string;
  accountId?: string;
  artisanId: string;
  artisanName: string;
  artisanDistrict: string;
  name: string;
  image?: string;
  images?: string[];
  enhancedImages?: Record<number, ImageEnhancementMetadata>;
  hasEnhancedPhotos?: boolean;
  craftCategory: string;
  description: string;
  materials: string;
  dimensions?: string;
  productionTimeDays?: number | string;
  stockQuantity?: number;
  price?: number;
  status: 'published' | 'draft';
  views: number;
  createdAt: string;
  tags: string[];
  costs?: ProductCosts;
  productStory?: string;
  reference?: string;
  priceRange?: PriceRange;
  priceReferences?: PriceReferenceItem[];
  sourceIds?: string[];
  verificationLevel?: VerificationLevel;
  smartCatalog?: SmartCatalogMetadata;
  catalogSource?: FieldSource;
}

export interface Craft {
  id: string;
  name: string;
  category: string;
  origin: string;
  description: string;
  traditionalContext?: string;
  materials: string[];
  techniques?: string[];
  giTagStatus?: string;
  image?: string;
  sourceIds?: string[];
  verificationLevel?: VerificationLevel;
}

export interface ProductCosts {
  rawMaterial: number;
  labour: number;
  packaging: number;
  transportation: number;
  other: number;
}

export interface PricingCalculation {
  rawMaterial: number;
  labour: number;
  packaging: number;
  transportation: number;
  other: number;
  productionTime: number;
  desiredMarginPercent: number;
  totalCost: number;
  quantity?: number;
  costPerUnit?: number;
  suggestedPrice: number;
  recommendedMin: number;
  recommendedMax: number;
  estimatedProfit: number;
  totalSellingValue?: number;
  totalEstimatedProfit?: number;
}

// ============================================================
// Trust & Verification System Types
// ============================================================

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'requires_review'
  | 'expired';

export type VerificationType =
  | 'phone'
  | 'email'
  | 'identity'
  | 'pehchan'
  | 'udyam'
  | 'gstin'
  | 'business';

export type ArtisanVerificationTier =
  | 'LEVEL_0_UNVERIFIED'
  | 'LEVEL_1_IDENTITY_VERIFIED'
  | 'LEVEL_2_ARTISAN_VERIFIED'
  | 'LEVEL_3_BUSINESS_VERIFIED';

export type BuyerType = 'INDIVIDUAL' | 'BUSINESS';

export type GovernmentDocType =
  | 'aadhaar'
  | 'pan'
  | 'voter_id'
  | 'driving_license'
  | 'passport';

export interface VerificationRecord {
  type: VerificationType;
  status: VerificationStatus;
  documentType?: GovernmentDocType | string;
  verifiedAt?: string;
  provider?: string;
  maskedReference?: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface ArtisanVerificationProfile {
  artisanId: string;
  tier: ArtisanVerificationTier;
  records: Partial<Record<VerificationType, VerificationRecord>>;
  lastUpdated: string;
  isDemoMode?: boolean;
}

export interface BusinessBuyerDetails {
  businessName: string;
  businessType:
    | 'Proprietorship'
    | 'Partnership'
    | 'LLP'
    | 'Private Limited Company'
    | 'Public Limited Company'
    | 'Society/Trust'
    | 'Other';
  gstin?: string;
  pan?: string;
  udyamRegistration?: string;
  cin?: string;
  address?: string;
}

export interface BuyerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  buyerType: BuyerType;
  location?: string;
  businessDetails?: BusinessBuyerDetails;
  records: Partial<Record<VerificationType, VerificationRecord>>;
  wishlist: string[];
}

export interface Enquiry {
  id: string;
  productId: string;
  productName: string;
  artisanId: string;
  buyer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    buyerType: BuyerType;
    businessName?: string;
    verificationBadges: string[];
  };
  message: string;
  quantity: number;
  createdAt: string;
  status: 'pending' | 'responded' | 'closed';
}

export interface Buyer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  buyerType?: BuyerType;
  wishlist: string[];  // product IDs
}

export interface Analytics {
  artisanId: string;
  profileViews: number[];   // last 7 days
  productViews: number[];   // last 7 days
  enquiries: number[];      // last 7 days
  topProducts: { productId: string; productName: string; views: number }[];
  totalRevenue: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export const JHARKHAND_DISTRICTS = [
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka',
  'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla',
  'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar',
  'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi',
  'Sahibganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'
] as const;

export const CRAFT_CATEGORIES = [
  'Dokra',
  'Bamboo & Cane',
  'Sohrai Art',
  'Khovar Art',
  'Tribal Jewellery',
  'Wood Craft',
  'Textiles',
  'Pottery',
  'Stone Craft',
  'Leather Craft',
  'Other Handicrafts',
] as const;

// ============================================================
// Account Management Types
// ============================================================

export interface BaseAccount {
  id: string; // Unique ID: e.g. acc_1726578123456_x7k
  name: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
  languagePreference?: string;
}

export interface ArtisanAccount extends BaseAccount {
  type: 'artisan';
  artisanId: string; // Stable ID: e.g. JC-ART-0001
  village: string;
  district: string;
  state: string;
  craftCategory: string;
  yearsExperience?: number | string;
  phone?: string;
  story: string;
  craftDescription?: string;
  organization?: string;
  cluster?: string;
  isVerified: boolean;
  verificationTier?: ArtisanVerificationTier;
  verificationRecords?: Partial<Record<VerificationType, VerificationRecord>>;
}

export interface BuyerAccount extends BaseAccount {
  type: 'buyer';
  buyerId: string; // Stable ID: e.g. JC-BUY-0001
  buyerType: BuyerType; // 'INDIVIDUAL' | 'BUSINESS'
  phone?: string;
  email?: string;
  location?: string;
  businessDetails?: BusinessBuyerDetails;
  records?: Partial<Record<VerificationType, VerificationRecord>>;
  wishlist?: string[];
}

export type Account = ArtisanAccount | BuyerAccount;

