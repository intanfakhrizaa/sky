import { db } from './db.ts';

interface RawProduct {
  sku: string;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  subcategory_id: number;
  description: string;
  short_desc: string;
  material: string;
  dimensions: string;
  weight_grams: number;
  normal_price: number;
  promo_price?: number;
  is_featured?: number;
  is_flash_sale?: number;
  flash_sale_discount_percent?: number;
  rating: number;
  review_count: number;
  sold_count: number;
  tags: string[];
  images: string[];
  variants: {
    sku: string;
    title: string;
    size?: string;
    color?: string;
    color_code?: string;
    additional_price?: number;
    stock: number;
  }[];
  wholesale: {
    min: number;
    max: number | null;
    price: number;
  }[];
}

export function seedProducts() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (existing.count >= 40) return;

  const rawProducts: RawProduct[] = [
    // --- 1. SURFING (cat_id: 1) ---
    {
      sku: 'SKY-SRF-001',
      name: 'Apex Pro Carbon Shortboard 6\'0"',
      slug: 'apex-pro-carbon-shortboard-60',
      brand_id: 2, // RipCurrent
      category_id: 1,
      subcategory_id: 2, // shortboard
      description: 'Papan selancar carbon composite ultra-ringan dengan konstruksi EPS foam dan carbon stringer ganda. Sangat lincah untuk manuver cepat di gelombang ombak tubular 4-8 kaki.',
      short_desc: 'Shortboard kompetisi carbon stringer EPS 6\'0" x 19" x 2.38"',
      material: 'EPS Foam Core + Biaxial Carbon Rail + Epoxy Resin',
      dimensions: '183cm x 48.2cm x 6.0cm (28.5L)',
      weight_grams: 2800,
      normal_price: 6850000,
      promo_price: 6250000,
      is_featured: 1,
      rating: 4.9,
      review_count: 38,
      sold_count: 142,
      tags: ['surfboard', 'shortboard', 'carbon', 'ripcurrent', 'surf competition', 'bali wave'],
      images: [
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-001-WHT', title: 'Matte White Carbon - 6\'0"', size: '6\'0"', color: 'Matte White', color_code: '#F8F9FA', stock: 8 },
        { sku: 'SKY-SRF-001-AQU', title: 'Aqua Azure Carbon - 6\'0"', size: '6\'0"', color: 'Aqua Azure', color_code: '#00B4D8', stock: 5 },
        { sku: 'SKY-SRF-001-62W', title: 'Matte White Carbon - 6\'2"', size: '6\'2"', color: 'Matte White', color_code: '#F8F9FA', additional_price: 250000, stock: 4 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 5950000 },
        { min: 6, max: null, price: 5600000 }
      ]
    },
    {
      sku: 'SKY-SRF-002',
      name: 'Pacific Glide Classic Single-Fin Longboard 9\'2"',
      slug: 'pacific-glide-classic-longboard-92',
      brand_id: 2,
      category_id: 1,
      subcategory_id: 3, // longboard
      description: 'Longboard noserider klasik dengan rocker halus dan concave di bagian nose untuk kestabilan hang-ten maksimal.',
      short_desc: 'Noserider klasik 9\'2" single-fin glassing 6oz + 6oz',
      material: 'PU Core + Resin Tint Wood Stringer',
      dimensions: '279cm x 58cm x 7.3cm (72L)',
      weight_grams: 6200,
      normal_price: 8900000,
      is_featured: 1,
      rating: 5.0,
      review_count: 24,
      sold_count: 67,
      tags: ['longboard', 'noserider', 'classic surf', 'single fin', 'glide'],
      images: [
        'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-002-SEA', title: 'Seafoam Green Tint - 9\'2"', size: '9\'2"', color: 'Seafoam Green', color_code: '#70A9A1', stock: 3 },
        { sku: 'SKY-SRF-002-AMB', title: 'Amber Honey Tint - 9\'2"', size: '9\'2"', color: 'Amber Honey', color_code: '#D4A373', stock: 4 }
      ],
      wholesale: [
        { min: 2, max: 4, price: 8400000 },
        { min: 5, max: null, price: 7950000 }
      ]
    },
    {
      sku: 'SKY-SRF-003',
      name: 'Retro Keel Twin Fin Fish 5\'8"',
      slug: 'retro-keel-twin-fin-fish-58',
      brand_id: 2,
      category_id: 1,
      subcategory_id: 4, // fish
      description: 'Fish board swallow tail lebar dengan daya apung tinggi untuk meluncur mulus di ombak kecil hingga menengah.',
      short_desc: 'Retro Twin Fish 5\'8" swallow tail speed cruiser',
      material: 'EPS Foam + Fiberglass',
      dimensions: '172cm x 52cm x 6.5cm (33L)',
      weight_grams: 3100,
      normal_price: 5400000,
      promo_price: 4950000,
      rating: 4.8,
      review_count: 19,
      sold_count: 88,
      tags: ['fish board', 'twin fin', 'retro surf', 'swallow tail'],
      images: [
        'https://images.unsplash.com/photo-1520116468418-095984ab175d?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-003-SUN', title: 'Sunset Yellow - 5\'8"', size: '5\'8"', color: 'Sunset Yellow', color_code: '#FFB703', stock: 6 },
        { sku: 'SKY-SRF-003-COR', title: 'Coral Red - 5\'8"', size: '5\'8"', color: 'Coral Red', color_code: '#E63946', stock: 3 }
      ],
      wholesale: [
        { min: 3, max: null, price: 4650000 }
      ]
    },
    {
      sku: 'SKY-SRF-004',
      name: 'WaveRider Softboard Beginner & School 7\'0"',
      slug: 'waverider-softboard-beginner-70',
      brand_id: 1, // Skyra Pro
      category_id: 1,
      subcategory_id: 5, // softboard
      description: 'Papan selancar busa empuk aman dengan triple wood stringer dan lapisan IXPE anti benturan. Sangat ideal untuk pemula dan sekolah surfing.',
      short_desc: 'Softboard busa empuk stabil 7\'0" dengan fins aman',
      material: 'IXPE Deck + HDPE Slick Bottom + EPS Core',
      dimensions: '213cm x 55cm x 7.0cm (60L)',
      weight_grams: 4800,
      normal_price: 3200000,
      promo_price: 2850000,
      is_flash_sale: 1,
      flash_sale_discount_percent: 11,
      rating: 4.7,
      review_count: 52,
      sold_count: 210,
      tags: ['softboard', 'beginner surfboard', 'surf school', 'safe foam'],
      images: [
        'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-004-BLU', title: 'Ocean Blue - 7\'0"', size: '7\'0"', color: 'Ocean Blue', color_code: '#0077B6', stock: 12 },
        { sku: 'SKY-SRF-004-ORG', title: 'Neon Orange - 7\'0"', size: '7\'0"', color: 'Neon Orange', color_code: '#F77F00', stock: 9 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 2550000 },
        { min: 10, max: null, price: 2300000 }
      ]
    },
    {
      sku: 'SKY-SRF-005',
      name: 'StormShield 7mm Urethane Surfboard Leash 7ft',
      slug: 'stormshield-7mm-surfboard-leash-7ft',
      brand_id: 1,
      category_id: 1,
      subcategory_id: 6, // leash
      description: 'Tali pengikat kaki surfboard dengan kabel poliuretana Jerman 7mm anti putus, dual stainless steel swivel 360 derajat, dan padding neoprene nyaman.',
      short_desc: 'Leash selancar 7ft tebal 7mm dual marine swivel anti-tangle',
      material: 'German High-Strength PU + Marine 316 Stainless Swivel',
      dimensions: 'Panjang 213cm x Tebal 7mm',
      weight_grams: 240,
      normal_price: 285000,
      promo_price: 245000,
      rating: 4.9,
      review_count: 115,
      sold_count: 620,
      tags: ['leash', 'surf leash', 'tali papan selancar', 'urethane'],
      images: [
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-005-BLK', title: 'Stealth Black - 7ft', size: '7ft', color: 'Stealth Black', color_code: '#111111', stock: 45 },
        { sku: 'SKY-SRF-005-CYA', title: 'Cyan Blue - 7ft', size: '7ft', color: 'Cyan Blue', color_code: '#00F5D4', stock: 30 },
        { sku: 'SKY-SRF-005-YEL', title: 'Electric Yellow - 7ft', size: '7ft', color: 'Electric Yellow', color_code: '#FFEE32', stock: 22 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 220000 },
        { min: 10, max: 49, price: 195000 },
        { min: 50, max: null, price: 175000 }
      ]
    },
    {
      sku: 'SKY-SRF-006',
      name: 'Carbon Matrix Thruster Surf Fins (FCS II Compatible)',
      slug: 'carbon-matrix-thruster-surf-fins-fcs2',
      brand_id: 2,
      category_id: 1,
      subcategory_id: 7, // fins
      description: 'Set 3 sirip fins surfboard konstruksi carbon matrix honeycomb untuk flex dan respons putaran cepat di gelombang kencang.',
      short_desc: 'Thruster fin set (3 pcs) Medium Carbon Honeycomb',
      material: 'Hexcore Honeycomb + Carbon Fiber Skin',
      dimensions: 'Base 114mm / Depth 118mm (Size M)',
      weight_grams: 220,
      normal_price: 750000,
      promo_price: 680000,
      rating: 4.9,
      review_count: 64,
      sold_count: 310,
      tags: ['surf fins', 'fcs2', 'thruster', 'carbon fins', 'sirip selancar'],
      images: [
        'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-006-MED', title: 'Size Medium (65-80kg) - Carbon Black', size: 'M', color: 'Carbon Black', color_code: '#1A1A1A', stock: 18 },
        { sku: 'SKY-SRF-006-LRG', title: 'Size Large (75-95kg) - Carbon Black', size: 'L', color: 'Carbon Black', color_code: '#1A1A1A', stock: 14 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 620000 },
        { min: 10, max: null, price: 560000 }
      ]
    },
    {
      sku: 'SKY-SRF-007',
      name: 'EcoTropic Organic Surf Wax (Pack of 3 + Comb)',
      slug: 'ecotropic-organic-surf-wax-pack-of-3',
      brand_id: 2,
      category_id: 1,
      subcategory_id: 8, // surf wax
      description: 'Lilin selancar ramah terumbu karang 100% beeswax alami dengan aroma kelapa tropis. Diformulasikan khusus untuk suhu air hangat khatulistiwa Indonesia 24-30C.',
      short_desc: 'Wax tropis anti-licin 3x 85g + sisir wax comb',
      material: 'Organic Beeswax & Coconut Oil',
      dimensions: '3x 85 gram',
      weight_grams: 300,
      normal_price: 135000,
      promo_price: 115000,
      rating: 4.8,
      review_count: 98,
      sold_count: 850,
      tags: ['surf wax', 'wax tropis', 'lilin selancar', 'organic wax'],
      images: [
        'https://images.unsplash.com/photo-1520116468418-095984ab175d?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-007-TRP', title: 'Tropical Warm (Air >24°C)', size: '3x 85g', color: 'Natural White', color_code: '#FDFBF7', stock: 85 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 105000 },
        { min: 10, max: 49, price: 95000 },
        { min: 50, max: null, price: 80000 }
      ]
    },
    {
      sku: 'SKY-SRF-008',
      name: 'ArmorFlight 10mm Heavy Duty Surfboard Travel Bag 6\'6"',
      slug: 'armorflight-heavy-duty-surfboard-bag-66',
      brand_id: 1,
      category_id: 1,
      subcategory_id: 9, // surf bag
      description: 'Tas pelindung papan selancar penerbangan dengan busa tebal 10mm high-density, lapisan reflektif perak tahan panas matahari pantai, dan resleting anti karat marine zipper.',
      short_desc: 'Tas travel surfboard 6\'6" bantalan 10mm UV reflective',
      material: '600D Ripstop Polyester + 10mm EPE Foam + Tarpee Heat Shield',
      dimensions: '205cm x 60cm',
      weight_grams: 2100,
      normal_price: 1250000,
      promo_price: 1100000,
      rating: 4.9,
      review_count: 42,
      sold_count: 135,
      tags: ['surf bag', 'board bag', 'sarung papan selancar', 'tas travel surf'],
      images: [
        'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-008-SLV', title: 'Silver Reflective / Charcoal', size: '6\'6"', color: 'Silver/Charcoal', color_code: '#A0AAB2', stock: 15 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 990000 },
        { min: 6, max: null, price: 920000 }
      ]
    },
    {
      sku: 'SKY-SRF-009',
      name: 'OceanShield UPF 50+ Performance Surf Rash Guard',
      slug: 'oceanshield-upf50-performance-surf-rash-guard',
      brand_id: 1,
      category_id: 1,
      subcategory_id: 10, // rashguard
      description: 'Baju selancar rash guard lengan panjang anti gores karang dan perlindungan UV maksimum UPF 50+. Bahan cepat kering, jahitan flatlock tanpa gesekan di ketiak.',
      short_desc: 'Rash guard lengan panjang UPF 50+ stretch 4 arah',
      material: '85% Recycled Ocean Poly + 15% Spandex (220 GSM)',
      dimensions: 'Size S, M, L, XL, XXL',
      weight_grams: 220,
      normal_price: 295000,
      promo_price: 245000,
      rating: 4.8,
      review_count: 140,
      sold_count: 720,
      tags: ['rash guard', 'baju surfing', 'upf50', 'baju pantai pria'],
      images: [
        'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800',
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-009-NVY-S', title: 'Deep Navy - Size S', size: 'S', color: 'Deep Navy', color_code: '#001F3F', stock: 20 },
        { sku: 'SKY-SRF-009-NVY-M', title: 'Deep Navy - Size M', size: 'M', color: 'Deep Navy', color_code: '#001F3F', stock: 25 },
        { sku: 'SKY-SRF-009-NVY-L', title: 'Deep Navy - Size L', size: 'L', color: 'Deep Navy', color_code: '#001F3F', stock: 30 },
        { sku: 'SKY-SRF-009-NVY-XL', title: 'Deep Navy - Size XL', size: 'XL', color: 'Deep Navy', color_code: '#001F3F', stock: 15 },
        { sku: 'SKY-SRF-009-BLK-M', title: 'Stealth Black - Size M', size: 'M', color: 'Stealth Black', color_code: '#111111', stock: 25 },
        { sku: 'SKY-SRF-009-BLK-L', title: 'Stealth Black - Size L', size: 'L', color: 'Stealth Black', color_code: '#111111', stock: 35 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 215000 },
        { min: 10, max: 49, price: 185000 },
        { min: 50, max: null, price: 160000 }
      ]
    },
    {
      sku: 'SKY-SRF-010',
      name: 'Vortex 2/2mm Chest-Zip Shorty Wetsuit',
      slug: 'vortex-22mm-chest-zip-shorty-wetsuit',
      brand_id: 2,
      category_id: 1,
      subcategory_id: 11, // wetsuit
      description: 'Wetsuit pendek 2mm bahan neoprene Yamamoto super fleksibel dengan chest-zip seal kedap air. Menjaga suhu tubuh hangat saat sesi surfing subuh atau angin lepas pantai.',
      short_desc: 'Wetsuit shorty 2/2mm Yamamoto Neoprene chest-zip',
      material: '100% Ultra-Stretch Yamamoto Limestone Neoprene',
      dimensions: 'Size S, M, L, XL',
      weight_grams: 850,
      normal_price: 1850000,
      promo_price: 1650000,
      rating: 4.9,
      review_count: 31,
      sold_count: 94,
      tags: ['wetsuit', 'shorty', 'surf wetsuit', 'yamamoto', 'chest zip'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-SRF-010-M', title: 'Stealth Charcoal - M', size: 'M', color: 'Stealth Charcoal', color_code: '#2B2D42', stock: 8 },
        { sku: 'SKY-SRF-010-L', title: 'Stealth Charcoal - L', size: 'L', color: 'Stealth Charcoal', color_code: '#2B2D42', stock: 10 },
        { sku: 'SKY-SRF-010-XL', title: 'Stealth Charcoal - XL', size: 'XL', color: 'Stealth Charcoal', color_code: '#2B2D42', stock: 6 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 1520000 },
        { min: 6, max: null, price: 1400000 }
      ]
    },

    // --- 2. SWIMMING (cat_id: 2) ---
    {
      sku: 'SKY-SWM-001',
      name: 'HydroSpeed Competition Racing Swim Jammer',
      slug: 'hydrospeed-competition-racing-swim-jammer',
      brand_id: 4, // HydroSpeed
      category_id: 2,
      subcategory_id: 12, // swimwear
      description: 'Celana renang jammer pria kompetisi dengan teknologi kompresi otot dan lapisan hydrophobic tahan klorin kolam renang.',
      short_desc: 'Jammer renang atlet anti klorin FINA Approved standard',
      material: '80% Polyamide + 20% Elastane Water Repellent',
      dimensions: 'Size 28, 30, 32, 34',
      weight_grams: 160,
      normal_price: 450000,
      promo_price: 395000,
      rating: 4.8,
      review_count: 67,
      sold_count: 320,
      tags: ['swimwear', 'jammer renang', 'celana renang pria', 'fina'],
      images: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
      ],
      variants: [
        { sku: 'SKY-SWM-001-30', title: 'Cosmic Blue - Size 30', size: '30', color: 'Cosmic Blue', color_code: '#03045E', stock: 15 },
        { sku: 'SKY-SWM-001-32', title: 'Cosmic Blue - Size 32', size: '32', color: 'Cosmic Blue', color_code: '#03045E', stock: 20 },
        { sku: 'SKY-SWM-001-34', title: 'Cosmic Blue - Size 34', size: '34', color: 'Cosmic Blue', color_code: '#03045E', stock: 12 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 345000 },
        { min: 10, max: 49, price: 310000 },
        { min: 50, max: null, price: 275000 }
      ]
    },
    {
      sku: 'SKY-SWM-002',
      name: 'AquaVision Panoramic Mirrored Racing Goggles',
      slug: 'aquavision-panoramic-mirrored-racing-goggles',
      brand_id: 4,
      category_id: 2,
      subcategory_id: 13, // swimming-goggles
      description: 'Kacamata renang lensa cermin anti embun (anti-fog) dengan sudut pandang lebar 180 derajat dan perlindungan UV400 untuk renang indoor maupun laut terbuka (open water).',
      short_desc: 'Kacamata renang mirrored anti-fog + UV400 sudut 180°',
      material: 'Polycarbonate Mirrored Lens + Liquid Silicone Gasket',
      dimensions: 'Adjustable Nose Bridge (3 sizes included)',
      weight_grams: 110,
      normal_price: 320000,
      promo_price: 275000,
      rating: 4.9,
      review_count: 185,
      sold_count: 940,
      tags: ['kacamata renang', 'swimming goggles', 'mirrored goggles', 'open water'],
      images: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
      ],
      variants: [
        { sku: 'SKY-SWM-002-GLD', title: 'Titanium Gold Mirror', size: 'One Size', color: 'Titanium Gold', color_code: '#D4AF37', stock: 45 },
        { sku: 'SKY-SWM-002-SLV', title: 'Chrome Silver Mirror', size: 'One Size', color: 'Chrome Silver', color_code: '#C0C0C0', stock: 50 },
        { sku: 'SKY-SWM-002-BLU', title: 'Deep Ocean Blue Mirror', size: 'One Size', color: 'Ocean Blue', color_code: '#0077B6', stock: 35 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 245000 },
        { min: 10, max: 49, price: 215000 },
        { min: 50, max: null, price: 185000 }
      ]
    },
    {
      sku: 'SKY-SWM-003',
      name: 'AeroDome 3D Ergonomic Silicone Swim Cap',
      slug: 'aerodome-3d-silicone-swim-cap',
      brand_id: 4,
      category_id: 2,
      subcategory_id: 14, // swimming-cap
      description: 'Topi renang silikon cetak 3D mulus tanpa lipatan untuk mengurangi resistensi air secara signifikan dan melindungi rambut dari klorin.',
      short_desc: 'Topi renang silikon 3D tanpa kerut elastis tahan air',
      material: '100% Hypoallergenic High-Density Silicone',
      dimensions: 'Universal Adult Fit',
      weight_grams: 80,
      normal_price: 110000,
      promo_price: 89000,
      rating: 4.7,
      review_count: 112,
      sold_count: 670,
      tags: ['topi renang', 'swim cap', 'silicone cap', 'renang atlet'],
      images: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
      ],
      variants: [
        { sku: 'SKY-SWM-003-BLK', title: 'Pure Black', size: 'Adult', color: 'Pure Black', color_code: '#000000', stock: 50 },
        { sku: 'SKY-SWM-003-WHT', title: 'Arctic White', size: 'Adult', color: 'Arctic White', color_code: '#FFFFFF', stock: 40 },
        { sku: 'SKY-SWM-003-PNK', title: 'Neon Pink', size: 'Adult', color: 'Neon Pink', color_code: '#FF007F', stock: 25 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 79000 },
        { min: 10, max: 49, price: 68000 },
        { min: 50, max: null, price: 55000 }
      ]
    },
    {
      sku: 'SKY-SWM-004',
      name: 'HydroPro Dual-Grip Training Kickboard',
      slug: 'hydropro-dual-grip-training-kickboard',
      brand_id: 4,
      category_id: 2,
      subcategory_id: 15, // kickboard
      description: 'Papan pelampung latihan kayuhan kaki renang dengan dua lubang pegangan ergonomis dan bentuk hidrodinamis dari busa EVA premium.',
      short_desc: 'Papan pelampung renang EVA dual-grip latihan kaki',
      material: 'High-Density Closed Cell EVA Foam',
      dimensions: '44cm x 29cm x 3.5cm',
      weight_grams: 280,
      normal_price: 185000,
      promo_price: 155000,
      rating: 4.8,
      review_count: 75,
      sold_count: 410,
      tags: ['kickboard', 'papan renang', 'pelampung renang', 'latihan kaki'],
      images: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
      ],
      variants: [
        { sku: 'SKY-SWM-004-BLU', title: 'Royal Blue & Yellow', size: 'Standard', color: 'Royal Blue', color_code: '#023E8A', stock: 35 },
        { sku: 'SKY-SWM-004-LME', title: 'Electric Lime', size: 'Standard', color: 'Electric Lime', color_code: '#70E000', stock: 25 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 139000 },
        { min: 10, max: 49, price: 120000 },
        { min: 50, max: null, price: 105000 }
      ]
    },
    {
      sku: 'SKY-SWM-005',
      name: 'ProStroke Short Blade Training Swimming Fins',
      slug: 'prostroke-short-blade-training-fins',
      brand_id: 4,
      category_id: 2,
      subcategory_id: 17, // swimming-fins
      description: 'Kaki katak pendek silikon lembut untuk melatih kekuatan kayuhan kaki dan frekuensi ayunan cepat tanpa membebani persendian lutut.',
      short_desc: 'Kaki katak pendek latihan renang 100% natural silicone',
      material: '100% Soft Elastic Natural Silicone',
      dimensions: 'Sizes 36-45',
      weight_grams: 650,
      normal_price: 480000,
      promo_price: 420000,
      rating: 4.9,
      review_count: 88,
      sold_count: 360,
      tags: ['kaki katak renang', 'swimming fins', 'short fins', 'fin renang'],
      images: [
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
      ],
      variants: [
        { sku: 'SKY-SWM-005-S', title: 'Size S (EU 36-38) - Aqua', size: 'S (36-38)', color: 'Aqua', color_code: '#00B4D8', stock: 18 },
        { sku: 'SKY-SWM-005-M', title: 'Size M (EU 39-41) - Aqua', size: 'M (39-41)', color: 'Aqua', color_code: '#00B4D8', stock: 22 },
        { sku: 'SKY-SWM-005-L', title: 'Size L (EU 42-44) - Aqua', size: 'L (42-44)', color: 'Aqua', color_code: '#00B4D8', stock: 20 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 375000 },
        { min: 10, max: 49, price: 340000 },
        { min: 50, max: null, price: 300000 }
      ]
    },

    // --- 3. DIVING & SNORKELING (cat_id: 3) ---
    {
      sku: 'SKY-DIV-001',
      name: 'Abyss Stealth Panoramic Frameless Diving Mask',
      slug: 'abyss-stealth-frameless-diving-mask',
      brand_id: 3, // ScubaTech
      category_id: 3,
      subcategory_id: 19, // diving-mask
      description: 'Masker selam diving frameless dengan kaca tempered ultra-clear berprofil rendah (low volume) dan silikon liquid lembut Jepang yang menempel kedap di wajah tanpa meninggalkan bekas merah.',
      short_desc: 'Masker selam frameless low-volume kaca tempered ultra-clear',
      material: 'Japanese Liquid Silicone Skirt + Ultra-Clear Tempered Glass',
      dimensions: 'Low Volume 125ml internal',
      weight_grams: 220,
      normal_price: 650000,
      promo_price: 580000,
      is_featured: 1,
      rating: 5.0,
      review_count: 92,
      sold_count: 480,
      tags: ['diving mask', 'masker selam', 'frameless mask', 'scuba mask', 'snorkeling mask'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-001-BLK', title: 'Matte Stealth Black', size: 'Universal Adult', color: 'Stealth Black', color_code: '#111111', stock: 35 },
        { sku: 'SKY-DIV-001-CLR', title: 'Crystal Clear / Aqua Blue', size: 'Universal Adult', color: 'Crystal Clear', color_code: '#CAF0F8', stock: 25 },
        { sku: 'SKY-DIV-001-WHT', title: 'Arctic White Silicone', size: 'Universal Adult', color: 'Arctic White', color_code: '#FFFFFF', stock: 20 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 510000 },
        { min: 10, max: 49, price: 460000 },
        { min: 50, max: null, price: 395000 }
      ]
    },
    {
      sku: 'SKY-DIV-002',
      name: 'DryFlow 100% Submersible Dry Snorkel with Purge Valve',
      slug: 'dryflow-submersible-dry-snorkel-purge-valve',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 20, // snorkel
      description: 'Pipa snorkel katup kering otomatis yang menutup seketika saat menyelam ke dalam air, dilengkapi katup buang (purge valve) bawah untuk menguras air sisa dengan sekali hembusan lembut.',
      short_desc: 'Dry snorkel katup otomatis 100% anti masuk air + purge valve',
      material: 'Food-Grade Silicone Mouthpiece + Corrugated Tube',
      dimensions: 'Panjang 45cm',
      weight_grams: 180,
      normal_price: 260000,
      promo_price: 215000,
      rating: 4.8,
      review_count: 130,
      sold_count: 820,
      tags: ['snorkel', 'dry snorkel', 'pipa napas snorkeling', 'alat selam'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-002-BLK', title: 'All Black Silicone', size: 'Adult', color: 'Black', color_code: '#000000', stock: 40 },
        { sku: 'SKY-DIV-002-BLU', title: 'Ocean Blue', size: 'Adult', color: 'Ocean Blue', color_code: '#0077B6', stock: 30 },
        { sku: 'SKY-DIV-002-YEL', title: 'High-Vis Safety Yellow', size: 'Adult', color: 'Hi-Vis Yellow', color_code: '#FFFF00', stock: 25 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 185000 },
        { min: 10, max: 49, price: 165000 },
        { min: 50, max: null, price: 140000 }
      ]
    },
    {
      sku: 'SKY-DIV-003',
      name: 'OceanViper Open Heel Scuba Fins with Stainless Spring Straps',
      slug: 'oceanviper-open-heel-scuba-fins-spring-straps',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 21, // diving-fins
      description: 'Sirip selam scuba open-heel bertenaga tinggi dengan kanal ventilasi air dinamis dan tali pegas baja anti karat untuk kemudahan pemakaian sekali sentak di kapal goyang.',
      short_desc: 'Open heel scuba fins channel flow + spring heel strap 316',
      material: 'Dual-Composite Monprene + Marine Stainless Steel Springs',
      dimensions: 'Blade Length 62cm (Size L)',
      weight_grams: 1950,
      normal_price: 1850000,
      promo_price: 1680000,
      rating: 4.9,
      review_count: 48,
      sold_count: 175,
      tags: ['diving fins', 'scuba fins', 'fin selam', 'open heel', 'spring strap'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-003-M', title: 'Size M (Bootie 39-41) - Yellow/Black', size: 'M', color: 'Yellow/Black', color_code: '#FFCC00', stock: 10 },
        { sku: 'SKY-DIV-003-L', title: 'Size L (Bootie 42-44) - Stealth Black', size: 'L', color: 'Stealth Black', color_code: '#111111', stock: 15 },
        { sku: 'SKY-DIV-003-XL', title: 'Size XL (Bootie 44-46) - Stealth Black', size: 'XL', color: 'Stealth Black', color_code: '#111111', stock: 8 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 1550000 },
        { min: 6, max: null, price: 1420000 }
      ]
    },
    {
      sku: 'SKY-DIV-004',
      name: 'Titanium-Lined 3mm Full Scuba Diving Wetsuit',
      slug: 'titanium-lined-3mm-full-scuba-diving-wetsuit',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 22, // dive-wetsuit
      description: 'Baju selam panjang 3mm dengan lapisan termal titanium reflektif panas tubuh, bantalan lutut supratex tahan gores karang, dan resleting YKK punggung dengan puller panjang.',
      short_desc: 'Wetsuit panjang selam 3mm termal titanium reflektif + Supratex knee',
      material: 'Neoprene 3mm CR + Titanium Thermal Lining + Supratex',
      dimensions: 'Size S, M, L, XL, XXL',
      weight_grams: 1400,
      normal_price: 2450000,
      promo_price: 2150000,
      rating: 4.9,
      review_count: 56,
      sold_count: 180,
      tags: ['wetsuit selam', 'diving wetsuit', '3mm wetsuit', 'scuba gear'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-004-M', title: 'Black / Ocean Blue - M', size: 'M', color: 'Blue/Black', color_code: '#0077B6', stock: 12 },
        { sku: 'SKY-DIV-004-L', title: 'Black / Ocean Blue - L', size: 'L', color: 'Blue/Black', color_code: '#0077B6', stock: 18 },
        { sku: 'SKY-DIV-004-XL', title: 'Black / Ocean Blue - XL', size: 'XL', color: 'Blue/Black', color_code: '#0077B6', stock: 10 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 1950000 },
        { min: 6, max: null, price: 1780000 }
      ]
    },
    {
      sku: 'SKY-DIV-005',
      name: 'AeroFloat Weight-Integrated Scuba BCD Vest',
      slug: 'aerofloat-weight-integrated-scuba-bcd-vest',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 23, // bcd
      description: 'Rompi apung penyelam (Buoyancy Control Device) dengan kantong pemberat terintegrasi quick-release, bahan Cordura 1000D tangguh, dan inflator power presisi.',
      short_desc: 'BCD Scuba Cordura 1000D integrated weight quick release',
      material: '1000 Denier Cordura Nylon + Heavy Duty Marine Valves',
      dimensions: 'Lift Capacity 35 lbs (15.8 kg)',
      weight_grams: 3400,
      normal_price: 7200000,
      promo_price: 6600000,
      rating: 5.0,
      review_count: 22,
      sold_count: 54,
      tags: ['bcd', 'scuba bcd', 'rompi selam', 'buoyancy compensator'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-005-M', title: 'Size M - Lift 32lbs', size: 'M', color: 'Charcoal Black', color_code: '#1F2421', stock: 4 },
        { sku: 'SKY-DIV-005-L', title: 'Size L - Lift 38lbs', size: 'L', color: 'Charcoal Black', color_code: '#1F2421', stock: 5 }
      ],
      wholesale: [
        { min: 2, max: null, price: 6100000 }
      ]
    },
    {
      sku: 'SKY-DIV-006',
      name: 'DeepPulse Wireless Air-Integrated OLED Dive Computer',
      slug: 'deeppulse-wireless-oled-dive-computer',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 25, // dive-computer
      description: 'Komputer selam pintar berlayar OLED warna cerah definisi tinggi dengan pemantauan tekanan tabung nirkabel (wireless transmitter), algoritma Bühlmann ZHL-16C, dan koneksi Bluetooth logbook.',
      short_desc: 'Dive computer OLED warna cerah + Bluetooth + kompas digital 3D',
      material: 'Marine Grade Aluminum Bezel + Sapphire Crystal Glass',
      dimensions: 'Dial 48mm / Tebal 15mm / Kedalaman hingga 150m',
      weight_grams: 140,
      normal_price: 12500000,
      promo_price: 11200000,
      is_featured: 1,
      rating: 5.0,
      review_count: 18,
      sold_count: 42,
      tags: ['dive computer', 'komputer selam', 'oled dive watch', 'scuba tech'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-006-SET', title: 'DeepPulse Watch + Tank Transmitter Pod', size: 'Standard', color: 'Titanium Grey', color_code: '#5C677D', stock: 6 }
      ],
      wholesale: [
        { min: 2, max: null, price: 10500000 }
      ]
    },
    {
      sku: 'SKY-DIV-007',
      name: 'AquaLumen 3500LM Underwater Video & Dive Torch IPX8',
      slug: 'aqualumen-3500lm-underwater-dive-torch-ipx8',
      brand_id: 3,
      category_id: 3,
      subcategory_id: 26, // dive-light
      description: 'Senter selam tahan kedalaman 100 meter berkekuatan 3500 lumen dengan sudut sorot ganda (spot 12° & flood video 120°), baterai rechargeable 21700 tahan 4 jam.',
      short_desc: 'Senter diving 3500 Lumen waterproof 100M dual beam CRI 90+',
      material: 'Aviation Aluminum Hard Anodized Type III',
      dimensions: 'Panjang 14.5cm x Diameter Kepala 4.2cm',
      weight_grams: 320,
      normal_price: 1450000,
      promo_price: 1280000,
      rating: 4.9,
      review_count: 44,
      sold_count: 160,
      tags: ['dive light', 'senter selam', 'senter diving', 'underwater torch'],
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
      ],
      variants: [
        { sku: 'SKY-DIV-007-BLK', title: 'Anodized Black - Full Kit (Baterai + Charger)', size: 'Standard', color: 'Anodized Black', color_code: '#1E1E1E', stock: 16 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 1150000 },
        { min: 6, max: null, price: 1050000 }
      ]
    },

    // --- 4. WATERSPORTS & KAYAK (cat_id: 4) ---
    {
      sku: 'SKY-WTR-001',
      name: 'SafeTide ISO 12402-5 Certified Offshore Life Jacket',
      slug: 'safetide-iso-certified-offshore-life-jacket',
      brand_id: 1, // Skyra Pro
      category_id: 4,
      subcategory_id: 27, // life-jacket
      description: 'Rompi pelampung keselamatan bersertifikasi ISO 12402-5 daya apung 70N dengan 4 sabuk pengaman heavy-duty, peluit darurat kelautan, strip reflektif SOLAS, dan busa apung EPE berlapis.',
      short_desc: 'Rompi pelampung ISO 70N peluit darurat + reflektif SOLAS',
      material: 'Ripstop 420D Oxford Fabric + Multi-Layer EPE Marine Foam',
      dimensions: 'Sizes M, L, XL (Daya apung 70N - 90kg+)',
      weight_grams: 780,
      normal_price: 480000,
      promo_price: 410000,
      rating: 4.9,
      review_count: 155,
      sold_count: 980,
      tags: ['life jacket', 'rompi pelampung', 'pelampung keselamatan', 'watersports vest', 'iso certified'],
      images: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'
      ],
      variants: [
        { sku: 'SKY-WTR-001-ORG-M', title: 'Hi-Vis Safety Orange - M (50-70kg)', size: 'M', color: 'Safety Orange', color_code: '#FF5400', stock: 30 },
        { sku: 'SKY-WTR-001-ORG-L', title: 'Hi-Vis Safety Orange - L (70-90kg)', size: 'L', color: 'Safety Orange', color_code: '#FF5400', stock: 40 },
        { sku: 'SKY-WTR-001-ORG-XL', title: 'Hi-Vis Safety Orange - XL (>90kg)', size: 'XL', color: 'Safety Orange', color_code: '#FF5400', stock: 25 },
        { sku: 'SKY-WTR-001-BLU-L', title: 'Marine Royal Blue - L (70-90kg)', size: 'L', color: 'Marine Blue', color_code: '#0077B6', stock: 35 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 360000 },
        { min: 10, max: 49, price: 320000 },
        { min: 50, max: null, price: 285000 }
      ]
    },
    {
      sku: 'SKY-WTR-002',
      name: 'Skyra Explorer Inflatable Stand Up Paddle Board 10\'6"',
      slug: 'skyra-explorer-inflatable-sup-106',
      brand_id: 1,
      category_id: 4,
      subcategory_id: 28, // paddle-board
      description: 'Paket lengkap Stand Up Paddle Board tiup drop-stitch fusion ultra-kaku (hingga 18 PSI). Termasuk dayung aluminium lipat 3, pompa double action, tali leash spiral, fin lepas-pasang, dan ransel carry bag.',
      short_desc: 'SUP tiup lengkap 10\'6" military drop-stitch + dayung + pompa + ransel',
      material: 'Military Grade Dual-Layer Fusion Drop-Stitch PVC',
      dimensions: '320cm x 81cm x 15cm (Kapasitas beban 150kg)',
      weight_grams: 8800,
      normal_price: 5800000,
      promo_price: 4950000,
      is_featured: 1,
      is_flash_sale: 1,
      flash_sale_discount_percent: 15,
      rating: 5.0,
      review_count: 48,
      sold_count: 145,
      tags: ['sup', 'stand up paddle board', 'paddle board', 'inflatable sup', 'watersports'],
      images: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-WTR-002-TUR', title: 'Turquoise Lagoon / White - Full Package', size: '10\'6"', color: 'Turquoise', color_code: '#2EC4B6', stock: 8 },
        { sku: 'SKY-WTR-002-SUN', title: 'Sunset Coral / Sand - Full Package', size: '10\'6"', color: 'Coral', color_code: '#FF6B6B', stock: 6 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 4450000 },
        { min: 6, max: null, price: 4100000 }
      ]
    },
    {
      sku: 'SKY-WTR-003',
      name: 'DryArmor 30L Waterproof Backpack Dry Bag with Roll-Top',
      slug: 'dryarmor-30l-waterproof-backpack-dry-bag',
      brand_id: 1,
      category_id: 4,
      subcategory_id: 30, // dry-bag
      description: 'Tas ransel kedap air 100% IPX6 dengan sistem penutup roll-top, tali bahu empuk breathable, dan saku jaring samping untuk botol minum. Melindungi gadget, baju, dan kamera dari cipratan ombak dan hujan deras.',
      short_desc: 'Dry bag ransel kedap air 30L PVC 500D tarpaulin anti rembes',
      material: '500D Heavy Duty PVC Tarpaulin Seamless High-Frequency Welded',
      dimensions: 'Kapasitas 30 Liter (Tinggi 68cm x Diameter 26cm)',
      weight_grams: 850,
      normal_price: 360000,
      promo_price: 295000,
      rating: 4.8,
      review_count: 210,
      sold_count: 1250,
      tags: ['dry bag', 'tas kedap air', 'waterproof bag', 'tas anti air', 'kayak bag'],
      images: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'
      ],
      variants: [
        { sku: 'SKY-WTR-003-YEL', title: 'High-Vis Yellow - 30L', size: '30L', color: 'Hi-Vis Yellow', color_code: '#FFD60A', stock: 35 },
        { sku: 'SKY-WTR-003-BLK', title: 'Matte Stealth Black - 30L', size: '30L', color: 'Matte Black', color_code: '#111111', stock: 45 },
        { sku: 'SKY-WTR-003-BLU', title: 'Cyan Marine - 30L', size: '30L', color: 'Cyan Marine', color_code: '#0096C7', stock: 30 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 260000 },
        { min: 10, max: 49, price: 230000 },
        { min: 50, max: null, price: 198000 }
      ]
    },
    {
      sku: 'SKY-WTR-004',
      name: 'AquaTrek Ergonomic Quick-Dry Grip Water Shoes',
      slug: 'aquatrek-ergonomic-quick-dry-water-shoes',
      brand_id: 1,
      category_id: 4,
      subcategory_id: 31, // water-shoes
      description: 'Sepatu air amfibi dengan sol karet bergerigi anti licin dan lubang drainase air cepat di telapak kaki. Melindungi telapak kaki dari karang tajam, bulu babi, dan batu licin.',
      short_desc: 'Sepatu air anti licin pelindung karang sol karet drainase cepat',
      material: 'Breathable Stretch Mesh + Slip-Resistant Rubber Sole',
      dimensions: 'Sizes EU 38-45',
      weight_grams: 380,
      normal_price: 245000,
      promo_price: 195000,
      rating: 4.8,
      review_count: 165,
      sold_count: 880,
      tags: ['water shoes', 'sepatu pantai', 'sepatu karang', 'sepatu diving', 'aqua shoes'],
      images: [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'
      ],
      variants: [
        { sku: 'SKY-WTR-004-39', title: 'Graphite Black - Size 39', size: '39', color: 'Graphite Black', color_code: '#2B2D42', stock: 15 },
        { sku: 'SKY-WTR-004-40', title: 'Graphite Black - Size 40', size: '40', color: 'Graphite Black', color_code: '#2B2D42', stock: 25 },
        { sku: 'SKY-WTR-004-41', title: 'Graphite Black - Size 41', size: '41', color: 'Graphite Black', color_code: '#2B2D42', stock: 30 },
        { sku: 'SKY-WTR-004-42', title: 'Graphite Black - Size 42', size: '42', color: 'Graphite Black', color_code: '#2B2D42', stock: 28 },
        { sku: 'SKY-WTR-004-43', title: 'Graphite Black - Size 43', size: '43', color: 'Graphite Black', color_code: '#2B2D42', stock: 20 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 175000 },
        { min: 10, max: 49, price: 155000 },
        { min: 50, max: null, price: 135000 }
      ]
    },

    // --- 5. BEACH & COASTAL LIFE (cat_id: 5) ---
    {
      sku: 'SKY-BCH-001',
      name: 'Solara Breeze UPF50+ Pop-Up Beach Cabana Tent',
      slug: 'solara-breeze-upf50-pop-up-beach-tent',
      brand_id: 5, // Solara
      category_id: 5,
      subcategory_id: 32, // beach-tent
      description: 'Tenda pantai otomatis pop-up 3 detik dengan lapisan UV silver UPF 50+, sirkulasi angin ventilasi 3 sisi, kantong pasir penahan angin kencang pantai, dan pasak baja.',
      short_desc: 'Tenda pantai pop-up 3-4 orang UPF 50+ tahan angin pantai',
      material: '190T Silver-Coated UV Polyester + Fiberglass Frame',
      dimensions: '220cm x 150cm x 130cm (Muat 3-4 Dewasa)',
      weight_grams: 1900,
      normal_price: 650000,
      promo_price: 540000,
      is_featured: 1,
      rating: 4.9,
      review_count: 85,
      sold_count: 360,
      tags: ['tenda pantai', 'beach tent', 'pop up tent', 'upf50', 'solara beach'],
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-BCH-001-AQU', title: 'Aqua Azure & Sand Grey', size: 'Family (3-4 Orang)', color: 'Aqua Azure', color_code: '#48CAE4', stock: 15 },
        { sku: 'SKY-BCH-001-COR', title: 'Coral Reef Sunset', size: 'Family (3-4 Orang)', color: 'Coral Reef', color_code: '#F77F00', stock: 10 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 480000 },
        { min: 6, max: null, price: 440000 }
      ]
    },
    {
      sku: 'SKY-BCH-002',
      name: 'WindShield 7ft Tilt Heavy-Duty Beach Umbrella with Sand Anchor',
      slug: 'windshield-7ft-beach-umbrella-sand-anchor',
      brand_id: 5,
      category_id: 5,
      subcategory_id: 33, // beach-umbrella
      description: 'Payung pantai diameter 2.1 meter dengan tiang aluminium tebal dan ulir sekrup pasir (sand anchor) bawaan agar tidak terbang saat tertiup angin kencang laut.',
      short_desc: 'Payung pantai diameter 7ft (2.1m) + sekrup jangkar pasir built-in',
      material: '160G Polyester UV Resistant + 32mm Rustproof Aluminum Pole',
      dimensions: 'Diameter Kanopi 210cm x Tinggi 220cm',
      weight_grams: 2400,
      normal_price: 520000,
      promo_price: 450000,
      rating: 4.8,
      review_count: 62,
      sold_count: 240,
      tags: ['payung pantai', 'beach umbrella', 'payung uv', 'sand anchor'],
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-BCH-002-BLU', title: 'Nautical Navy & White Stripes', size: '7ft (2.1m)', color: 'Navy Stripes', color_code: '#1D3557', stock: 18 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 395000 },
        { min: 6, max: null, price: 360000 }
      ]
    },
    {
      sku: 'SKY-BCH-003',
      name: 'SandFree Micro-Weave Beach Mat Blanket (200x210cm)',
      slug: 'sandfree-micro-weave-beach-mat-blanket',
      brand_id: 5,
      category_id: 5,
      subcategory_id: 34, // beachwear/acc
      description: 'Tikar pantai bebas pasir revolusioner di mana pasir yang menempel langsung jatuh ke bawah tanpa meresap kembali ke atas. Sangat ringan, cepat kering, dan dilengkapi 4 kantong sudut.',
      short_desc: 'Tikar pantai anti nempel pasir 200x210cm ultra-ringan',
      material: 'Dual-Layer Parachute Nylon Sand-Sifting Weave',
      dimensions: '200cm x 210cm (Lipat ke saku 15x20cm)',
      weight_grams: 350,
      normal_price: 180000,
      promo_price: 145000,
      rating: 4.8,
      review_count: 140,
      sold_count: 760,
      tags: ['tikar pantai', 'beach mat', 'sand free blanket', 'alas santai pantai'],
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-BCH-003-SEA', title: 'Sea Blue & Slate Grey', size: '200x210cm', color: 'Sea Blue', color_code: '#0077B6', stock: 40 },
        { sku: 'SKY-BCH-003-MNT', title: 'Mint Green & Sand', size: '200x210cm', color: 'Mint Green', color_code: '#80ED99', stock: 30 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 129000 },
        { min: 10, max: 49, price: 110000 },
        { min: 50, max: null, price: 95000 }
      ]
    },

    // --- 6. MARINE & SEA EQUIPMENT (cat_id: 6) ---
    {
      sku: 'SKY-MAR-001',
      name: 'SOLAS Approved High-Visibility Marine Lifebuoy Ring 30"',
      slug: 'solas-marine-lifebuoy-ring-30',
      brand_id: 6, // Nautica Armor
      category_id: 6,
      subcategory_id: 36, // marine-safety
      description: 'Ban pelampung keselamatan kapal berstandar internasional SOLAS / IMO 74/96 dengan pita reflektif 4 titik dan tali pegang keliling 30 meter. Wajib untuk kapal komersial, yacht, dermaga, dan resort perairan.',
      short_desc: 'Pelampung ring SOLAS 30" diameter 75cm berat 2.5kg kapal laut',
      material: 'High-Density Polyethylene (HDPE) + Polyurethane Foam Core',
      dimensions: 'Outer 75cm / Inner 45cm (2.5kg)',
      weight_grams: 2500,
      normal_price: 850000,
      promo_price: 750000,
      is_featured: 1,
      rating: 5.0,
      review_count: 42,
      sold_count: 195,
      tags: ['lifebuoy', 'ban pelampung kapal', 'solas', 'keselamatan laut', 'marine safety'],
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'
      ],
      variants: [
        { sku: 'SKY-MAR-001-ORG', title: 'Safety Orange SOLAS Ring (2.5kg)', size: '30" (75cm)', color: 'Safety Orange', color_code: '#FF4800', stock: 24 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 680000 },
        { min: 6, max: null, price: 620000 }
      ]
    },
    {
      sku: 'SKY-MAR-002',
      name: 'Braided Marine Grade Double-Braid Dock Mooring Rope 15m (12mm)',
      slug: 'marine-double-braid-dock-mooring-rope-15m',
      brand_id: 6,
      category_id: 6,
      subcategory_id: 37, // marine-rope
      description: 'Tali tambat kapal double-braided nylon marine dengan anyaman peredam kejutan gelombang dan mata simpul spliced eye loop 30cm terlindung. Tahan jamur, air asin, dan sinar matahari UV.',
      short_desc: 'Tali kapal 12mm x 15m double-braid nylon shock absorbing',
      material: '100% High-Tenacity Marine Nylon (Breaking Strain 2,900 kg)',
      dimensions: 'Diameter 12mm x Panjang 15 meter',
      weight_grams: 1800,
      normal_price: 450000,
      promo_price: 390000,
      rating: 4.9,
      review_count: 58,
      sold_count: 310,
      tags: ['tali kapal', 'mooring rope', 'tali tambat', 'marine rope', 'nylon rope'],
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'
      ],
      variants: [
        { sku: 'SKY-MAR-002-NVY', title: 'Navy Blue with Gold Tracer - 15m', size: '12mm x 15m', color: 'Navy Blue', color_code: '#03045E', stock: 35 },
        { sku: 'SKY-MAR-002-BLK', title: 'Solid Black - 15m', size: '12mm x 15m', color: 'Solid Black', color_code: '#111111', stock: 25 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 340000 },
        { min: 10, max: 49, price: 295000 },
        { min: 50, max: null, price: 260000 }
      ]
    },
    {
      sku: 'SKY-MAR-003',
      name: 'Galvanized Folding Grapnel Boat & Kayak Anchor 3.5kg Kit',
      slug: 'galvanized-folding-grapnel-anchor-35kg-kit',
      brand_id: 6,
      category_id: 6,
      subcategory_id: 39, // marine-tools
      description: 'Set jangkar kapal lipat grapnel 3.5kg bahan baja galvanis hot-dip anti karat dengan 4 bilah cakar kuat, rantai galvanis 2m, shackle stainless, dan tali 20m dalam tas kanvas.',
      short_desc: 'Jangkar lipat 3.5kg + rantai 2m + tali 20m untuk perahu & kayak',
      material: 'Hot-Dip Galvanized Marine Carbon Steel',
      dimensions: 'Berat Jangkar 3.5kg / Panjang 40cm',
      weight_grams: 5200,
      normal_price: 680000,
      promo_price: 590000,
      rating: 4.9,
      review_count: 34,
      sold_count: 140,
      tags: ['jangkar', 'anchor', 'jangkar lipat', 'jangkar perahu', 'kayak anchor'],
      images: [
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'
      ],
      variants: [
        { sku: 'SKY-MAR-003-35K', title: '3.5kg Kit (Perahu 3-6 meter / Rib / Dinghy)', size: '3.5kg Kit', color: 'Galvanized Silver', color_code: '#ADB5BD', stock: 14 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 530000 },
        { min: 6, max: null, price: 480000 }
      ]
    },

    // --- 7. APPAREL & SURFWEAR (cat_id: 7) ---
    {
      sku: 'SKY-APP-001',
      name: 'Skyra Marine Heritage Heavyweight Organic Cotton Tee',
      slug: 'skyra-marine-heritage-organic-cotton-tee',
      brand_id: 1, // Skyra Pro
      category_id: 7,
      subcategory_id: 40, // t-shirt
      description: 'Kaos grafis samudera berbahan katun organik tebal 240 GSM dengan sablon discharge ramah lingkungan yang adem di cuaca pantai terik.',
      short_desc: 'Kaos katun organik 240 GSM grafis kompas bahari',
      material: '100% Combed Organic Cotton 240 GSM',
      dimensions: 'Sizes S, M, L, XL, XXL',
      weight_grams: 280,
      normal_price: 245000,
      promo_price: 199000,
      rating: 4.8,
      review_count: 110,
      sold_count: 650,
      tags: ['kaos surf', 't-shirt', 'kaos pantai', 'baju kasual', 'ocean tee'],
      images: [
        'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800'
      ],
      variants: [
        { sku: 'SKY-APP-001-WHT-M', title: 'Vintage White - M', size: 'M', color: 'Vintage White', color_code: '#F8F9FA', stock: 25 },
        { sku: 'SKY-APP-001-WHT-L', title: 'Vintage White - L', size: 'L', color: 'Vintage White', color_code: '#F8F9FA', stock: 35 },
        { sku: 'SKY-APP-001-NVY-M', title: 'Ocean Deep Navy - M', size: 'M', color: 'Ocean Navy', color_code: '#0A192F', stock: 30 },
        { sku: 'SKY-APP-001-NVY-L', title: 'Ocean Deep Navy - L', size: 'L', color: 'Ocean Navy', color_code: '#0A192F', stock: 30 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 175000 },
        { min: 10, max: 49, price: 155000 },
        { min: 50, max: null, price: 135000 }
      ]
    },
    {
      sku: 'SKY-APP-002',
      name: 'WaveFlex 4-Way Stretch Performance Boardshorts 19"',
      slug: 'waveflex-4-way-stretch-boardshorts-19',
      brand_id: 2, // RipCurrent
      category_id: 7,
      subcategory_id: 42, // boardshorts
      description: 'Celana selancar boardshorts tanpa jahitan dalam (anti chafing), bahan stretch 4 arah tahan air (DWR) cepat kering dalam 10 menit, dan kantong ritsleting tahan air untuk kunci lilin.',
      short_desc: 'Celana surfing 19" 4-way stretch DWR quick-dry anti lecet',
      material: '88% Recycled Poly + 12% Spandex DWR Coating',
      dimensions: 'Sizes 30, 32, 34, 36',
      weight_grams: 220,
      normal_price: 495000,
      promo_price: 425000,
      is_featured: 1,
      rating: 4.9,
      review_count: 84,
      sold_count: 420,
      tags: ['boardshorts', 'celana surfing', 'celana renang pantai', 'ripcurrent'],
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ],
      variants: [
        { sku: 'SKY-APP-002-30', title: 'Canggu Waves Gradient - Size 30', size: '30', color: 'Teal Gradient', color_code: '#118AB2', stock: 15 },
        { sku: 'SKY-APP-002-32', title: 'Canggu Waves Gradient - Size 32', size: '32', color: 'Teal Gradient', color_code: '#118AB2', stock: 25 },
        { sku: 'SKY-APP-002-34', title: 'Canggu Waves Gradient - Size 34', size: '34', color: 'Teal Gradient', color_code: '#118AB2', stock: 20 }
      ],
      wholesale: [
        { min: 5, max: 9, price: 375000 },
        { min: 10, max: 49, price: 335000 },
        { min: 50, max: null, price: 295000 }
      ]
    },
    {
      sku: 'SKY-APP-003',
      name: 'Offshore Thermal Windproof Sailing & Marine Jacket',
      slug: 'offshore-thermal-windproof-sailing-jacket',
      brand_id: 6, // Nautica Armor
      category_id: 7,
      subcategory_id: 43, // jacket
      description: 'Jaket pelaut tahan badai dan angin laut kencang dengan membran tahan air 15.000mm, kerah tinggi berlapis fleece mikro, tudung kepala reflektif SOLAS, dan manset neoprene kedap air.',
      short_desc: 'Jaket layar tahan badai 15.000mm waterproof & windproof',
      material: '3-Layer HydroVent Marine Shell with DWR',
      dimensions: 'Sizes S, M, L, XL',
      weight_grams: 950,
      normal_price: 1850000,
      promo_price: 1650000,
      rating: 5.0,
      review_count: 26,
      sold_count: 85,
      tags: ['sailing jacket', 'jaket kapal', 'jaket tahan angin', 'marine apparel'],
      images: [
        'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800'
      ],
      variants: [
        { sku: 'SKY-APP-003-M', title: 'Nautical Navy / Gold - M', size: 'M', color: 'Nautical Navy', color_code: '#002855', stock: 8 },
        { sku: 'SKY-APP-003-L', title: 'Nautical Navy / Gold - L', size: 'L', color: 'Nautical Navy', color_code: '#002855', stock: 12 },
        { sku: 'SKY-APP-003-XL', title: 'Nautical Navy / Gold - XL', size: 'XL', color: 'Nautical Navy', color_code: '#002855', stock: 6 }
      ],
      wholesale: [
        { min: 3, max: 5, price: 1480000 },
        { min: 6, max: null, price: 1350000 }
      ]
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      sku, name, slug, brand_id, category_id, subcategory_id,
      description, short_desc, material, dimensions, weight_grams,
      normal_price, promo_price, status, is_featured, is_flash_sale,
      flash_sale_discount_percent, rating, review_count, sold_count, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (
      product_id, sku, title, size, color, color_code,
      additional_price, current_stock, reserved_stock, low_stock_threshold
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 5)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const insertWholesale = db.prepare(`
    INSERT INTO wholesale_rules (product_id, min_quantity, max_quantity, price_per_unit)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const p of rawProducts) {
      const info = insertProduct.run(
        p.sku, p.name, p.slug, p.brand_id, p.category_id, p.subcategory_id,
        p.description, p.short_desc, p.material, p.dimensions, p.weight_grams,
        p.normal_price, p.promo_price || null, p.is_featured || 0,
        p.is_flash_sale || 0, p.flash_sale_discount_percent || 0,
        p.rating, p.review_count, p.sold_count, JSON.stringify(p.tags)
      );
      const prodId = Number(info.lastInsertRowid);

      // Insert images
      p.images.forEach((imgUrl, idx) => {
        insertImage.run(prodId, imgUrl, idx === 0 ? 1 : 0, idx);
      });

      // Insert variants
      for (const v of p.variants) {
        insertVariant.run(
          prodId, v.sku, v.title, v.size || null, v.color || null,
          v.color_code || null, v.additional_price || 0, v.stock
        );
      }

      // Insert wholesale tiers
      for (const w of p.wholesale) {
        insertWholesale.run(prodId, w.min, w.max, w.price);
      }
    }
  });

  tx();
}
