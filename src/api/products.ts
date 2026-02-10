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
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductHPV {
  id: string;
  variant_number: number;
  characteristic: string | null;
  advantage: string | null;
  benefit: string | null;
}

export interface ProductDetail extends Product {
  random_hpv: ProductHPV | null;
  test_count: number;
}

export const productsApi = {
  getProducts: (skip = 0, limit = 50) =>
    api.get('/api/v1/products', { params: { skip, limit } }),
  getProduct: (id: string) =>
    api.get(`/api/v1/products/${id}`),
  submitTest: (productId: string, answers: Record<string, string>) =>
    api.post(`/api/v1/products/${productId}/test`, { answers }),
  getTestResults: (productId: string) =>
    api.get(`/api/v1/products/${productId}/test-results`),
};
