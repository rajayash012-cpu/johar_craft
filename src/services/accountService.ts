import type {
  Account,
  ArtisanAccount,
  BuyerAccount,
  Artisan,
  BuyerProfile,
  Product,
  Enquiry,
} from '../types';
import { REAL_ARTISANS } from '../data/artisans';

// Storage keys
export const ACCOUNT_STORAGE_KEYS = {
  ACCOUNTS: 'joharcraft_accounts',
  ACTIVE_ACCOUNT: 'joharcraft_active_account',
  INITIALIZED: 'joharcraft_accounts_initialized',
  // Legacy keys for backward compatibility
  LEGACY_ARTISAN: 'jc_artisan',
  LEGACY_BUYER: 'jc_buyer_profile',
  PRODUCTS: 'jc_products',
  ARTISAN_VERIFICATION: 'jc_artisan_verification',
  ENQUIRIES: 'jc_enquiries',
} as const;

// Default initial buyer Anita Verma
const DEFAULT_INITIAL_BUYER: BuyerProfile = {
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

/**
 * Initialize / migrate accounts from existing storage on first run
 */
export function initializeAccountsIfNeeded(): Account[] {
  // If already initialized, return existing accounts (even if empty, do NOT reseed if user deleted all)
  const isInitialized = localStorage.getItem(ACCOUNT_STORAGE_KEYS.INITIALIZED) === 'true';
  const rawAccounts = localStorage.getItem(ACCOUNT_STORAGE_KEYS.ACCOUNTS);

  if (isInitialized && rawAccounts !== null) {
    try {
      return JSON.parse(rawAccounts);
    } catch {
      return [];
    }
  }

  // First time initialization / migration
  const existingAccounts: Account[] = [];

  // 1. Migrate or create Artisan Account (Putli Devi)
  let initialArtisan: Artisan = REAL_ARTISANS[0];
  const legacyArtisanRaw = localStorage.getItem(ACCOUNT_STORAGE_KEYS.LEGACY_ARTISAN);
  if (legacyArtisanRaw) {
    try {
      initialArtisan = JSON.parse(legacyArtisanRaw);
    } catch {
      initialArtisan = REAL_ARTISANS[0];
    }
  }

  const defaultArtisanAccount: ArtisanAccount = {
    id: 'acc_artisan_putli_01',
    type: 'artisan',
    artisanId: initialArtisan.id === 'JH-ART-0001' ? 'JC-ART-0001' : initialArtisan.id || 'JC-ART-0001',
    name: initialArtisan.name || 'Putli Devi',
    photo: initialArtisan.profilePhoto,
    village: initialArtisan.village && initialArtisan.village !== 'Information not provided' ? initialArtisan.village : 'Bhadu',
    district: initialArtisan.district || 'Hazaribagh',
    state: initialArtisan.state || 'Jharkhand',
    craftCategory: initialArtisan.craftCategory || 'Sohrai Art',
    yearsExperience: initialArtisan.yearsExperience || 25,
    phone: initialArtisan.phone || '+91 94311 00221',
    story: initialArtisan.story || 'Master tribal artist from Hazaribagh creating ritual Sohrai wall art.',
    craftDescription: initialArtisan.craftDescription,
    organization: initialArtisan.organization || 'Tribal Women Artists Cooperative (TWAC)',
    cluster: initialArtisan.cluster,
    isVerified: true,
    verificationTier: initialArtisan.verificationTier || 'LEVEL_2_ARTISAN_VERIFIED',
    verificationRecords: initialArtisan.verificationRecords || {
      identity: {
        type: 'identity',
        status: 'verified',
        verifiedAt: '2026-01-20T11:00:00Z',
        provider: 'Authorized Digital KYC Gateway (Simulated)',
        maskedReference: 'KYC-AUTH-XXXX-8192',
        notes: 'Identity verification completed via Aadhaar.',
      },
      pehchan: {
        type: 'pehchan',
        status: 'verified',
        verifiedAt: '2026-01-20T11:30:00Z',
        provider: 'Development Commissioner (Handicrafts), Ministry of Textiles',
        maskedReference: 'PEH-XXXX-8921',
      },
    },
    createdAt: initialArtisan.joinedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    languagePreference: 'en',
  };
  existingAccounts.push(defaultArtisanAccount);

  // 2. Migrate or create Buyer Account (Anita Verma)
  let initialBuyer: BuyerProfile = DEFAULT_INITIAL_BUYER;
  const legacyBuyerRaw = localStorage.getItem(ACCOUNT_STORAGE_KEYS.LEGACY_BUYER);
  if (legacyBuyerRaw) {
    try {
      initialBuyer = JSON.parse(legacyBuyerRaw);
    } catch {
      initialBuyer = DEFAULT_INITIAL_BUYER;
    }
  }

  const defaultBuyerAccount: BuyerAccount = {
    id: 'acc_buyer_anita_01',
    type: 'buyer',
    buyerId: 'JC-BUY-0001',
    name: initialBuyer.name || 'Anita Verma',
    buyerType: initialBuyer.buyerType || 'INDIVIDUAL',
    phone: initialBuyer.phone || '+91 98765 43210',
    email: initialBuyer.email || 'anita.verma@example.com',
    location: initialBuyer.location || 'Ranchi, Jharkhand',
    businessDetails: initialBuyer.businessDetails,
    records: initialBuyer.records || {
      phone: {
        type: 'phone',
        status: 'verified',
        verifiedAt: '2026-03-10T10:00:00.000Z',
        provider: 'National Telecom SMS Gateway (Simulated)',
        maskedReference: '+91 XXXXX X3210',
        notes: 'Mobile number authenticated via SMS OTP.',
      },
    },
    wishlist: initialBuyer.wishlist || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    languagePreference: 'en',
  };
  existingAccounts.push(defaultBuyerAccount);

  // Save migrated accounts
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.ACCOUNTS, JSON.stringify(existingAccounts));
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.ACTIVE_ACCOUNT, defaultArtisanAccount.id);
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.INITIALIZED, 'true');

  // Synchronize legacy keys
  syncLegacyArtisanKey(defaultArtisanAccount);
  syncLegacyBuyerKey(defaultBuyerAccount);

  return existingAccounts;
}

/**
 * Get all accounts stored on device
 */
export function getAccounts(): Account[] {
  initializeAccountsIfNeeded();
  const raw = localStorage.getItem(ACCOUNT_STORAGE_KEYS.ACCOUNTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save accounts array to storage
 */
export function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

/**
 * Get active account ID
 */
export function getActiveAccountId(): string | null {
  initializeAccountsIfNeeded();
  return localStorage.getItem(ACCOUNT_STORAGE_KEYS.ACTIVE_ACCOUNT) || null;
}

/**
 * Get currently active Account object
 */
export function getActiveAccount(): Account | null {
  const activeId = getActiveAccountId();
  if (!activeId) return null;
  const accounts = getAccounts();
  const found = accounts.find(a => a.id === activeId);
  return found || null;
}

/**
 * Set active account by ID, synchronizing legacy storage keys and firing an event
 */
export function setActiveAccount(accountId: string | null): void {
  if (!accountId) {
    localStorage.removeItem(ACCOUNT_STORAGE_KEYS.ACTIVE_ACCOUNT);
    window.dispatchEvent(new CustomEvent('joharcraft:account-changed', { detail: { accountId: null } }));
    return;
  }

  const accounts = getAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (!account) return;

  localStorage.setItem(ACCOUNT_STORAGE_KEYS.ACTIVE_ACCOUNT, accountId);

  // Sync legacy keys depending on account type
  if (account.type === 'artisan') {
    syncLegacyArtisanKey(account);
  } else if (account.type === 'buyer') {
    syncLegacyBuyerKey(account);
  }

  window.dispatchEvent(
    new CustomEvent('joharcraft:account-changed', {
      detail: { accountId, account },
    })
  );
}

/**
 * Switch to a specific account
 */
export function switchAccount(accountId: string): Account | null {
  setActiveAccount(accountId);
  return getActiveAccount();
}

/**
 * Generate stable next Artisan ID: JC-ART-xxxx
 */
export function generateArtisanId(): string {
  const accounts = getAccounts();
  const artisanIds: number[] = [];

  accounts.forEach(acc => {
    if (acc.type === 'artisan') {
      const match = acc.artisanId.match(/(?:JC|JH)-ART-(\d+)/);
      if (match) artisanIds.push(parseInt(match[1], 10));
    }
  });

  // Also check REAL_ARTISANS
  REAL_ARTISANS.forEach(a => {
    const match = a.id.match(/(?:JC|JH)-ART-(\d+)/);
    if (match) artisanIds.push(parseInt(match[1], 10));
  });

  const max = artisanIds.length > 0 ? Math.max(...artisanIds) : 4;
  const next = max + 1;
  return `JC-ART-${String(next).padStart(4, '0')}`;
}

/**
 * Generate stable next Buyer ID: JC-BUY-xxxx
 */
export function generateBuyerId(): string {
  const accounts = getAccounts();
  const buyerIds: number[] = [];

  accounts.forEach(acc => {
    if (acc.type === 'buyer' && acc.buyerId) {
      const match = acc.buyerId.match(/JC-BUY-(\d+)/);
      if (match) buyerIds.push(parseInt(match[1], 10));
    }
  });

  const max = buyerIds.length > 0 ? Math.max(...buyerIds) : 1;
  const next = max + 1;
  return `JC-BUY-${String(next).padStart(4, '0')}`;
}

/**
 * Create a new Artisan Account
 */
export function createArtisanAccount(data: {
  name: string;
  district: string;
  village: string;
  craftCategory: string;
  phone?: string;
  story?: string;
  photo?: string;
  organization?: string;
  yearsExperience?: number | string;
}): ArtisanAccount {
  const accounts = getAccounts();
  const newId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const artisanId = generateArtisanId();

  const newAccount: ArtisanAccount = {
    id: newId,
    type: 'artisan',
    artisanId,
    name: data.name.trim(),
    district: data.district,
    village: data.village.trim(),
    state: 'Jharkhand',
    craftCategory: data.craftCategory,
    phone: data.phone?.trim() || '',
    story: data.story?.trim() || `Traditional ${data.craftCategory} artisan from ${data.district}, Jharkhand.`,
    photo: data.photo,
    organization: data.organization,
    yearsExperience: data.yearsExperience || 1,
    isVerified: false,
    verificationTier: 'LEVEL_0_UNVERIFIED',
    verificationRecords: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    languagePreference: 'en',
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  setActiveAccount(newId);

  return newAccount;
}

/**
 * Create a new Buyer Account
 */
export function createBuyerAccount(data: {
  name: string;
  buyerType: 'INDIVIDUAL' | 'BUSINESS';
  phone?: string;
  email?: string;
  location?: string;
  businessName?: string;
}): BuyerAccount {
  const accounts = getAccounts();
  const newId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const buyerId = generateBuyerId();

  const newAccount: BuyerAccount = {
    id: newId,
    type: 'buyer',
    buyerId,
    name: data.name.trim(),
    buyerType: data.buyerType,
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    location: data.location?.trim() || 'Ranchi, Jharkhand',
    businessDetails:
      data.buyerType === 'BUSINESS'
        ? {
            businessName: data.businessName?.trim() || `${data.name.trim()}'s Enterprise`,
            businessType: 'Proprietorship',
          }
        : undefined,
    records: {},
    wishlist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    languagePreference: 'en',
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  setActiveAccount(newId);

  return newAccount;
}

/**
 * Update an existing account
 */
export function updateAccount(id: string, updates: Partial<Account>): Account | null {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return null;

  const current = accounts[index];
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  } as Account;

  accounts[index] = updated;
  saveAccounts(accounts);

  // If this is active account, update legacy key and dispatch
  if (getActiveAccountId() === id) {
    if (updated.type === 'artisan') {
      syncLegacyArtisanKey(updated);
    } else if (updated.type === 'buyer') {
      syncLegacyBuyerKey(updated);
    }
    window.dispatchEvent(
      new CustomEvent('joharcraft:account-changed', {
        detail: { accountId: id, account: updated },
      })
    );
  }

  return updated;
}

/**
 * Delete an account permanently along with its owned products and verification data
 */
export function deleteAccount(id: string): {
  remainingAccounts: Account[];
  newActiveId: string | null;
} {
  const accounts = getAccounts();
  const toDelete = accounts.find(a => a.id === id);
  if (!toDelete) {
    return { remainingAccounts: accounts, newActiveId: getActiveAccountId() };
  }

  // 1. Account-scoped cascade data purge
  if (toDelete.type === 'artisan') {
    // Purge all products created by this artisan
    try {
      const rawProducts = localStorage.getItem(ACCOUNT_STORAGE_KEYS.PRODUCTS);
      if (rawProducts) {
        const products: Product[] = JSON.parse(rawProducts);
        // Match both artisanId (and legacy JH-ART-0001 if JC-ART-0001) or accountId
        const filteredProducts = products.filter(p => {
          if (p.accountId && p.accountId === toDelete.id) return false;
          if (p.artisanId === toDelete.artisanId) return false;
          if (toDelete.artisanId === 'JC-ART-0001' && p.artisanId === 'JH-ART-0001') return false;
          return true;
        });
        localStorage.setItem(ACCOUNT_STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProducts));
      }
    } catch {
      // ignore
    }

    // Purge verification records
    try {
      const rawVerif = localStorage.getItem(ACCOUNT_STORAGE_KEYS.ARTISAN_VERIFICATION);
      if (rawVerif) {
        const verifMap = JSON.parse(rawVerif);
        delete verifMap[toDelete.artisanId];
        if (toDelete.artisanId === 'JC-ART-0001') delete verifMap['JH-ART-0001'];
        localStorage.setItem(ACCOUNT_STORAGE_KEYS.ARTISAN_VERIFICATION, JSON.stringify(verifMap));
      }
    } catch {
      // ignore
    }
  } else if (toDelete.type === 'buyer') {
    // Purge enquiries from this buyer
    try {
      const rawEnquiries = localStorage.getItem(ACCOUNT_STORAGE_KEYS.ENQUIRIES);
      if (rawEnquiries) {
        const enquiries: Enquiry[] = JSON.parse(rawEnquiries);
        const filteredEnquiries = enquiries.filter(
          e => e.buyer?.id !== toDelete.buyerId && e.buyer?.id !== toDelete.id
        );
        localStorage.setItem(ACCOUNT_STORAGE_KEYS.ENQUIRIES, JSON.stringify(filteredEnquiries));
      }
    } catch {
      // ignore
    }
  }

  // 2. Remove from accounts array
  const remaining = accounts.filter(a => a.id !== id);
  saveAccounts(remaining);

  // 3. Handle active account pointer
  const isActive = getActiveAccountId() === id;
  let newActiveId: string | null = getActiveAccountId();

  if (isActive) {
    if (remaining.length > 0) {
      newActiveId = remaining[0].id;
      setActiveAccount(newActiveId);
    } else {
      newActiveId = null;
      localStorage.removeItem(ACCOUNT_STORAGE_KEYS.ACTIVE_ACCOUNT);
      localStorage.removeItem(ACCOUNT_STORAGE_KEYS.LEGACY_ARTISAN);
      localStorage.removeItem(ACCOUNT_STORAGE_KEYS.LEGACY_BUYER);
      window.dispatchEvent(
        new CustomEvent('joharcraft:account-changed', {
          detail: { accountId: null, account: null },
        })
      );
    }
  }

  return { remainingAccounts: remaining, newActiveId };
}

/**
 * Synchronize artisan account data into legacy 'jc_artisan'
 */
function syncLegacyArtisanKey(account: ArtisanAccount): void {
  const legacyArtisan: Artisan = {
    id: account.artisanId,
    name: account.name,
    profilePhoto: account.photo,
    village: account.village,
    district: account.district,
    state: account.state,
    craftCategory: account.craftCategory,
    yearsExperience: account.yearsExperience,
    phone: account.phone,
    story: account.story,
    craftDescription: account.craftDescription,
    organization: account.organization,
    cluster: account.cluster,
    isVerified: account.isVerified,
    verificationTier: account.verificationTier,
    verificationRecords: account.verificationRecords,
    joinedAt: account.createdAt,
    profileViews: 184,
    productViews: 412,
    enquiries: 19,
  };
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.LEGACY_ARTISAN, JSON.stringify(legacyArtisan));
}

/**
 * Synchronize buyer account data into legacy 'jc_buyer_profile'
 */
function syncLegacyBuyerKey(account: BuyerAccount): void {
  const legacyBuyer: BuyerProfile = {
    id: account.buyerId,
    name: account.name,
    phone: account.phone,
    email: account.email,
    buyerType: account.buyerType,
    location: account.location,
    businessDetails: account.businessDetails,
    records: account.records || {},
    wishlist: account.wishlist || [],
  };
  localStorage.setItem(ACCOUNT_STORAGE_KEYS.LEGACY_BUYER, JSON.stringify(legacyBuyer));
}
