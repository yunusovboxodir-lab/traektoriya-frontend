/** SVG atmosphere backgrounds for cinematic scenes */

export interface AtmosphereConfig {
  /** CSS gradient for background */
  gradient: string;
  /** Light effect — trapezoid from top */
  lightColor: string;
  lightOpacity: number;
  /** Shelf config (for store atmospheres) */
  shelves?: {
    rows: number;
    productsPerRow: number;
    chaos: boolean; // random rotation
    shelfColor: string;
  };
  /** Generic product colors for shelves */
  productColors: string[];
}

const STORE_PRODUCTS = [
  '#7c3aed', '#6d28d9', '#a855f7', // purples (N'Medov)
  '#dc2626', '#f59e0b', '#22c55e', // competitor
  '#3b82f6', '#6366f1', '#ec4899', // more
];

const OFFICE_TONES = [
  '#1e3a5f', '#334155', '#475569',
  '#60a5fa', '#818cf8', '#a78bfa',
];

export const atmospheres: Record<string, AtmosphereConfig> = {
  store_chaos: {
    gradient: 'linear-gradient(180deg, #0a0f1a 0%, #111827 30%, #1a1a2e 60%, #0d1117 100%)',
    lightColor: 'rgba(255,255,255,0.04)',
    lightOpacity: 0.15,
    shelves: {
      rows: 3,
      productsPerRow: 12,
      chaos: true,
      shelfColor: '#374151',
    },
    productColors: STORE_PRODUCTS,
  },
  dark_office: {
    gradient: 'linear-gradient(180deg, #0c1829 0%, #1a2744 40%, #0d1520 100%)',
    lightColor: 'rgba(255,200,100,0.06)',
    lightOpacity: 0.1,
    productColors: OFFICE_TONES,
  },
  warehouse: {
    gradient: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 40%, #262626 100%)',
    lightColor: 'rgba(255,220,150,0.05)',
    lightOpacity: 0.08,
    shelves: {
      rows: 4,
      productsPerRow: 8,
      chaos: false,
      shelfColor: '#44403c',
    },
    productColors: ['#78716c', '#a8a29e', '#d6d3d1', '#f5f5f4', '#92400e', '#b45309'],
  },
  meeting_room: {
    gradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    lightColor: 'rgba(200,220,255,0.04)',
    lightOpacity: 0.12,
    productColors: OFFICE_TONES,
  },
  store_clean: {
    gradient: 'linear-gradient(180deg, #0a0f1a 0%, #111827 30%, #1a1a2e 60%, #0d1117 100%)',
    lightColor: 'rgba(255,255,255,0.06)',
    lightOpacity: 0.2,
    shelves: {
      rows: 3,
      productsPerRow: 14,
      chaos: false,
      shelfColor: '#4b5563',
    },
    productColors: STORE_PRODUCTS,
  },
};

export function getAtmosphere(name: string): AtmosphereConfig {
  return atmospheres[name] || atmospheres.store_chaos;
}
