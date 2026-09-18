import sohraiImg from '../assets/products/sohrai-natural-pigment-painting.jpg';
import khovarImg from '../assets/products/khovar-comb-cut-art.jpg';
import sareeImg from '../assets/products/santhali-tribal-handloom-saree.jpg';

export interface SampleCraftPreset {
  id: string;
  label: string;
  craftCategory: string;
  expectedName: string;
  image: string;
  description: string;
  isAmbiguous?: boolean;
}

// Crisp base64 SVG data URIs with rich representative color palettes for Dokra, Bamboo, Pottery, and Jewellery
const DOKRA_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#2d2822" />
    <!-- Dokra Elephant Bell Metal Figurine Silhouette & Filigree -->
    <g fill="#c99738" stroke="#a47520" stroke-width="4">
      <!-- Body -->
      <ellipse cx="300" cy="330" rx="140" ry="105" fill="#b88628" />
      <!-- Legs -->
      <rect x="180" y="380" width="38" height="110" rx="8" />
      <rect x="235" y="380" width="38" height="110" rx="8" />
      <rect x="330" y="380" width="38" height="110" rx="8" />
      <rect x="385" y="380" width="38" height="110" rx="8" />
      <!-- Head & Trunk -->
      <circle cx="430" cy="270" r="55" fill="#c99738" />
      <path d="M470,290 Q510,330 490,400 Q470,410 460,390 Q475,340 450,310 Z" fill="#b88628" />
      <!-- Ears -->
      <ellipse cx="405" cy="260" rx="28" ry="40" fill="#9e701c" />
      <ellipse cx="405" cy="260" rx="18" ry="26" fill="#c99738" />
      <!-- Filigree saddle wires -->
      <path d="M210,320 Q300,280 390,320 M210,340 Q300,300 390,340 M240,290 L240,370 M280,280 L280,380 M320,280 L320,380 M360,290 L360,370" fill="none" stroke="#e0b24e" stroke-width="3" />
      <!-- Tail -->
      <path d="M165,330 Q140,380 150,430" fill="none" stroke="#c99738" stroke-width="8" stroke-linecap="round" />
    </g>
    <text x="300" y="540" fill="#e0b24e" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">
      Lost-Wax Cast Dokra Bell-Metal Figurine
    </text>
  </svg>
`);

const BAMBOO_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#f4ede2" />
    <!-- Woven Bamboo Utility Basket -->
    <g stroke="#9a7442" stroke-width="3" fill="#cfab72">
      <!-- Outer woven body -->
      <ellipse cx="300" cy="380" rx="200" ry="110" fill="#dfbe86" stroke="#876233" stroke-width="8" />
      <ellipse cx="300" cy="350" rx="180" ry="90" fill="#c49f65" stroke="#755225" stroke-width="4" />
      <!-- Lattice criss-cross weaving -->
      <path d="M130,360 L470,360 M150,330 L450,390 M150,390 L450,330 M180,310 L420,410 M180,410 L420,310 M220,290 L380,430 M220,430 L380,290" fill="none" stroke="#7e592a" stroke-width="4" />
      <!-- Cane reinforced rim -->
      <ellipse cx="300" cy="330" rx="205" ry="70" fill="none" stroke="#5a3d16" stroke-width="12" />
    </g>
    <text x="300" y="530" fill="#5a3d16" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">
      Handwoven Split-Bamboo Utility Basket
    </text>
  </svg>
`);

const POTTERY_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#ece4db" />
    <!-- Terracotta Clay Vase -->
    <g fill="#c4582f" stroke="#8a3717" stroke-width="6">
      <!-- Rim -->
      <ellipse cx="300" cy="180" rx="70" ry="24" fill="#a8431e" />
      <ellipse cx="300" cy="175" rx="55" ry="16" fill="#782d12" />
      <!-- Neck & Belly -->
      <path d="M245,185 C260,240 180,300 180,380 C180,470 240,490 300,490 C360,490 420,470 420,380 C420,300 340,240 355,185 Z" fill="#b84f27" />
      <!-- Base -->
      <ellipse cx="300" cy="490" rx="90" ry="20" fill="#8a3717" />
      <!-- Traditional burnished earth bands -->
      <path d="M200,360 Q300,390 400,360" fill="none" stroke="#68240c" stroke-width="8" />
      <path d="M210,400 Q300,430 390,400" fill="none" stroke="#d66e45" stroke-width="6" />
    </g>
    <text x="300" y="550" fill="#782d12" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">
      Handcrafted Terracotta Earthenware Vase
    </text>
  </svg>
`);

const AMBIGUOUS_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#3b4252" />
    <!-- Abstract non-handicraft metallic shape with neon gradients -->
    <circle cx="300" cy="300" r="160" fill="#4c566a" stroke="#88c0d0" stroke-width="8" />
    <rect x="220" y="220" width="160" height="160" rx="20" fill="#5e81ac" stroke="#eceff4" stroke-width="4" />
    <text x="300" y="530" fill="#eceff4" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">
      Unidentified Modern Synthetic Shape (Ambiguous Test)
    </text>
  </svg>
`);

const WOOD_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#2a1608" />
    <!-- Carved Hardwood Relief Panel -->
    <g fill="#5c381e" stroke="#1d0e04" stroke-width="4">
      <rect x="100" y="80" width="400" height="440" rx="16" fill="#6e4224" stroke="#422510" stroke-width="10" />
      <!-- Linear Wood Grain Lines -->
      <path d="M120,120 Q300,100 480,120 M120,200 Q300,180 480,200 M120,320 Q300,300 480,320 M120,440 Q300,420 480,440" fill="none" stroke="#4d2b13" stroke-width="3" />
      <!-- Carved Tribal Floral / Sun Motif -->
      <circle cx="300" cy="280" r="75" fill="#8a532d" stroke="#331908" stroke-width="6" />
      <circle cx="300" cy="280" r="30" fill="#a36539" />
      <!-- Chiseled Petals -->
      <path d="M300,175 L300,205 M300,355 L300,385 M195,280 L225,280 M375,280 L405,280 M225,205 L245,225 M355,355 L375,335 M225,355 L245,335 M355,205 L375,225" stroke="#ffe0b2" stroke-width="8" stroke-linecap="round" />
    </g>
    <text x="300" y="560" fill="#ffe0b2" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">
      Hand-Carved Indigenous Hardwood Relief Panel
    </text>
  </svg>
`);

const JEWELLERY_SAMPLE_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#14181f" />
    <!-- Tribal Bell Metal / Silver Hasli Choker & Beads -->
    <g fill="#d1d5db" stroke="#9ca3af" stroke-width="4">
      <!-- Main Collar Arc (Hasli) -->
      <path d="M150,220 C150,380 450,380 450,220" fill="none" stroke="#e5e7eb" stroke-width="22" stroke-linecap="round" />
      <!-- Filigree Engraved Bands on Collar -->
      <path d="M220,320 L220,340 M260,345 L260,365 M300,350 L300,370 M340,345 L340,365 M380,320 L380,340" stroke="#4b5563" stroke-width="4" />
      <!-- Dangling Tribal Coin / Bell Charms -->
      <g fill="#f3f4f6" stroke="#6b7280" stroke-width="2">
        <circle cx="220" cy="370" r="14" />
        <circle cx="260" cy="395" r="15" />
        <circle cx="300" cy="405" r="17" />
        <circle cx="340" cy="395" r="15" />
        <circle cx="380" cy="370" r="14" />
      </g>
      <!-- Connecting Beads -->
      <circle cx="160" cy="220" r="16" fill="#9ca3af" />
      <circle cx="440" cy="220" r="16" fill="#9ca3af" />
    </g>
    <text x="300" y="540" fill="#e5e7eb" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">
      Traditional Santhali Handcrafted Hasli Ornament
    </text>
  </svg>
`);

export const SAMPLE_CRAFT_PRESETS: SampleCraftPreset[] = [
  {
    id: 'sample-dokra',
    label: 'Dokra Elephant',
    craftCategory: 'Dokra',
    expectedName: 'Handcrafted Dokra Bell-Metal Figurine',
    image: DOKRA_SAMPLE_DATA_URI,
    description: 'Lost-wax cast brass/bell metal figurine with twisted wax filigree wire detailing.',
  },
  {
    id: 'sample-bamboo',
    label: 'Bamboo Basket',
    craftCategory: 'Bamboo & Cane',
    expectedName: 'Handwoven Bamboo Fruit & Utility Basket',
    image: BAMBOO_SAMPLE_DATA_URI,
    description: 'Hand-split indigenous bamboo basket woven by Mahli community artisans.',
  },
  {
    id: 'sample-pottery',
    label: 'Terracotta Vase',
    craftCategory: 'Pottery',
    expectedName: 'Handcrafted Terracotta Earthenware Vase',
    image: POTTERY_SAMPLE_DATA_URI,
    description: 'Natural unglazed wheel-thrown terracotta earthenware vessel.',
  },
  {
    id: 'sample-textile',
    label: 'Santhali Saree',
    craftCategory: 'Textiles',
    expectedName: 'Traditional Handwoven Saree',
    image: sareeImg,
    description: 'Indigenous handloom drape with classic red geometric temple border.',
  },
  {
    id: 'sample-wood',
    label: 'Wood Carving',
    craftCategory: 'Wood Craft',
    expectedName: 'Handcrafted Carved Wood Piece',
    image: WOOD_SAMPLE_DATA_URI,
    description: 'Hand-carved indigenous timber relief panel with natural grain.',
  },
  {
    id: 'sample-jewellery',
    label: 'Tribal Jewellery',
    craftCategory: 'Tribal Jewellery',
    expectedName: 'Traditional Hasli Ornament',
    image: JEWELLERY_SAMPLE_DATA_URI,
    description: 'Handcrafted bell metal / white metal tribal collar choker with coin pendants.',
  },
  {
    id: 'sample-sohrai',
    label: 'Sohrai Art',
    craftCategory: 'Sohrai Art',
    expectedName: 'Authentic Sohrai Natural Pigment Painting',
    image: sohraiImg,
    description: 'Traditional harvest festival mural painted with four sacred natural earth clays.',
  },
  {
    id: 'sample-ambiguous',
    label: 'Ambiguous / Unrelated Item',
    craftCategory: 'Not confidently identified',
    expectedName: 'Handicraft Item (Unconfirmed)',
    image: AMBIGUOUS_SAMPLE_DATA_URI,
    description: 'Synthetic/unrelated shape to test no-hallucination handling and manual fallback.',
    isAmbiguous: true,
  },
];
