import { db } from './db.ts';

export interface PricingCalculationItem {
  productId: number;
  variantId: number;
  quantity: number;
}

export interface WholesaleRule {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
}

export function getProductWholesalePrice(productId: number, basePrice: number, quantity: number): {
  unitPrice: number;
  isWholesale: boolean;
  savingsPerUnit: number;
  rules: WholesaleRule[];
} {
  const rules = db.prepare(`
    SELECT min_quantity as minQuantity, max_quantity as maxQuantity, price_per_unit as pricePerUnit
    FROM wholesale_rules
    WHERE product_id = ?
    ORDER BY min_quantity ASC
  `).all(productId) as WholesaleRule[];

  if (!rules || rules.length === 0) {
    return {
      unitPrice: basePrice,
      isWholesale: false,
      savingsPerUnit: 0,
      rules: []
    };
  }

  // Find matching tier based on quantity
  let applicablePrice = basePrice;
  let isWholesale = false;

  for (const rule of rules) {
    if (quantity >= rule.minQuantity && (rule.maxQuantity === null || quantity <= rule.maxQuantity)) {
      applicablePrice = rule.pricePerUnit;
      isWholesale = true;
      break;
    }
  }

  return {
    unitPrice: applicablePrice,
    isWholesale,
    savingsPerUnit: Math.max(0, basePrice - applicablePrice),
    rules
  };
}

export function validateVoucher(code: string, subtotal: number) {
  if (!code) return { valid: false, error: 'No code provided', discount: 0 };
  
  const voucher = db.prepare(`
    SELECT * FROM vouchers 
    WHERE code = ? AND is_active = 1
  `).get(code.toUpperCase().trim()) as any;

  if (!voucher) {
    return { valid: false, error: 'Kupon tidak valid atau sudah kadaluarsa', discount: 0 };
  }

  if (voucher.quota > 0 && voucher.used_count >= voucher.quota) {
    return { valid: false, error: 'Kuota kupon telah habis', discount: 0 };
  }

  if (subtotal < voucher.min_spend) {
    return { 
      valid: false, 
      error: `Minimal belanja Rp ${voucher.min_spend.toLocaleString('id-ID')} untuk kupon ini`, 
      discount: 0 
    };
  }

  let discount = 0;
  if (voucher.discount_type === 'percent') {
    discount = Math.round((subtotal * voucher.discount_value) / 100);
    if (voucher.max_discount && discount > voucher.max_discount) {
      discount = voucher.max_discount;
    }
  } else {
    discount = voucher.discount_value;
  }

  return {
    valid: true,
    voucher,
    discount: Math.min(discount, subtotal)
  };
}

export const SHIPPING_METHODS = [
  { id: 'jne_reg', name: 'JNE Marine Regular (2-3 Hari)', cost: 25000 },
  { id: 'sea_cargo', name: 'Sea Cargo Express (1-2 Hari)', cost: 45000 },
  { id: 'samudera_fast', name: 'Pos Samudera Kilat Khusus', cost: 35000 },
  { id: 'instant_coastal', name: 'Coastal Same Day Courier (Pelabuhan/Resort)', cost: 65000 }
];
