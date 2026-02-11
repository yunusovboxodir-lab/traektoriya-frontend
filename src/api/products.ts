import { api } from './client';

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  weight: string | null;
  barcode: string | null;
  sku_code: string | null;
  price_rrp: number | null;
  shelf_life: string | null;
  storage_conditions: string | null;
  units_per_box: number | null;
  units_per_pallet: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
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
