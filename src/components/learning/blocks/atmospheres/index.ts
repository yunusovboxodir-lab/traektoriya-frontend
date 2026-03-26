/**
 * Scene atmosphere backgrounds for cinematic lessons.
 * Each atmosphere defines visual parameters for a specific FMCG scene context.
 * The key is stored in lesson_data JSON as atmosphere: "key_name".
 */

export interface ShelfConfig {
  rows: number;
  productsPerRow: number;
  chaos: boolean;
  shelfColor: string;
}

export interface SceneElement {
  type: 'desk' | 'whiteboard' | 'screen' | 'table' | 'counter' | 'conveyor' | 'fridge' | 'pallet' | 'car' | 'tree';
  position: 'left' | 'center' | 'right';
  opacity: number;
}

export interface AtmosphereConfig {
  /** Human-readable name (RU) */
  label: string;
  /** Short description for AI prompt */
  description: string;
  /** CSS gradient for background */
  gradient: string;
  /** Secondary gradient overlay */
  overlayGradient?: string;
  /** Light effect — trapezoid from top */
  lightColor: string;
  lightOpacity: number;
  /** Floor gradient */
  floorGradient?: string;
  floorHeight?: number;
  /** Shelf config (for store atmospheres) */
  shelves?: ShelfConfig;
  /** Extra scene elements */
  elements?: SceneElement[];
  /** Generic product/element colors */
  productColors: string[];
  /** Particle effect */
  particles?: 'dust' | 'rain' | 'snow' | 'sparkle' | 'none';
  /** Ambient color for character glow */
  ambientColor?: string;
}

// ============================
// Color palettes
// ============================

const STORE_PRODUCTS = [
  '#7c3aed', '#6d28d9', '#a855f7',
  '#dc2626', '#f59e0b', '#22c55e',
  '#3b82f6', '#6366f1', '#ec4899',
];

const NMEDOV_COLORS = [
  '#dc2626', '#b91c1c', // Chococream red
  '#7c3aed', '#6d28d9', // Purple
  '#f59e0b', '#d97706', // Gold/amber
  '#22c55e', '#16a34a', // Green
];

const OFFICE_TONES = [
  '#1e3a5f', '#334155', '#475569',
  '#60a5fa', '#818cf8', '#a78bfa',
];

const WAREHOUSE_TONES = [
  '#78716c', '#a8a29e', '#d6d3d1',
  '#f5f5f4', '#92400e', '#b45309',
];

const STREET_TONES = [
  '#4ade80', '#22c55e', '#15803d',
  '#a3e635', '#84cc16', '#65a30d',
];

// ============================
// 15 Atmospheres for FMCG scenes
// ============================

export const atmospheres: Record<string, AtmosphereConfig> = {

  // ─── МАГАЗИН / RETAIL ──────────────────────

  store_chaos: {
    label: 'Магазин — хаос на полке',
    description: 'Retail store with messy shelves, products falling, chaotic display. Used for merchandising problems.',
    gradient: 'linear-gradient(180deg, #0a0f1a 0%, #111827 30%, #1a1a2e 60%, #0d1117 100%)',
    overlayGradient: 'radial-gradient(ellipse at 30% 60%, rgba(220,38,38,0.04), transparent 50%)',
    lightColor: 'rgba(255,255,255,0.04)',
    lightOpacity: 0.15,
    floorGradient: 'linear-gradient(to top, rgba(30,20,10,0.6), transparent)',
    floorHeight: 30,
    shelves: { rows: 3, productsPerRow: 12, chaos: true, shelfColor: '#374151' },
    productColors: STORE_PRODUCTS,
    particles: 'dust',
    ambientColor: 'rgba(220,38,38,0.15)',
  },

  store_clean: {
    label: 'Магазин — идеальная выкладка',
    description: 'Clean retail store with perfect product display, organized shelves. Used for best-practice examples.',
    gradient: 'linear-gradient(180deg, #0a0f1a 0%, #111827 30%, #1a1a2e 60%, #0d1117 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.05), transparent 50%)',
    lightColor: 'rgba(255,255,255,0.06)',
    lightOpacity: 0.2,
    floorGradient: 'linear-gradient(to top, rgba(15,23,42,0.5), transparent)',
    floorHeight: 28,
    shelves: { rows: 3, productsPerRow: 14, chaos: false, shelfColor: '#4b5563' },
    productColors: NMEDOV_COLORS,
    particles: 'sparkle',
    ambientColor: 'rgba(59,130,246,0.12)',
  },

  minimarket_day: {
    label: 'Мини-маркет — дневной визит',
    description: 'Small neighborhood minimarket during daytime. Warm lighting, compact shelves. Used for daily visit scenarios.',
    gradient: 'linear-gradient(180deg, #1a1510 0%, #2a2015 30%, #1f1a12 60%, #151008 100%)',
    overlayGradient: 'radial-gradient(ellipse at 60% 30%, rgba(255,200,100,0.08), transparent 50%)',
    lightColor: 'rgba(255,220,150,0.08)',
    lightOpacity: 0.25,
    floorGradient: 'linear-gradient(to top, rgba(40,30,15,0.7), transparent)',
    floorHeight: 32,
    shelves: { rows: 2, productsPerRow: 8, chaos: false, shelfColor: '#78716c' },
    productColors: NMEDOV_COLORS,
    particles: 'dust',
    ambientColor: 'rgba(255,200,100,0.1)',
  },

  supermarket: {
    label: 'Супермаркет — большой зал',
    description: 'Large supermarket hall with bright fluorescent lighting, wide aisles, many shelves. Used for key account scenarios.',
    gradient: 'linear-gradient(180deg, #0c1220 0%, #141e30 30%, #1c2940 60%, #0e1520 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 20%, rgba(200,220,255,0.06), transparent 40%)',
    lightColor: 'rgba(200,220,255,0.07)',
    lightOpacity: 0.3,
    floorGradient: 'linear-gradient(to top, rgba(20,30,48,0.5), transparent)',
    floorHeight: 25,
    shelves: { rows: 4, productsPerRow: 16, chaos: false, shelfColor: '#64748b' },
    productColors: [...NMEDOV_COLORS, ...STORE_PRODUCTS],
    ambientColor: 'rgba(200,220,255,0.08)',
  },

  // ─── ОФИС ──────────────────────────────────

  dark_office: {
    label: 'Офис — вечерний',
    description: 'Dark corporate office at evening. Monitor glow, moody atmosphere. Used for planning, analytics, reporting scenes.',
    gradient: 'linear-gradient(180deg, #0c1829 0%, #1a2744 40%, #0d1520 100%)',
    overlayGradient: 'radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.04), transparent 40%)',
    lightColor: 'rgba(255,200,100,0.06)',
    lightOpacity: 0.1,
    floorGradient: 'linear-gradient(to top, rgba(12,24,41,0.7), transparent)',
    floorHeight: 25,
    elements: [
      { type: 'desk', position: 'center', opacity: 0.6 },
      { type: 'screen', position: 'center', opacity: 0.5 },
    ],
    productColors: OFFICE_TONES,
    ambientColor: 'rgba(100,160,255,0.1)',
  },

  office_morning: {
    label: 'Офис — утренний',
    description: 'Bright morning office with warm sunlight through windows. Used for team meetings, planning sessions, briefings.',
    gradient: 'linear-gradient(180deg, #1a1520 0%, #2a2035 30%, #1e1828 60%, #100c18 100%)',
    overlayGradient: 'radial-gradient(ellipse at 80% 20%, rgba(255,180,80,0.07), transparent 45%)',
    lightColor: 'rgba(255,200,120,0.06)',
    lightOpacity: 0.18,
    floorGradient: 'linear-gradient(to top, rgba(26,21,32,0.6), transparent)',
    floorHeight: 26,
    elements: [
      { type: 'whiteboard', position: 'right', opacity: 0.4 },
      { type: 'table', position: 'center', opacity: 0.5 },
    ],
    productColors: OFFICE_TONES,
    ambientColor: 'rgba(255,180,80,0.08)',
  },

  meeting_room: {
    label: 'Переговорная',
    description: 'Conference/meeting room with presentation screen. Used for supervisor meetings, HR interviews, evaluations.',
    gradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 30%, rgba(100,140,200,0.05), transparent 45%)',
    lightColor: 'rgba(200,220,255,0.04)',
    lightOpacity: 0.12,
    floorGradient: 'linear-gradient(to top, rgba(15,23,42,0.6), transparent)',
    floorHeight: 24,
    elements: [
      { type: 'screen', position: 'center', opacity: 0.5 },
      { type: 'table', position: 'center', opacity: 0.4 },
    ],
    productColors: OFFICE_TONES,
    ambientColor: 'rgba(100,140,200,0.08)',
  },

  // ─── СКЛАД ──────────────────────────────────

  warehouse: {
    label: 'Склад',
    description: 'Distribution warehouse with pallets, boxes, industrial lighting. Used for logistics, stock management, inventory.',
    gradient: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 40%, #262626 100%)',
    overlayGradient: 'radial-gradient(ellipse at 40% 40%, rgba(255,220,150,0.04), transparent 40%)',
    lightColor: 'rgba(255,220,150,0.05)',
    lightOpacity: 0.08,
    floorGradient: 'linear-gradient(to top, rgba(20,20,20,0.8), transparent)',
    floorHeight: 35,
    shelves: { rows: 4, productsPerRow: 8, chaos: false, shelfColor: '#44403c' },
    elements: [
      { type: 'pallet', position: 'left', opacity: 0.5 },
      { type: 'pallet', position: 'right', opacity: 0.4 },
    ],
    productColors: WAREHOUSE_TONES,
    particles: 'dust',
    ambientColor: 'rgba(255,220,150,0.06)',
  },

  warehouse_loading: {
    label: 'Склад — зона погрузки',
    description: 'Loading dock area of warehouse. Open gates, truck visible. Used for delivery, receivables, order scenarios.',
    gradient: 'linear-gradient(180deg, #0d0d0d 0%, #1a1510 30%, #1f1a12 60%, #0a0a0a 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 80%, rgba(255,180,80,0.05), transparent 50%)',
    lightColor: 'rgba(255,200,100,0.04)',
    lightOpacity: 0.06,
    floorGradient: 'linear-gradient(to top, rgba(30,25,15,0.7), transparent)',
    floorHeight: 38,
    elements: [
      { type: 'conveyor', position: 'center', opacity: 0.4 },
      { type: 'pallet', position: 'left', opacity: 0.5 },
    ],
    productColors: WAREHOUSE_TONES,
    ambientColor: 'rgba(255,180,80,0.06)',
  },

  // ─── УЛИЦА / МАРШРУТ ──────────────────────

  street_route: {
    label: 'Улица — маршрут ТП',
    description: 'Street scene during sales rep route. Buildings, shops, city landscape. Used for route planning, territory coverage.',
    gradient: 'linear-gradient(180deg, #0a1628 0%, #162040 30%, #1a2a4a 50%, #0d1520 100%)',
    overlayGradient: 'radial-gradient(ellipse at 30% 20%, rgba(100,200,255,0.05), transparent 40%)',
    lightColor: 'rgba(150,200,255,0.04)',
    lightOpacity: 0.12,
    floorGradient: 'linear-gradient(to top, rgba(50,50,60,0.6), transparent)',
    floorHeight: 30,
    elements: [
      { type: 'car', position: 'left', opacity: 0.3 },
      { type: 'tree', position: 'right', opacity: 0.4 },
    ],
    productColors: STREET_TONES,
    ambientColor: 'rgba(100,200,255,0.08)',
  },

  outdoor_market: {
    label: 'Базар / открытый рынок',
    description: 'Open-air market/bazaar in Central Asia. Warm, sunny, crowded. Used for dealer/wholesale scenarios.',
    gradient: 'linear-gradient(180deg, #1a1508 0%, #2d2510 30%, #261e0a 60%, #140e05 100%)',
    overlayGradient: 'radial-gradient(ellipse at 60% 15%, rgba(255,220,100,0.1), transparent 40%)',
    lightColor: 'rgba(255,220,100,0.08)',
    lightOpacity: 0.3,
    floorGradient: 'linear-gradient(to top, rgba(40,30,10,0.7), transparent)',
    floorHeight: 35,
    shelves: { rows: 2, productsPerRow: 10, chaos: true, shelfColor: '#92400e' },
    productColors: [...NMEDOV_COLORS, '#f59e0b', '#eab308', '#ca8a04'],
    particles: 'dust',
    ambientColor: 'rgba(255,200,80,0.12)',
  },

  // ─── ОБУЧЕНИЕ / ТРЕНИНГ ────────────────────

  training_room: {
    label: 'Тренинг-зал',
    description: 'Corporate training room with projector, chairs, flipchart. Used for onboarding, coaching, skill development.',
    gradient: 'linear-gradient(180deg, #10162a 0%, #1a2540 40%, #151d32 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.05), transparent 45%)',
    lightColor: 'rgba(180,160,255,0.05)',
    lightOpacity: 0.15,
    floorGradient: 'linear-gradient(to top, rgba(16,22,42,0.6), transparent)',
    floorHeight: 24,
    elements: [
      { type: 'whiteboard', position: 'center', opacity: 0.5 },
    ],
    productColors: [...OFFICE_TONES, '#a855f7', '#7c3aed'],
    ambientColor: 'rgba(168,85,247,0.1)',
  },

  // ─── КРИЗИС / НАПРЯЖЁННЫЕ ──────────────────

  crisis_red: {
    label: 'Кризисная ситуация',
    description: 'Tense red-tinted atmosphere for urgent problems — lost clients, critical KPI drop, team conflict.',
    gradient: 'linear-gradient(180deg, #1a0505 0%, #2a0a0a 30%, #1f0808 60%, #0d0303 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.08), transparent 50%)',
    lightColor: 'rgba(255,100,100,0.06)',
    lightOpacity: 0.1,
    floorGradient: 'linear-gradient(to top, rgba(26,5,5,0.8), transparent)',
    floorHeight: 28,
    productColors: ['#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#f87171', '#fca5a5'],
    particles: 'dust',
    ambientColor: 'rgba(220,38,38,0.15)',
  },

  success_green: {
    label: 'Успех / достижение',
    description: 'Positive green atmosphere for success stories — target achieved, deal closed, team goal met.',
    gradient: 'linear-gradient(180deg, #051a0a 0%, #0a2a12 30%, #081f0d 60%, #030d05 100%)',
    overlayGradient: 'radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.07), transparent 45%)',
    lightColor: 'rgba(100,255,150,0.05)',
    lightOpacity: 0.15,
    floorGradient: 'linear-gradient(to top, rgba(5,26,10,0.7), transparent)',
    floorHeight: 26,
    productColors: ['#22c55e', '#16a34a', '#15803d', '#166534', '#4ade80', '#86efac'],
    particles: 'sparkle',
    ambientColor: 'rgba(34,197,94,0.12)',
  },

  // ─── ДОПОЛНИТЕЛЬНЫЕ ────────────────────────

  client_office: {
    label: 'Офис клиента',
    description: 'Client\'s office during a B2B meeting. Formal setting. Used for negotiation, objection handling, deal closing.',
    gradient: 'linear-gradient(180deg, #12101a 0%, #1e1a2a 40%, #151220 100%)',
    overlayGradient: 'radial-gradient(ellipse at 70% 30%, rgba(200,180,255,0.04), transparent 40%)',
    lightColor: 'rgba(220,200,255,0.04)',
    lightOpacity: 0.1,
    floorGradient: 'linear-gradient(to top, rgba(18,16,26,0.6), transparent)',
    floorHeight: 24,
    elements: [
      { type: 'desk', position: 'center', opacity: 0.5 },
    ],
    productColors: ['#475569', '#64748b', '#94a3b8', '#a78bfa', '#818cf8'],
    ambientColor: 'rgba(200,180,255,0.08)',
  },
};

/** Get atmosphere config by key, fallback to store_chaos */
export function getAtmosphere(name: string): AtmosphereConfig {
  return atmospheres[name] || atmospheres.store_chaos;
}

/** List of all available atmosphere keys for AI prompt */
export function getAtmosphereKeys(): string[] {
  return Object.keys(atmospheres);
}

/** Formatted list for AI prompt injection */
export function getAtmospherePromptList(): string {
  return Object.entries(atmospheres)
    .map(([key, cfg]) => `- "${key}": ${cfg.description}`)
    .join('\n');
}
