/**
 * Brand configuration for the Product Library page.
 * These 12 brands are always displayed as fixed tabs,
 * regardless of whether products exist in the database.
 */

export interface BrandConfig {
  /** Display label for the tab */
  label: string;
  /** Value stored in product.brand field in DB */
  brandKey: string;
  /** Expected total SKU count for this brand */
  expectedSKU: number;
}

export const BRAND_TABS: BrandConfig[] = [
  { label: 'CHOCOCREAM',              brandKey: 'Chococream',      expectedSKU: 10 },
  { label: 'CHOCOTELLA',             brandKey: 'Chocotella',      expectedSKU: 4  },
  { label: 'STROBAR',                brandKey: 'Strobar',         expectedSKU: 6  },
  { label: 'VELONA',                 brandKey: 'Velona',          expectedSKU: 5  },
  { label: 'HOT LUNCH / CHEFF',     brandKey: 'Hot Lunch',       expectedSKU: 14 },
  { label: 'CRAFERS WAFERS',        brandKey: 'Crafers Wafers',  expectedSKU: 4  },
  { label: 'SLADOK Отсадная линия', brandKey: 'Sladok',          expectedSKU: 8  },
  { label: 'Chocochips',            brandKey: 'Chocochips',      expectedSKU: 3  },
  { label: 'Banoffy',               brandKey: 'Banoffy',         expectedSKU: 3  },
  { label: 'Kreker',                brandKey: 'Kreker',          expectedSKU: 20 },
  { label: 'Blitz',                 brandKey: 'Blitz',           expectedSKU: 2  },
  { label: 'SLADOK Заварное',       brandKey: 'Sladok Zavarnoe', expectedSKU: 4  },
];

/** Total expected SKU across all brands = 83 */
export const TOTAL_EXPECTED_SKU = BRAND_TABS.reduce((sum, b) => sum + b.expectedSKU, 0);
