/**
 * Источник данных для каталога товаров.
 *
 * НЕ ХОДИТ В BACKEND. Читает локальные JSON (products/brands/categories.json),
 * трансформирует в Product/BrandConfig типы, которые ожидает существующий код.
 *
 * Это pre-launch MVP-mock (2026-05-04) до миграции данных в Postgres.
 * Чтобы вернуться на API — снять флаг USE_LOCAL_PRODUCTS в src/api/products.ts.
 */
import productsRaw from './products.json';
import brandsRaw from './brands.json';
import categoriesRaw from './categories.json';
import type { Product, ProductDetail, ProductListResponse } from '../api/products';
import type { BrandConfig } from '../config/brands';

// =============================================================================
// Типы исходных JSON
// =============================================================================

export interface RawProduct {
  id: string;
  slug: string;
  brand: string;
  category: string;
  category_raw: string;
  name: string;
  weight: string;
  pack_size: number | null;
  price_uzs: number | null;
  barcode: string;
  shelf_life_months: number | null;
  image_url: string;
  description_ru: string;
  description_uz: string;
  key_features: string[];
  ingredients_ru: string;
  ingredients_uz: string;
  nutrition_per_100g: {
    energy_kcal?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
  } | null;
  promo_position: 'premium' | 'standard' | 'budget';
  shelf_dspm_position: 'eye-level' | 'reach' | 'top' | 'bottom' | string;
  competitive_brands: string[];
  selling_points: string[];
  is_pilot: boolean;
  mml_active: boolean;
  integration_code: string;
}

export interface RawBrand {
  key: string;
  name: string;
  tagline_ru: string;
  color: string;
  order: number;
  sku_count: number;
}

export interface RawCategory {
  key: string;
  name_ru: string;
  name_uz: string;
  icon: string;
  order: number;
}

export const RAW_PRODUCTS = productsRaw as RawProduct[];
export const RAW_BRANDS = brandsRaw as RawBrand[];
export const RAW_CATEGORIES = categoriesRaw as RawCategory[];

// =============================================================================
// Трансформация в типы фронт-API
// =============================================================================

/** «nan» в id-поле = sentinel для отсутствующего id из CSV. Делаем стабильный ключ из slug. */
function safeId(raw: RawProduct, idx: number): string {
  if (raw.id && raw.id !== 'nan') return raw.id;
  return `local-${raw.slug || idx}`;
}

export function rawToProduct(raw: RawProduct, idx: number): Product {
  return {
    id: safeId(raw, idx),
    name: raw.name,
    brand: raw.brand || null,
    category: raw.category || null,
    subcategory: raw.category_raw || null,
    weight: raw.weight || null,
    barcode: raw.barcode || null,
    sku_code: raw.integration_code || null,

    short_description: raw.description_ru ? raw.description_ru.slice(0, 140) : null,
    description: raw.description_ru || null,
    composition: raw.ingredients_ru || null,
    flavor: null,
    target_audience: null,
    consumption_occasion: null,

    price_rrp: raw.price_uzs,
    distributor_price: null,
    margin_percentage: null,
    shelf_life: raw.shelf_life_months ? `${raw.shelf_life_months} мес.` : null,
    storage_conditions: null,
    min_order: null,

    units_per_box: raw.pack_size || null,
    units_per_pallet: null,

    shelf_placement: raw.shelf_dspm_position || null,
    recommended_facing: null,
    shelf_neighbors: null,
    display_standard: null,

    competitors: (raw.competitive_brands || []).map((name) => ({
      name,
      strengths: '',
      weaknesses: '',
    })),
    competitive_advantage: (raw.selling_points || []).join('; ') || null,

    common_objections: null,

    is_active: !!raw.mml_active,
    created_at: '2026-05-04T00:00:00Z',
    image_url: raw.image_url || null,
  };
}

/** Список всех товаров после трансформации — кешируется на модуль. */
export const ALL_PRODUCTS: Product[] = RAW_PRODUCTS.map(rawToProduct);

/** Маппинг id → сырой raw (для деталей с дополнительными полями). */
const PRODUCT_BY_ID = new Map<string, { raw: RawProduct; transformed: Product }>();
RAW_PRODUCTS.forEach((raw, idx) => {
  const transformed = rawToProduct(raw, idx);
  PRODUCT_BY_ID.set(transformed.id, { raw, transformed });
});

// =============================================================================
// Public-API: используется api/products.ts
// =============================================================================

export function localGetProducts(skip = 0, limit = 100): ProductListResponse {
  const items = ALL_PRODUCTS.slice(skip, skip + limit);
  return { items, total: ALL_PRODUCTS.length, skip, limit };
}

export function localGetProduct(id: string): ProductDetail | null {
  const entry = PRODUCT_BY_ID.get(id);
  if (!entry) return null;
  const { transformed, raw } = entry;
  return {
    ...transformed,
    images: raw.image_url
      ? [{ id: `${transformed.id}-main`, product_id: transformed.id, image_type: 'main', url: raw.image_url, sort_order: 0, created_at: transformed.created_at }]
      : [],
    hpv: null,
    test_questions: [],
  };
}

// =============================================================================
// Бренды для tab-bar (заменяет старый config/brands.ts BRAND_TABS)
// =============================================================================

export const BRAND_TABS_LOCAL: BrandConfig[] = RAW_BRANDS
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((b) => ({
    label: b.name,
    brandKey: b.key,
    expectedSKU: b.sku_count,
  }));

// =============================================================================
// Категории — для фильтра по категориям (новая фича)
// =============================================================================

export interface CategoryConfig {
  key: string;
  name: { ru: string; uz: string };
  icon: string;
  order: number;
  count: number;
}

const _categoryCounts = new Map<string, number>();
ALL_PRODUCTS.forEach((p) => {
  if (p.category) _categoryCounts.set(p.category, (_categoryCounts.get(p.category) || 0) + 1);
});

export const CATEGORY_TABS: CategoryConfig[] = RAW_CATEGORIES
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((c) => ({
    key: c.key,
    name: { ru: c.name_ru, uz: c.name_uz },
    icon: c.icon,
    order: c.order,
    count: _categoryCounts.get(c.key) || 0,
  }));
