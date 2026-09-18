/**
 * ============================================================================
 * JOHAR CRAFT — VERIFICATION SERVICE ABSTRACTION LAYER
 * ============================================================================
 *
 * ARCHITECTURAL NOTE:
 * In a production deployment, these methods will not perform direct client-side
 * verification. Instead, they will communicate securely with the Johar Craft
 * backend API:
 *
 *   [Browser / Client]
 *          │
 *          ▼ (Encrypted HTTPS)
 *   [Johar Craft Secure Backend]
 *          │
 *          ▼ (Authorized Govt / KYC Gateway: DigiLocker, NSDL, DC Handicrafts, GSTN)
 *   [Official Government / KYC Registry API]
 *
 * CRITICAL PRIVACY RULES:
 * 1. Never store raw Aadhaar numbers, PAN numbers, or identity documents in localStorage.
 * 2. Only store masked reference codes, verification dates, providers, and status outcomes.
 * 3. Never expose private API credentials or secrets in frontend code.
 * 4. This prototype implementation simulates responses for demonstration and evaluation.
 * ============================================================================
 */

import type {
  VerificationRecord,
  VerificationStatus,
  VerificationType,
  ArtisanVerificationTier,
  BusinessBuyerDetails,
} from '../types';

export const VERIFICATION_PROVIDERS = {
  GOVERNMENT_IDENTITY: 'Authorized Digital KYC Gateway (Simulated)',
  PEHCHAN: 'Development Commissioner (Handicrafts), Ministry of Textiles, Govt. of India',
  UDYAM: 'Udyam Registration Portal, Ministry of MSME, Govt. of India',
  GSTN: 'Goods and Services Tax Network (GSTN), Govt. of India',
  PHONE_OTP: 'National Telecom SMS Gateway (Simulated)',
} as const;

export const OFFICIAL_PORTAL_URLS = {
  PEHCHAN: 'http://handicrafts.nic.in',
  UDYAM: 'https://udyamregistration.gov.in',
  GST: 'https://www.gst.gov.in',
  DIGILOCKER: 'https://www.digilocker.gov.in',
} as const;

// Helper to simulate network latency in prototype
const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mask an alphanumeric reference string (e.g., Pehchan, GSTIN, Udyam)
 * Leaves the first 2-3 characters and last 4 characters visible, masking the rest.
 */
export function maskReference(raw: string): string {
  if (!raw) return 'XXXXXXXX';
  const clean = raw.trim().toUpperCase();
  if (clean.length <= 6) return 'XXXX' + clean.slice(-2);
  const start = clean.slice(0, 3);
  const end = clean.slice(-4);
  const maskedMiddle = 'X'.repeat(Math.max(4, clean.length - 7));
  return `${start}${maskedMiddle}${end}`;
}

export type GovernmentDocChoice =
  | 'Aadhaar'
  | 'PAN'
  | 'Voter ID'
  | 'Driving Licence'
  | 'Passport';

export function getDocTypeCode(doc: string): 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport' {
  const lower = doc.toLowerCase();
  if (lower.includes('aadhaar')) return 'aadhaar';
  if (lower.includes('pan')) return 'pan';
  if (lower.includes('voter')) return 'voter_id';
  if (lower.includes('driving') || lower.includes('licen')) return 'driving_license';
  if (lower.includes('passport')) return 'passport';
  return 'aadhaar';
}

export function generateMaskedId(docType: string): string {
  const code = getDocTypeCode(docType);
  const num = Math.floor(1000 + Math.random() * 9000);
  switch (code) {
    case 'aadhaar':
      return `XXXX XXXX ${num}`;
    case 'pan':
      return `XXXXX${num}P`;
    case 'voter_id':
      return `JH-XXX-${num}`;
    case 'driving_license':
      return `DL-JH-XXXX-${num}`;
    case 'passport':
      return `Z${Math.floor(100000 + Math.random() * 900000)}`;
    default:
      return `ID-AUTH-XXXX-${num}`;
  }
}

export function getDocTypeLabel(docType: string): string {
  const code = getDocTypeCode(docType);
  switch (code) {
    case 'aadhaar':
      return 'Aadhaar (via DigiLocker)';
    case 'pan':
      return 'Permanent Account Number (PAN)';
    case 'voter_id':
      return 'Voter ID (Election Commission)';
    case 'driving_license':
      return 'Driving Licence (MoRTH)';
    case 'passport':
      return 'Indian Passport (MEA)';
    default:
      return 'Government ID';
  }
}

/**
 * 1. Verify Government Identity
 * Simulates compliant digital KYC flow for any single valid government ID.
 * Never stores raw Aadhaar or document scans in browser storage.
 */
export async function verifyGovernmentIdentity(
  entityId: string,
  docType: string = 'Aadhaar',
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(600);

  const now = new Date().toISOString();
  const docCode = getDocTypeCode(docType);
  const masked = generateMaskedId(docCode);

  if (simulatedOutcome === 'verified') {
    return {
      type: 'identity',
      status: 'verified',
      documentType: docCode,
      verifiedAt: now,
      provider: VERIFICATION_PROVIDERS.GOVERNMENT_IDENTITY,
      maskedReference: masked,
      notes: 'Your government identity verification has been completed.',
    };
  } else if (simulatedOutcome === 'pending') {
    return {
      type: 'identity',
      status: 'pending',
      documentType: docCode,
      provider: VERIFICATION_PROVIDERS.GOVERNMENT_IDENTITY,
      notes: 'Identity document submitted. Verification in progress.',
    };
  } else if (simulatedOutcome === 'requires_review') {
    return {
      type: 'identity',
      status: 'requires_review',
      documentType: docCode,
      provider: VERIFICATION_PROVIDERS.GOVERNMENT_IDENTITY,
      notes: 'Document details require manual verification review.',
    };
  } else {
    return {
      type: 'identity',
      status: 'failed',
      documentType: docCode,
      provider: VERIFICATION_PROVIDERS.GOVERNMENT_IDENTITY,
      notes: 'Verification could not be completed. Your information has not been changed.',
    };
  }
}

/**
 * 2. Verify Pehchan / Artisan Identity Card (Level 2)
 * Verifies with the Office of Development Commissioner (Handicrafts).
 */
export async function verifyPehchan(
  artisanId: string,
  pehchanNumber: string,
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(600);

  const clean = pehchanNumber.trim().toUpperCase();
  const now = new Date().toISOString();

  if (simulatedOutcome === 'failed' || clean.length < 5) {
    return {
      type: 'pehchan',
      status: 'failed',
      provider: VERIFICATION_PROVIDERS.PEHCHAN,
      notes: 'Artisan Pehchan registration number could not be found in the official registry.',
    };
  }

  if (simulatedOutcome === 'pending') {
    return {
      type: 'pehchan',
      status: 'pending',
      provider: VERIFICATION_PROVIDERS.PEHCHAN,
      notes: 'Pehchan identifier submitted. Verification pending registry response.',
    };
  }

  if (simulatedOutcome === 'requires_review') {
    return {
      type: 'pehchan',
      status: 'requires_review',
      provider: VERIFICATION_PROVIDERS.PEHCHAN,
      notes: 'Artisan cluster details flagged for institutional verification review.',
    };
  }

  return {
    type: 'pehchan',
    status: 'verified',
    verifiedAt: now,
    provider: VERIFICATION_PROVIDERS.PEHCHAN,
    maskedReference: maskReference(clean),
    notes: 'Official Pehchan Artisan Identity Card verified with DC (Handicrafts).',
  };
}

/**
 * 3. Verify Udyam Registration (Level 3 - MSME)
 * Verifies with Ministry of MSME.
 */
export async function verifyUdyam(
  entityId: string,
  udyamNumber: string,
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(600);

  const clean = udyamNumber.trim().toUpperCase();
  const now = new Date().toISOString();

  if (simulatedOutcome === 'failed' || !clean.startsWith('UDYAM')) {
    return {
      type: 'udyam',
      status: 'failed',
      provider: VERIFICATION_PROVIDERS.UDYAM,
      notes: 'Invalid Udyam registration format. Format must match UDYAM-XX-XX-XXXXXXX.',
    };
  }

  if (simulatedOutcome === 'pending') {
    return {
      type: 'udyam',
      status: 'pending',
      provider: VERIFICATION_PROVIDERS.UDYAM,
      notes: 'Udyam registration validation in progress.',
    };
  }

  return {
    type: 'udyam',
    status: 'verified',
    verifiedAt: now,
    provider: VERIFICATION_PROVIDERS.UDYAM,
    maskedReference: maskReference(clean),
    notes: 'Udyam MSME enterprise registration verified with Ministry of MSME.',
  };
}

/**
 * 4. Verify GSTIN (Level 3 - Business)
 * Verifies Goods and Services Tax Identification Number.
 */
export async function verifyGSTIN(
  entityId: string,
  gstin: string,
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(600);

  const clean = gstin.trim().toUpperCase();
  const now = new Date().toISOString();

  // Basic format check: 15 alphanumeric characters
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean) && simulatedOutcome !== 'verified') {
    return {
      type: 'gstin',
      status: 'failed',
      provider: VERIFICATION_PROVIDERS.GSTN,
      notes: 'Invalid GSTIN structure. A standard GSTIN has 15 alphanumeric characters.',
    };
  }

  if (simulatedOutcome === 'failed') {
    return {
      type: 'gstin',
      status: 'failed',
      provider: VERIFICATION_PROVIDERS.GSTN,
      notes: 'GSTIN not found or active status could not be confirmed.',
    };
  }

  if (simulatedOutcome === 'pending') {
    return {
      type: 'gstin',
      status: 'pending',
      provider: VERIFICATION_PROVIDERS.GSTN,
      notes: 'GSTIN query queued with tax network API.',
    };
  }

  return {
    type: 'gstin',
    status: 'verified',
    verifiedAt: now,
    provider: VERIFICATION_PROVIDERS.GSTN,
    maskedReference: maskReference(clean),
    notes: 'GSTIN registration confirmed active on the official GST network.',
  };
}

/**
 * 5. Verify Business Buyer Details
 */
export async function verifyBusinessBuyer(
  buyerId: string,
  details: BusinessBuyerDetails,
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(600);

  const now = new Date().toISOString();

  if (!details.businessName.trim()) {
    return {
      type: 'business',
      status: 'failed',
      notes: 'Business name is required for enterprise verification.',
    };
  }

  return {
    type: 'business',
    status: simulatedOutcome,
    verifiedAt: simulatedOutcome === 'verified' ? now : undefined,
    provider: 'Johar Craft Enterprise Verification Desk',
    maskedReference: details.gstin ? maskReference(details.gstin) : `BIZ-${details.businessName.slice(0, 4).toUpperCase()}-VERIFIED`,
    notes: `Enterprise buyer credentials verified for ${details.businessName} (${details.businessType}).`,
    details: {
      businessName: details.businessName,
      businessType: details.businessType,
    },
  };
}

/**
 * 6. Send Phone OTP
 */
export async function sendPhoneOTP(phone: string): Promise<{ success: boolean; message: string; demoCode: string }> {
  await delay(400);
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit mobile number.', demoCode: '' };
  }
  return {
    success: true,
    message: `OTP sent successfully to +91 ${clean.slice(-10)}.`,
    demoCode: '123456', // Prototype demo code
  };
}

/**
 * 7. Verify Phone OTP
 */
export async function verifyPhoneOTP(
  entityId: string,
  phone: string,
  otp: string,
  simulatedOutcome: VerificationStatus = 'verified'
): Promise<VerificationRecord> {
  await delay(400);

  const clean = phone.replace(/[^0-9]/g, '');
  const now = new Date().toISOString();

  if (otp.trim() !== '123456' && simulatedOutcome !== 'verified') {
    return {
      type: 'phone',
      status: 'failed',
      provider: VERIFICATION_PROVIDERS.PHONE_OTP,
      notes: 'Incorrect OTP code entered. (Prototype demo code: 123456)',
    };
  }

  const maskedPhone = `+91 XXXXX X${clean.slice(-4)}`;
  return {
    type: 'phone',
    status: 'verified',
    verifiedAt: now,
    provider: VERIFICATION_PROVIDERS.PHONE_OTP,
    maskedReference: maskedPhone,
    notes: 'Mobile number authenticated via SMS OTP.',
  };
}

/**
 * Compute the overall artisan verification tier from records
 */
export function calculateArtisanTier(
  records: Partial<Record<VerificationType, VerificationRecord>>
): ArtisanVerificationTier {
  if (records.udyam?.status === 'verified' || records.gstin?.status === 'verified') {
    return 'LEVEL_3_BUSINESS_VERIFIED';
  }
  if (records.pehchan?.status === 'verified') {
    return 'LEVEL_2_ARTISAN_VERIFIED';
  }
  if (records.identity?.status === 'verified') {
    return 'LEVEL_1_IDENTITY_VERIFIED';
  }
  return 'LEVEL_0_UNVERIFIED';
}

/**
 * Friendly label for verification tier
 */
export function getTierLabel(tier: ArtisanVerificationTier): string {
  switch (tier) {
    case 'LEVEL_3_BUSINESS_VERIFIED':
      return 'Business Registration Verified';
    case 'LEVEL_2_ARTISAN_VERIFIED':
      return 'Artisan Registration Provided';
    case 'LEVEL_1_IDENTITY_VERIFIED':
      return 'Identity Verified';
    case 'LEVEL_0_UNVERIFIED':
    default:
      return 'Not Verified';
  }
}
