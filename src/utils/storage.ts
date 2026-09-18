import type {
  Artisan,
  Product,
  ArtisanVerificationProfile,
  BuyerProfile,
  Enquiry,
} from '../types';
import { REAL_ARTISANS } from '../data/artisans';
import { REAL_PRODUCTS } from '../data/products';
import { calculateArtisanTier } from '../services/verificationService';
import {
  getActiveAccount,
  getAccounts,
  updateAccount,
  createArtisanAccount,
  createBuyerAccount,
  initializeAccountsIfNeeded,
  generateArtisanId as serviceGenerateArtisanId,
} from '../services/accountService';


// ============================================================
// LocalStorage keys
// ============================================================
const KEYS = {
  ARTISAN: 'jc_artisan',
  PRODUCTS: 'jc_products',
  WISHLIST: 'jc_wishlist',
  ANALYTICS: 'jc_analytics',
  SETTINGS: 'jc_settings',
  ARTISAN_VERIFICATION: 'jc_artisan_verification',
  BUYER_PROFILE: 'jc_buyer_profile',
  ENQUIRIES: 'jc_enquiries',
  SEEDED: 'jc_real_seeded_v6',
} as const;

// Default sample buyer profile for evaluation
const DEFAULT_BUYER: BuyerProfile = {
  id: 'buyer-default-01',
  name: 'Anita Verma',
  phone: '+91 98765 43210',
  email: 'anita.verma@example.com',
  buyerType: 'INDIVIDUAL',
  location: 'Ranchi, Jharkhand',
  records: {
    phone: {
      type: 'phone',
      status: 'verified',
      verifiedAt: '2026-03-10T10:00:00.000Z',
      provider: 'National Telecom SMS Gateway (Simulated)',
      maskedReference: '+91 XXXXX X3210',
      notes: 'Mobile number authenticated via SMS OTP.',
    },
  },
  wishlist: [],
};

// Initial realistic enquiries demonstrating buyer trust badges
const DEFAULT_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-sample-001',
    productId: 'JH-PROD-005',
    productName: 'Dokra Brass Nandi Bull Figurine',
    artisanId: 'JH-ART-0005',
    buyer: {
      id: 'buyer-default-01',
      name: 'Anita Verma',
      phone: '+91 98765 43210',
      email: 'anita.verma@example.com',
      buyerType: 'INDIVIDUAL',
      verificationBadges: ['Phone Verified'],
    },
    message: 'Namaste, is this authentic Dokra piece available for dispatch to Ranchi? I would like to purchase 2 pieces.',
    quantity: 2,
    createdAt: '2026-03-14T09:30:00.000Z',
    status: 'pending',
  },
  {
    id: 'enq-sample-002',
    productId: 'JH-PROD-001',
    productName: 'Authentic Handpainted Sohrai Natural Pigment Painting',
    artisanId: 'JH-ART-0001',
    buyer: {
      id: 'buyer-corp-02',
      name: 'Vikram Sethi (Procurement)',
      phone: '+91 94311 22880',
      email: 'procurement@fabcraft.in',
      buyerType: 'BUSINESS',
      businessName: 'FabCraft India Pvt Ltd',
      verificationBadges: ['Verified Business Buyer', 'GSTIN Active'],
    },
    message: 'We represent an ethical retail network. We are interested in ordering 10 framed pieces of Sohrai wall art for our upcoming festive exhibition.',
    quantity: 10,
    createdAt: '2026-03-15T14:15:00.000Z',
    status: 'responded',
  },
];

// ============================================================
// Seed real data on first run or purge legacy demo data
// ============================================================
export function seedDemoDataIfNeeded(): void {
  initializeAccountsIfNeeded();
  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Preserve any user-created products (prod-user-*)
  let userProducts: Product[] = [];
  try {
    const existingRaw = localStorage.getItem('jc_products');
    if (existingRaw) {
      const parsed: Product[] = JSON.parse(existingRaw);
      userProducts = parsed.filter(p => p.id.startsWith('prod-user-'));
    }
  } catch {
    userProducts = [];
  }

  // Seed with real authentic Jharkhand products + preserved user items
  const combined = [...REAL_PRODUCTS, ...userProducts];
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(combined));

  // Seed default buyer profile if not present
  if (!localStorage.getItem(KEYS.BUYER_PROFILE)) {
    localStorage.setItem(KEYS.BUYER_PROFILE, JSON.stringify(DEFAULT_BUYER));
  }

  // Seed default enquiries if not present
  if (!localStorage.getItem(KEYS.ENQUIRIES)) {
    localStorage.setItem(KEYS.ENQUIRIES, JSON.stringify(DEFAULT_ENQUIRIES));
  }

  localStorage.setItem(KEYS.SEEDED, 'true');
}

// ============================================================
// Artisan helpers
// ============================================================
export function getArtisan(): Artisan | null {
  seedDemoDataIfNeeded();
  const active = getActiveAccount();
  if (active) {
    if (active.type !== 'artisan') return null;
    const verif = getArtisanVerification(active.artisanId);
    return {
      id: active.artisanId,
      name: active.name,
      profilePhoto: active.photo,
      village: active.village,
      district: active.district,
      state: active.state,
      craftCategory: active.craftCategory,
      yearsExperience: active.yearsExperience,
      phone: active.phone,
      story: active.story,
      craftDescription: active.craftDescription,
      organization: active.organization,
      cluster: active.cluster,
      isVerified: verif.tier !== 'LEVEL_0_UNVERIFIED',
      verificationTier: verif.tier,
      verificationRecords: verif.records,
      joinedAt: active.createdAt,
      profileViews: 184,
      productViews: 412,
      enquiries: 19,
    };
  }

  // Fallback to legacy raw key if exists
  const raw = localStorage.getItem(KEYS.ARTISAN);
  if (!raw) return null;
  try {
    const artisan: Artisan = JSON.parse(raw);
    const verif = getArtisanVerification(artisan.id);
    artisan.verificationTier = verif.tier;
    artisan.verificationRecords = verif.records;
    artisan.isVerified = verif.tier !== 'LEVEL_0_UNVERIFIED';
    return artisan;
  } catch {
    return null;
  }
}

export function saveArtisan(artisan: Artisan): void {
  if (artisan.verificationRecords) {
    const tier = calculateArtisanTier(artisan.verificationRecords);
    saveArtisanVerification({
      artisanId: artisan.id,
      tier,
      records: artisan.verificationRecords,
      lastUpdated: new Date().toISOString(),
    });
    artisan.verificationTier = tier;
    artisan.isVerified = tier !== 'LEVEL_0_UNVERIFIED';
  }
  localStorage.setItem(KEYS.ARTISAN, JSON.stringify(artisan));

  // Also update active account if it matches or create it
  const active = getActiveAccount();
  if (active && active.type === 'artisan') {
    updateAccount(active.id, {
      name: artisan.name,
      photo: artisan.profilePhoto,
      village: artisan.village,
      district: artisan.district,
      craftCategory: artisan.craftCategory,
      yearsExperience: artisan.yearsExperience,
      phone: artisan.phone,
      story: artisan.story,
      craftDescription: artisan.craftDescription,
      organization: artisan.organization,
      isVerified: artisan.isVerified,
      verificationTier: artisan.verificationTier,
      verificationRecords: artisan.verificationRecords,
    });
  } else {
    // If no active artisan account exists, create one
    createArtisanAccount({
      name: artisan.name,
      district: artisan.district,
      village: artisan.village,
      craftCategory: artisan.craftCategory,
      phone: artisan.phone,
      story: artisan.story,
      photo: artisan.profilePhoto,
      organization: artisan.organization,
      yearsExperience: artisan.yearsExperience,
    });
  }
}

export function generateArtisanId(): string {
  return serviceGenerateArtisanId();
}


export function getArtisanById(id: string): Artisan | undefined {
  seedDemoDataIfNeeded();
  const myArtisan = getArtisan();
  if (myArtisan && myArtisan.id === id) return myArtisan;
  
  const found = REAL_ARTISANS.find(a => a.id === id);
  if (!found) return undefined;

  const storedVerif = getStoredVerificationMap()[id];
  if (storedVerif) {
    return {
      ...found,
      verificationTier: storedVerif.tier,
      verificationRecords: storedVerif.records,
      isVerified: storedVerif.tier !== 'LEVEL_0_UNVERIFIED',
    };
  }
  return found;
}

// Kept for backward compatibility
export const getDemoArtisanById = getArtisanById;

export function getAllArtisans(): Artisan[] {
  seedDemoDataIfNeeded();
  const myArtisan = getArtisan();
  const all = [...REAL_ARTISANS].map(artisan => {
    const storedVerif = getStoredVerificationMap()[artisan.id];
    if (storedVerif) {
      return {
        ...artisan,
        verificationTier: storedVerif.tier,
        verificationRecords: storedVerif.records,
        isVerified: storedVerif.tier !== 'LEVEL_0_UNVERIFIED',
      };
    }
    return artisan;
  });

  if (myArtisan && !all.find(a => a.id === myArtisan.id)) {
    all.push(myArtisan);
  }
  return all;
}

// ============================================================
// Verification storage helpers
// ============================================================
function getStoredVerificationMap(): Record<string, ArtisanVerificationProfile> {
  const raw = localStorage.getItem(KEYS.ARTISAN_VERIFICATION);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getArtisanVerification(artisanId: string): ArtisanVerificationProfile {
  seedDemoDataIfNeeded();
  const map = getStoredVerificationMap();
  if (map[artisanId]) {
    return map[artisanId];
  }

  // Look in REAL_ARTISANS
  const found = REAL_ARTISANS.find(a => a.id === artisanId);
  if (found && found.verificationTier) {
    return {
      artisanId,
      tier: found.verificationTier,
      records: found.verificationRecords || {},
      lastUpdated: found.joinedAt,
    };
  }

  // Default Level 0 Unverified for new/custom artisans
  return {
    artisanId,
    tier: 'LEVEL_0_UNVERIFIED',
    records: {},
    lastUpdated: new Date().toISOString(),
  };
}

export function saveArtisanVerification(profile: ArtisanVerificationProfile): void {
  const map = getStoredVerificationMap();
  map[profile.artisanId] = profile;
  localStorage.setItem(KEYS.ARTISAN_VERIFICATION, JSON.stringify(map));

  // If this profile belongs to the currently logged in artisan, sync jc_artisan
  const rawArtisan = localStorage.getItem(KEYS.ARTISAN);
  if (rawArtisan) {
    try {
      const myArtisan: Artisan = JSON.parse(rawArtisan);
      if (myArtisan.id === profile.artisanId) {
        myArtisan.verificationTier = profile.tier;
        myArtisan.verificationRecords = profile.records;
        myArtisan.isVerified = profile.tier !== 'LEVEL_0_UNVERIFIED';
        localStorage.setItem(KEYS.ARTISAN, JSON.stringify(myArtisan));
      }
    } catch {
      // ignore
    }
  }
}

// ============================================================
// Buyer profile helpers
// ============================================================
export function getBuyerProfile(): BuyerProfile {
  seedDemoDataIfNeeded();
  const active = getActiveAccount();
  if (active && active.type === 'buyer') {
    return {
      id: active.buyerId,
      name: active.name,
      phone: active.phone,
      email: active.email,
      buyerType: active.buyerType,
      location: active.location,
      businessDetails: active.businessDetails,
      records: active.records || {},
      wishlist: active.wishlist || [],
    };
  }

  const raw = localStorage.getItem(KEYS.BUYER_PROFILE);
  if (!raw) return DEFAULT_BUYER;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BUYER;
  }
}

export function saveBuyerProfile(profile: BuyerProfile): void {
  localStorage.setItem(KEYS.BUYER_PROFILE, JSON.stringify(profile));

  const active = getActiveAccount();
  if (active && active.type === 'buyer') {
    updateAccount(active.id, {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      buyerType: profile.buyerType,
      location: profile.location,
      businessDetails: profile.businessDetails,
      records: profile.records,
      wishlist: profile.wishlist,
    });
  }
}


// ============================================================
// Enquiry helpers
// ============================================================
export function getEnquiries(artisanId?: string): Enquiry[] {
  seedDemoDataIfNeeded();
  const raw = localStorage.getItem(KEYS.ENQUIRIES);
  let list: Enquiry[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {
      list = DEFAULT_ENQUIRIES;
    }
  } else {
    list = DEFAULT_ENQUIRIES;
  }

  if (artisanId) {
    return list.filter(e => e.artisanId === artisanId);
  }
  return list;
}

export function createEnquiry(
  data: Omit<Enquiry, 'id' | 'createdAt' | 'status'>
): Enquiry {
  seedDemoDataIfNeeded();
  const all = getEnquiries();
  const newEnquiry: Enquiry = {
    ...data,
    id: `enq-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  all.unshift(newEnquiry);
  localStorage.setItem(KEYS.ENQUIRIES, JSON.stringify(all));
  return newEnquiry;
}

export function updateEnquiryStatus(
  enquiryId: string,
  status: 'pending' | 'responded' | 'closed'
): void {
  const all = getEnquiries();
  const idx = all.findIndex(e => e.id === enquiryId);
  if (idx >= 0) {
    all[idx].status = status;
    localStorage.setItem(KEYS.ENQUIRIES, JSON.stringify(all));
  }
}

// ============================================================
// Product helpers
// ============================================================
export function getProducts(): Product[] {
  seedDemoDataIfNeeded();
  const raw = localStorage.getItem(KEYS.PRODUCTS);
  if (!raw) return REAL_PRODUCTS;
  try {
    const stored: Product[] = JSON.parse(raw);
    const userProducts = stored.filter(p => p.id.startsWith('prod-user-'));
    const storedMap = new Map(stored.map(p => [p.id, p]));

    // Map through fresh REAL_PRODUCTS, preserving user interactions if present
    const combinedReal = REAL_PRODUCTS.map(rp => {
      const existing = storedMap.get(rp.id);
      if (existing) {
        return {
          ...rp,
          views: existing.views || rp.views,
          status: existing.status || rp.status,
          stockQuantity: existing.stockQuantity !== undefined ? existing.stockQuantity : rp.stockQuantity,
        };
      }
      return rp;
    });

    return [...combinedReal, ...userProducts];
  } catch { return REAL_PRODUCTS; }
}

export function getProductsByArtisan(artisanId: string): Product[] {
  const all = getProducts();
  const active = getActiveAccount();
  return all.filter(p => {
    // Check if stamped with accountId of active artisan
    if (active && active.type === 'artisan' && p.accountId && p.accountId === active.id) {
      return true;
    }
    if (p.artisanId === artisanId) return true;
    // Map Putli Devi's dual ID representations
    if (
      (artisanId === 'JC-ART-0001' && p.artisanId === 'JH-ART-0001') ||
      (artisanId === 'JH-ART-0001' && p.artisanId === 'JC-ART-0001')
    ) {
      return true;
    }
    return false;
  });
}

export function getProductById(productId: string): Product | undefined {
  return getProducts().find(p => p.id === productId);
}

export function saveProduct(product: Product): void {
  const active = getActiveAccount();
  if (active && !product.accountId) {
    product.accountId = active.id;
  }
  if (active && active.type === 'artisan') {
    if (!product.artisanId) product.artisanId = active.artisanId;
    if (!product.artisanName) product.artisanName = active.name;
    if (!product.artisanDistrict) product.artisanDistrict = active.district;
  }

  const all = getProducts();
  const idx = all.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    all[idx] = product;
  } else {
    all.push(product);
  }
  // Only save user-created products + updates to stored list
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
}


export function deleteProduct(productId: string): void {
  const all = getProducts().filter(p => p.id !== productId);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(all));
}

export function generateProductId(): string {
  return `prod-user-${Date.now()}`;
}

// ============================================================
// Wishlist helpers
// ============================================================
export function getWishlist(): string[] {
  const raw = localStorage.getItem(KEYS.WISHLIST);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function toggleWishlist(productId: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(KEYS.WISHLIST, JSON.stringify(list));
    return false;
  } else {
    list.push(productId);
    localStorage.setItem(KEYS.WISHLIST, JSON.stringify(list));
    return true;
  }
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId);
}

// ============================================================
// Analytics helpers (simple counter tracking)
// ============================================================
export function incrementProfileView(artisanId: string): void {
  const key = `jc_pv_${artisanId}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(current + 1));
}

export function getProfileViews(artisanId: string): number {
  const key = `jc_pv_${artisanId}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

// ============================================================
// References re-export for centralized convenience
// ============================================================
export {
  REAL_REFERENCES,
  getReferenceById,
  getReferencesByIds,
  getReferencesByCraft,
} from '../data/references';

// ============================================================
// Account Management re-exports
// ============================================================
export {
  getAccounts,
  getActiveAccount,
  getActiveAccountId,
  setActiveAccount,
  switchAccount,
  createArtisanAccount,
  createBuyerAccount,
  updateAccount,
  deleteAccount,
  generateBuyerId,
} from '../services/accountService';

