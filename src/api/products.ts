import { api } from './client';

export interface Product {
  id: string;
  // Block 1: Идентификация
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  weight: string | null;
  barcode: string | null;
  sku_code: string | null;

  // Block 3: Описание
  short_description: string | null;
  description: string | null;
  composition: string | null;
  flavor: string | null;
  target_audience: string | null;
  consumption_occasion: string | null;

  // Block 4: Коммерция
  price_rrp: number | null;
  distributor_price: number | null;
  margin_percentage: number | null;
  shelf_life: string | null;
  storage_conditions: string | null;
  min_order: number | null;

  // Block 5: Логистика
  units_per_box: number | null;
  units_per_pallet: number | null;

  // Block 6: Мерчандайзинг
  shelf_placement: string | null;
  recommended_facing: number | null;
  shelf_neighbors: string | null;
  display_standard: string | null;

  // Block 8: Конкуренты
  competitors: Array<{ name: string; strengths: string; weaknesses: string }> | null;
  competitive_advantage: string | null;

  // Block 9: Возражения
  common_objections: Array<{ objection: string; response: string }> | null;

  // Status
  is_active: boolean;
  created_at: string;
  updated_at?: string;

  // Computed: first image URL
  image_url: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_type: string | null;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductHPV {
  id: string;
  product_id?: string;
  variant_number: number;
  characteristic: string | null;
  advantage: string | null;
  benefit: string | null;
}

export interface ProductTest {
  id: string;
  product_id: string;
  question: string;
  options: string[] | null;
  variant_number: number;
}

export interface ProductDetail extends Product {
  images: ProductImage[];
  hpv: ProductHPV | null;
  test_questions: ProductTest[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  skip: number;
  limit: number;
}

export const productsApi = {
  getProducts: (skip = 0, limit = 50) =>
    api.get<ProductListResponse>('/api/v1/products', { params: { skip, limit } }),
  getProduct: (id: string) =>
    api.get<ProductDetail>(`/api/v1/products/${id}`),
  submitTest: (productId: string, answers: Record<string, string>) =>
    api.post(`/api/v1/products/${productId}/test`, { answers }),
  getTestResults: (productId: string) =>
    api.get(`/api/v1/products/${productId}/test-results`),
};
