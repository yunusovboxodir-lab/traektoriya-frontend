import { api } from './client';
import { localGetProducts, localGetProduct } from '../data/products-source';

/**
 * PRE-LAUNCH MOCK (2026-05-04):
 * Когда true — все методы getProducts / getProduct читают данные из
 * src/data/products.json (138 SKU N'Medov), не дёргая backend.
 * Создание/редактирование/удаление в этом режиме отключены — данные
 * редактируются через push в src/data/products.json + Vercel-деплой.
 *
 * Чтобы вернуться на Postgres-API: поставить false. Backend-таблица
 * products не трогалась — старые данные на месте.
 */
const USE_LOCAL_PRODUCTS = true;

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

  // Кубок NMEDOV 2026 — Верификация
  is_verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  last_edited_by?: string | null;
  last_edited_at?: string | null;

  // Computed: first image URL
  image_url: string | null;
}

// Кубок NMEDOV 2026 — Лидерборд верификации
export interface CupLeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_role?: string | null;
  verifications_count: number;
  total_points: number;
}

export interface CupLeaderboardResponse {
  period_year: number;
  period_month: number;
  total_unverified: number;
  total_verified_this_period: number;
  entries: CupLeaderboardEntry[];
  current_user_rank?: number | null;
  current_user_points?: number | null;
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

function fakeOk<T>(data: T) {
  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  });
}

function fakeError(msg: string) {
  return Promise.reject(new Error(msg));
}

export const productsApi = {
  getProducts: (skip = 0, limit = 50, isVerified?: boolean) => {
    if (USE_LOCAL_PRODUCTS) {
      // В локальном режиме все продукты считаются verified=true (нет верификации)
      const data = localGetProducts(skip, limit);
      if (isVerified === false) {
        return fakeOk<ProductListResponse>({ ...data, items: [], total: 0 });
      }
      return fakeOk<ProductListResponse>(data);
    }
    const params: Record<string, string | number | boolean> = { skip, limit };
    if (isVerified !== undefined) params.is_verified = isVerified;
    return api.get<ProductListResponse>('/api/v1/products', { params });
  },
  getProduct: (id: string) => {
    if (USE_LOCAL_PRODUCTS) {
      const p = localGetProduct(id);
      if (p) return fakeOk<ProductDetail>(p);
      return fakeError(`Product not found: ${id}`);
    }
    return api.get<ProductDetail>(`/api/v1/products/${id}`);
  },
  createProduct: (data: Partial<Product>) => {
    if (USE_LOCAL_PRODUCTS) return fakeError('Read-only: данные из JSON, редактирование через push в src/data/products.json');
    return api.post<Product>('/api/v1/products', data);
  },
  updateProduct: (id: string, data: Partial<Product>) => {
    if (USE_LOCAL_PRODUCTS) return fakeError('Read-only: данные из JSON, редактирование через push в src/data/products.json');
    return api.patch<Product>(`/api/v1/products/${id}`, data);
  },
  deleteProduct: (id: string) => {
    if (USE_LOCAL_PRODUCTS) return fakeError('Read-only: данные из JSON, редактирование через push в src/data/products.json');
    return api.delete(`/api/v1/products/${id}`);
  },
  submitTest: (productId: string, answers: Record<string, string>) =>
    api.post(`/api/v1/products/${productId}/test`, { answers }),
  getTestResults: (productId: string) =>
    api.get(`/api/v1/products/${productId}/test-results`),

  // Кубок NMEDOV 2026 — Верификация продуктов РМ-командой
  verifyProduct: (productId: string) => {
    if (USE_LOCAL_PRODUCTS) {
      return fakeError('Верификация недоступна: продукты загружены локально. Деплой backend → переключите USE_LOCAL_PRODUCTS=false.');
    }
    return api.post<{ product: Product; points_earned: number; total_verifications_today: number }>(
      `/api/v1/products/${productId}/verify`,
    );
  },

  // Лидерборд верификации (топ РМ за месяц)
  getCupLeaderboard: (periodYear?: number, periodMonth?: number) => {
    if (USE_LOCAL_PRODUCTS) {
      return fakeOk<CupLeaderboardResponse>({
        period_year: periodYear ?? new Date().getFullYear(),
        period_month: periodMonth ?? new Date().getMonth() + 1,
        total_unverified: 0,
        total_verified_this_period: 0,
        entries: [],
        current_user_rank: null,
        current_user_points: null,
      });
    }
    const params: Record<string, number> = {};
    if (periodYear) params.period_year = periodYear;
    if (periodMonth) params.period_month = periodMonth;
    return api.get<CupLeaderboardResponse>('/api/v1/products/cup/leaderboard', { params });
  },
};
