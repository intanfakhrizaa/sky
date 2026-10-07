export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin' | 'superadmin';
  avatar_url?: string;
  status: 'active' | 'suspended';
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  image_url: string;
  description: string;
  display_order: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  description: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  title: string;
  size?: string;
  color?: string;
  color_code?: string;
  additional_price: number;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  is_active: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: number;
  display_order: number;
}

export interface WholesaleRule {
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  brand_id?: number;
  brand_name?: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  description: string;
  short_desc?: string;
  material?: string;
  dimensions?: string;
  weight_grams: number;
  normal_price: number;
  promo_price?: number;
  status: 'active' | 'draft' | 'archived';
  is_featured: number;
  is_flash_sale: number;
  flash_sale_discount_percent: number;
  rating: number;
  review_count: number;
  sold_count: number;
  primary_image?: string;
  total_available_stock?: number;
  tags?: string[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  wholesaleRules?: WholesaleRule[];
  reviews?: Review[];
  related?: Partial<Product>[];
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  is_selected: number;
  product_name: string;
  product_slug: string;
  variant_title: string;
  variant_sku: string;
  image_url?: string;
  basePrice: number;
  unitPrice: number;
  isWholesale: boolean;
  savingsPerUnit: number;
  itemSubtotal: number;
  totalSavings: number;
  available_stock: number;
  isAvailable: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_title: string;
  sku: string;
  image_url?: string;
  unit_price: number;
  original_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal: string;
  shipping_method: string;
  shipping_cost: number;
  subtotal: number;
  wholesale_discount: number;
  voucher_code?: string;
  voucher_discount: number;
  grand_total: number;
  payment_method: string;
  payment_status: 'PENDING' | 'UNDER_REVIEW' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  order_status: 'PENDING_PAYMENT' | 'PAYMENT_VERIFICATION' | 'PAID' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  tracking_number?: string;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
  payment?: any;
  paymentProof?: any;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  variant_title?: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
}
