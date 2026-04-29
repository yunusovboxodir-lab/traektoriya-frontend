/**
 * Типы для офлайн-программ (ADKAR / DSPM / 7 Qadam).
 * Соответствуют моделям бэкенда из app/models/offline_program.py.
 */

// ---------------------------------------------------------------------------
// Block types (конструктор слайдов)
// ---------------------------------------------------------------------------

export type BlockAlign = 'left' | 'center';

export interface BaseBlock {
  type: string;
}

export interface HeadingH1Block extends BaseBlock {
  type: 'heading_h1';
  text: string;
  text_uz?: string;
  align?: BlockAlign;
}

export interface HeadingH2Block extends BaseBlock {
  type: 'heading_h2';
  text: string;
  text_uz?: string;
  align?: BlockAlign;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
  text_uz?: string;
  align?: BlockAlign;
}

export interface CardItem {
  icon?: string;
  title: string;
  title_uz?: string;
  body?: string;
  body_uz?: string;
  color?: string;
}

export interface CardsGridBlock extends BaseBlock {
  type: 'cards_grid';
  columns: 2 | 3 | 4;
  cards: CardItem[];
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  text_uz?: string;
  author?: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption?: string;
}

export type CalloutVariant = 'info' | 'warning' | 'success' | 'danger';

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: CalloutVariant;
  text: string;
  text_uz?: string;
}

export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  left_title: string;
  left_items: string[];
  right_title: string;
  right_items: string[];
}

export interface NumberedListItem {
  title: string;
  title_uz?: string;
  body?: string;
  body_uz?: string;
}

export interface NumberedListBlock extends BaseBlock {
  type: 'numbered_list';
  items: NumberedListItem[];
}

export type Block =
  | HeadingH1Block
  | HeadingH2Block
  | ParagraphBlock
  | CardsGridBlock
  | QuoteBlock
  | ImageBlock
  | CalloutBlock
  | ComparisonBlock
  | NumberedListBlock;

// ---------------------------------------------------------------------------
// Slides + slide types
// ---------------------------------------------------------------------------

export type SlideType =
  | 'intro'
  | 'content'
  | 'test_pre'
  | 'test_post'
  | 'dashboard_pre'
  | 'dashboard_pre_result'
  | 'dashboard_post'
  | 'dashboard_growth'
  | 'closing';

export interface Slide {
  id?: string;
  program_id?: string;
  order_index: number;
  slide_type: SlideType;
  blocks: Block[];
  bg_style?: string | null;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Questions + Categories
// ---------------------------------------------------------------------------

export interface QuestionOption {
  text: string;
  text_uz?: string;
  score: number;
}

export interface Question {
  id?: string;
  program_id?: string;
  order_index: number;
  question: string;
  question_uz?: string;
  category?: string | null;
  options: QuestionOption[];
  max_score: number;
  explanation?: string | null;
  explanation_uz?: string | null;
}

export interface Category {
  id?: string;
  program_id?: string;
  code: string;
  label: string;
  label_uz?: string;
  color: string;
  description?: string | null;
  description_uz?: string | null;
  order_index: number;
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

export interface Program {
  id: string;
  code: string;
  title: string;
  title_uz?: string | null;
  description?: string | null;
  description_uz?: string | null;
  target_role: string;
  duration_minutes: number;
  max_score: number;
  num_questions: number;
  theme_color: string;
  icon?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Только при include_relations:
  slides?: Slide[];
  questions?: Question[];
  categories?: Category[];
  slides_count?: number;
  questions_count?: number;
}

// ---------------------------------------------------------------------------
// Dashboard (live для проектора)
// ---------------------------------------------------------------------------

export interface DashboardParticipant {
  name: string;
  pct: number;
}

export interface QuestionStat {
  q: number;
  optCounts: number[]; // [n,n,n,n]
  correctPct: number;
}

export interface PhaseAggregate {
  count: number;
  participants: DashboardParticipant[];
  avgPercent: number;
  scores: number[];
  questionStats: QuestionStat[];
}

export interface GrowthItem {
  name: string;
  pre: number | null;
  post: number;
  delta: number | null;
}

export interface GrowthData {
  items: GrowthItem[];
  matched: number;
  avgPre: number;
  avgPost: number;
  avgDelta: number;
}

export interface SessionDashboard {
  ok: boolean;
  session_id: string;
  access_code: string;
  title: string;
  status: string;
  pre: PhaseAggregate | null;
  post: PhaseAggregate | null;
  growth: GrowthData | null;
  error?: string;
}

export interface QrPayload {
  session_id: string;
  access_code: string;
  phase: string;
  mobile_url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Создать пустой слайд под выбранный тип. */
export function emptySlide(orderIndex: number, slideType: SlideType = 'content'): Slide {
  return {
    order_index: orderIndex,
    slide_type: slideType,
    blocks: [],
    bg_style: null,
    note: null,
  };
}

/** Создать пустой блок выбранного типа (для редактора). */
export function emptyBlock(type: Block['type']): Block {
  switch (type) {
    case 'heading_h1':
    case 'heading_h2':
      return { type, text: '', text_uz: '', align: 'left' } as Block;
    case 'paragraph':
      return { type, text: '', text_uz: '' };
    case 'cards_grid':
      return {
        type, columns: 3,
        cards: [{ icon: '✨', title: '', title_uz: '', body: '', body_uz: '' }],
      };
    case 'quote':
      return { type, text: '', text_uz: '', author: '' };
    case 'image':
      return { type, url: '', caption: '' };
    case 'callout':
      return { type, variant: 'info', text: '', text_uz: '' };
    case 'comparison':
      return {
        type,
        left_title: 'Правильно', left_items: [''],
        right_title: 'Неправильно', right_items: [''],
      };
    case 'numbered_list':
      return { type, items: [{ title: '', title_uz: '', body: '', body_uz: '' }] };
  }
}

/** Возвращает локализованный текст блока (RU или UZ). */
export function pickLang(text: string | undefined, text_uz: string | undefined, lang: 'ru' | 'uz'): string {
  if (lang === 'uz' && text_uz) return text_uz;
  return text || text_uz || '';
}
