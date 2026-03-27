/**
 * Minecraft-style character system for cinematic scenes.
 * 7 pre-defined FMCG role characters with pixel-art aesthetic.
 *
 * Characters use blocky proportions inspired by Minecraft skins:
 * - Large head (8x8 blocks)
 * - Body (8x12 blocks)
 * - Arms (4x12 blocks)
 * - Legs (4x12 blocks)
 * All rendered as SVG with pixel-perfect edges and shading.
 */

export interface CharacterSkin {
  id: string;
  /** Display name RU */
  label: string;
  /** Role description for AI prompt */
  description: string;
  /** Default emoji for face */
  defaultEmoji: string;
  /** Skin colors */
  skin: {
    head: string;
    headShade: string;
    hair: string;
    hairStyle: 'short' | 'medium' | 'long' | 'buzz' | 'parted';
    eyes: string;
    eyebrows: string;
  };
  /** Clothing colors */
  clothing: {
    shirt: string;
    shirtShade: string;
    shirtDetail?: string;
    pants: string;
    pantsShade: string;
    shoes: string;
    shoesShade: string;
    /** Extra layer: jacket, apron, vest */
    overlay?: string;
    overlayShade?: string;
  };
  /** Accessories */
  accessories: Array<'badge' | 'tie' | 'clipboard' | 'tablet' | 'phone' | 'keys' | 'pricetag' | 'notebook' | 'laptop' | 'folder' | 'box' | 'cap'>;
}

export const characterSkins: Record<string, CharacterSkin> = {

  // ─── 1. Торговый представитель ─────────────
  sales_rep: {
    id: 'sales_rep',
    label: 'Торговый представитель',
    description: 'Field sales representative visiting retail outlets. Wears company polo shirt with badge, carries tablet for orders.',
    defaultEmoji: '😊',
    skin: {
      head: '#d4a574', headShade: '#c4956a',
      hair: '#2d1f14', hairStyle: 'short',
      eyes: '#1a1a2e', eyebrows: '#2d1f14',
    },
    clothing: {
      shirt: '#1e40af', shirtShade: '#1e3a8a', shirtDetail: '#3b82f6',
      pants: '#1f2937', pantsShade: '#111827',
      shoes: '#0f172a', shoesShade: '#020617',
    },
    accessories: ['badge', 'tablet'],
  },

  // ─── 2. Супервайзер ───────────────────────
  supervisor: {
    id: 'supervisor',
    label: 'Супервайзер',
    description: 'Team supervisor managing 5-8 sales reps. Wears business casual with jacket, carries notebook for team notes.',
    defaultEmoji: '🤔',
    skin: {
      head: '#c4956a', headShade: '#b8895e',
      hair: '#1a1a2e', hairStyle: 'parted',
      eyes: '#1a1a2e', eyebrows: '#1a1a2e',
    },
    clothing: {
      shirt: '#f8fafc', shirtShade: '#e2e8f0',
      pants: '#334155', pantsShade: '#1e293b',
      shoes: '#1e293b', shoesShade: '#0f172a',
      overlay: '#374151', overlayShade: '#1f2937',
    },
    accessories: ['tie', 'notebook'],
  },

  // ─── 3. HR-менеджер ───────────────────────
  hr_manager: {
    id: 'hr_manager',
    label: 'HR-менеджер',
    description: 'HR manager conducting interviews, evaluations, training. Wears formal business attire with folder of resumes.',
    defaultEmoji: '🤓',
    skin: {
      head: '#d4a574', headShade: '#c4956a',
      hair: '#4a2c1a', hairStyle: 'medium',
      eyes: '#1a1a2e', eyebrows: '#4a2c1a',
    },
    clothing: {
      shirt: '#dbeafe', shirtShade: '#bfdbfe',
      pants: '#1e3a5f', pantsShade: '#172554',
      shoes: '#1e293b', shoesShade: '#0f172a',
      overlay: '#1e3a5f', overlayShade: '#172554',
    },
    accessories: ['folder', 'badge'],
  },

  // ─── 4. Товаровед / зав. магазином ────────
  store_keeper: {
    id: 'store_keeper',
    label: 'Товаровед',
    description: 'Store product manager / merchandise manager. Wears store apron, holds price tag, manages shelf space.',
    defaultEmoji: '😤',
    skin: {
      head: '#e0b896', headShade: '#d4a880',
      hair: '#5c3a1e', hairStyle: 'buzz',
      eyes: '#1a1a2e', eyebrows: '#5c3a1e',
    },
    clothing: {
      shirt: '#16a34a', shirtShade: '#15803d',
      pants: '#374151', pantsShade: '#1f2937',
      shoes: '#374151', shoesShade: '#1f2937',
      overlay: '#166534', overlayShade: '#14532d',
    },
    accessories: ['pricetag', 'clipboard'],
  },

  // ─── 5. Региональный менеджер ─────────────
  regional_manager: {
    id: 'regional_manager',
    label: 'Региональный менеджер',
    description: 'Regional manager overseeing territory strategy. Wears formal suit with tie, carries laptop for analytics.',
    defaultEmoji: '😎',
    skin: {
      head: '#c4956a', headShade: '#b8895e',
      hair: '#1a1a2e', hairStyle: 'parted',
      eyes: '#1a1a2e', eyebrows: '#1a1a2e',
    },
    clothing: {
      shirt: '#f1f5f9', shirtShade: '#e2e8f0',
      pants: '#0f172a', pantsShade: '#020617',
      shoes: '#0f172a', shoesShade: '#020617',
      overlay: '#1e293b', overlayShade: '#0f172a',
    },
    accessories: ['tie', 'laptop'],
  },

  // ─── 6. Директор магазина ─────────────────
  store_director: {
    id: 'store_director',
    label: 'Директор магазина',
    description: 'Store owner or director. Wears store uniform/coat, has keys, manages the whole outlet.',
    defaultEmoji: '🧐',
    skin: {
      head: '#d4a574', headShade: '#c4956a',
      hair: '#6b4226', hairStyle: 'medium',
      eyes: '#1a1a2e', eyebrows: '#6b4226',
    },
    clothing: {
      shirt: '#f8fafc', shirtShade: '#e2e8f0',
      pants: '#475569', pantsShade: '#334155',
      shoes: '#334155', shoesShade: '#1e293b',
      overlay: '#64748b', overlayShade: '#475569',
    },
    accessories: ['keys', 'clipboard'],
  },

  // ─── 7. Стажёр / новичок ──────────────────
  trainee: {
    id: 'trainee',
    label: 'Стажёр',
    description: 'New hire / trainee on their first days. Casual clothes, holds phone, looks uncertain. Learning the ropes.',
    defaultEmoji: '😅',
    skin: {
      head: '#e0c8a8', headShade: '#d4bc9c',
      hair: '#3d2b1f', hairStyle: 'short',
      eyes: '#1a1a2e', eyebrows: '#3d2b1f',
    },
    clothing: {
      shirt: '#60a5fa', shirtShade: '#3b82f6',
      pants: '#6b7280', pantsShade: '#4b5563',
      shoes: '#9ca3af', shoesShade: '#6b7280',
    },
    accessories: ['phone', 'cap'],
  },
};

/** Get character skin by ID, fallback to sales_rep */
export function getCharacterSkin(id: string): CharacterSkin {
  return characterSkins[id] || characterSkins.sales_rep;
}

/** List all available character IDs */
export function getCharacterIds(): string[] {
  return Object.keys(characterSkins);
}

/** Formatted list for AI prompt injection */
export function getCharacterPromptList(): string {
  return Object.entries(characterSkins)
    .map(([key, skin]) => `- "${key}": ${skin.label} — ${skin.description}`)
    .join('\n');
}
