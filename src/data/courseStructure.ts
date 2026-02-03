// ===========================================
// КУРС "160 ШАГОВ К ЭКСПЕРТУ N'MEDOV"
// Структура: 4 территории, 16 модулей, 160 шагов
// ===========================================

// ===========================================
// ТИПЫ
// ===========================================

export type TerritoryKey = 'novice' | 'agent' | 'expert' | 'master';
export type StepType = 'theory' | 'practice' | 'quiz' | 'video' | 'case_study';

export interface Territory {
  id: number;
  key: TerritoryKey;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  gradient: string;
  stepsRange: [number, number];
  requiredCards: number; // Лимит карточек для получения звезды
}

export interface Module {
  id: number;
  territoryId: number;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  stepsRange: [number, number];
}

export interface Step {
  id: number;
  moduleId: number;
  territoryId: number;
  title: string;
  titleUz: string;
  type: StepType;
  duration: number; // минуты
  content: string;
  contentUz: string;
  videoUrl?: string;
  quiz?: QuizQuestion[];
  practice?: PracticeTask;
  points: number;
  badge?: Badge;
}

export interface QuizQuestion {
  id: number;
  question: string;
  questionUz: string;
  options: string[];
  optionsUz: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface PracticeTask {
  instruction: string;
  instructionUz: string;
  checkpoints: string[];
  checkpointsUz: string[];
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  titleUz: string;
  description: string;
}

// ===========================================
// 4 ТЕРРИТОРИИ (Карта Компетенций)
// ===========================================

export const territories: Territory[] = [
  {
    id: 1,
    key: 'novice',
    title: 'Территория Новичка',
    titleUz: 'Yangi xodim hududi',
    description: 'Базовые знания и дисциплина. Изучите основы работы торгового представителя.',
    descriptionUz: 'Asosiy bilimlar va intizom. Savdo vakili ishining asoslarini o\'rganing.',
    icon: '🌱',
    color: '#10B981',
    gradient: 'from-green-400 to-emerald-600',
    stepsRange: [1, 40],
    requiredCards: 7
  },
  {
    id: 2,
    key: 'agent',
    title: 'Территория Агента',
    titleUz: 'Agent hududi',
    description: 'Техники продаж и мерчандайзинг. Освойте DSPM и 8 шагов визита.',
    descriptionUz: 'Savdo texnikasi va merchandayzing. DSPM va 8 qadam tashrifini o\'rganing.',
    icon: '⚔️',
    color: '#3B82F6',
    gradient: 'from-blue-400 to-indigo-600',
    stepsRange: [41, 100],
    requiredCards: 13
  },
  {
    id: 3,
    key: 'expert',
    title: 'Территория Эксперта',
    titleUz: 'Ekspert hududi',
    description: 'Продвинутые техники и работа с возражениями. Станьте мастером продаж.',
    descriptionUz: 'Ilg\'or texnikalar va e\'tirozlar bilan ishlash. Savdo ustasi bo\'ling.',
    icon: '🎯',
    color: '#8B5CF6',
    gradient: 'from-purple-400 to-violet-600',
    stepsRange: [101, 140],
    requiredCards: 20
  },
  {
    id: 4,
    key: 'master',
    title: 'Территория Мастера',
    titleUz: 'Usta hududi',
    description: 'Аналитика и наставничество. Развивайте команду и территорию.',
    descriptionUz: 'Tahlil va murabbiylik. Jamoa va hududni rivojlantiring.',
    icon: '👑',
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    stepsRange: [141, 160],
    requiredCards: 26
  }
];

// ===========================================
// 16 МОДУЛЕЙ
// ===========================================

export const modules: Module[] = [
  // === ТЕРРИТОРИЯ НОВИЧКА (1-40) ===
  {
    id: 1,
    territoryId: 1,
    title: 'Добро пожаловать в N\'Medov',
    titleUz: 'N\'Medov ga xush kelibsiz',
    description: 'Знакомство с компанией, миссией и ценностями',
    descriptionUz: 'Kompaniya, missiya va qadriyatlar bilan tanishish',
    icon: '👋',
    color: '#10B981',
    stepsRange: [1, 10]
  },
  {
    id: 2,
    territoryId: 1,
    title: 'Портрет торгового представителя',
    titleUz: 'Savdo vakili portreti',
    description: 'Кто такой успешный ТП и какими качествами он обладает',
    descriptionUz: 'Muvaffaqiyatli savdo vakili kim va qanday fazilatlarga ega',
    icon: '👤',
    color: '#059669',
    stepsRange: [11, 20]
  },
  {
    id: 3,
    territoryId: 1,
    title: 'Инструменты работы',
    titleUz: 'Ish vositalari',
    description: 'CRM, КПК, отчётность и планирование',
    descriptionUz: 'CRM, KPK, hisobot va rejalashtirish',
    icon: '🛠️',
    color: '#047857',
    stepsRange: [21, 30]
  },
  {
    id: 4,
    territoryId: 1,
    title: 'Основы визита',
    titleUz: 'Tashrif asoslari',
    description: 'Базовый чек-лист визита в торговую точку',
    descriptionUz: 'Savdo nuqtasiga tashrif uchun asosiy tekshirish ro\'yxati',
    icon: '📋',
    color: '#065F46',
    stepsRange: [31, 40]
  },

  // === ТЕРРИТОРИЯ АГЕНТА (41-100) ===
  {
    id: 5,
    territoryId: 2,
    title: 'DSPM: Дистрибуция',
    titleUz: 'DSPM: Distribyutsiya',
    description: 'Distribution — обеспечение присутствия товара',
    descriptionUz: 'Distribution — mahsulot mavjudligini ta\'minlash',
    icon: '📦',
    color: '#3B82F6',
    stepsRange: [41, 50]
  },
  {
    id: 6,
    territoryId: 2,
    title: 'DSPM: Выкладка',
    titleUz: 'DSPM: Joylashtirish',
    description: 'Shelving — правила выкладки товара',
    descriptionUz: 'Shelving — mahsulotni joylashtirish qoidalari',
    icon: '📊',
    color: '#2563EB',
    stepsRange: [51, 60]
  },
  {
    id: 7,
    territoryId: 2,
    title: 'DSPM: Ценообразование',
    titleUz: 'DSPM: Narxlash',
    description: 'Pricing — работа с ценами и ценниками',
    descriptionUz: 'Pricing — narxlar va narx yorliqlari bilan ishlash',
    icon: '💰',
    color: '#1D4ED8',
    stepsRange: [61, 70]
  },
  {
    id: 8,
    territoryId: 2,
    title: 'DSPM: Мерчандайзинг',
    titleUz: 'DSPM: Merchandayzing',
    description: 'Merchandising — визуальное оформление',
    descriptionUz: 'Merchandising — vizual bezash',
    icon: '🎨',
    color: '#1E40AF',
    stepsRange: [71, 80]
  },
  {
    id: 9,
    territoryId: 2,
    title: '8 шагов визита (часть 1)',
    titleUz: '8 qadam tashrif (1-qism)',
    description: 'Подготовка, приветствие, осмотр, анализ',
    descriptionUz: 'Tayyorgarlik, salomlashish, ko\'rik, tahlil',
    icon: '👣',
    color: '#1E3A8A',
    stepsRange: [81, 90]
  },
  {
    id: 10,
    territoryId: 2,
    title: '8 шагов визита (часть 2)',
    titleUz: '8 qadam tashrif (2-qism)',
    description: 'Презентация, работа с заказом, завершение',
    descriptionUz: 'Taqdimot, buyurtma bilan ishlash, yakunlash',
    icon: '🚶',
    color: '#172554',
    stepsRange: [91, 100]
  },

  // === ТЕРРИТОРИЯ ЭКСПЕРТА (101-140) ===
  {
    id: 11,
    territoryId: 3,
    title: 'ФУП: Формат убедительных продаж',
    titleUz: 'FUP: Ishonchli savdo formati',
    description: 'Техника FAB и презентация выгод',
    descriptionUz: 'FAB texnikasi va foyda taqdimoti',
    icon: '💎',
    color: '#8B5CF6',
    stepsRange: [101, 110]
  },
  {
    id: 12,
    territoryId: 3,
    title: 'Работа с возражениями',
    titleUz: 'E\'tirozlar bilan ishlash',
    description: 'Техники преодоления возражений клиентов',
    descriptionUz: 'Mijoz e\'tirozlarini yengish texnikasi',
    icon: '🛡️',
    color: '#7C3AED',
    stepsRange: [111, 120]
  },
  {
    id: 13,
    territoryId: 3,
    title: 'Психология клиента',
    titleUz: 'Mijoz psixologiyasi',
    description: 'Типы клиентов и подходы к каждому',
    descriptionUz: 'Mijoz turlari va har biriga yondashuvlar',
    icon: '🧠',
    color: '#6D28D9',
    stepsRange: [121, 130]
  },
  {
    id: 14,
    territoryId: 3,
    title: 'Конкурентная борьба',
    titleUz: 'Raqobat kurashi',
    description: 'Анализ конкурентов и позиционирование',
    descriptionUz: 'Raqobatchilar tahlili va pozitsiyalash',
    icon: '⚡',
    color: '#5B21B6',
    stepsRange: [131, 140]
  },

  // === ТЕРРИТОРИЯ МАСТЕРА (141-160) ===
  {
    id: 15,
    territoryId: 4,
    title: 'Анализ территории',
    titleUz: 'Hudud tahlili',
    description: 'Планирование и оптимизация маршрутов',
    descriptionUz: 'Marshrutlarni rejalashtirish va optimallashtirish',
    icon: '🗺️',
    color: '#F59E0B',
    stepsRange: [141, 150]
  },
  {
    id: 16,
    territoryId: 4,
    title: 'Наставничество',
    titleUz: 'Murabbiylik',
    description: 'Развитие команды и передача опыта',
    descriptionUz: 'Jamoa rivojlanishi va tajriba uzatish',
    icon: '🎓',
    color: '#D97706',
    stepsRange: [151, 160]
  }
];

// ===========================================
// ФУНКЦИИ ПОМОЩНИКИ
// ===========================================

export function getTerritoryByStep(stepId: number): Territory | undefined {
  return territories.find(t => stepId >= t.stepsRange[0] && stepId <= t.stepsRange[1]);
}

export function getModuleByStep(stepId: number): Module | undefined {
  return modules.find(m => stepId >= m.stepsRange[0] && stepId <= m.stepsRange[1]);
}

export function getTerritoryProgress(completedSteps: number[], territory: Territory): number {
  const territorySteps = completedSteps.filter(
    s => s >= territory.stepsRange[0] && s <= territory.stepsRange[1]
  );
  const totalSteps = territory.stepsRange[1] - territory.stepsRange[0] + 1;
  return Math.round((territorySteps.length / totalSteps) * 100);
}

export function getModulesByTerritory(territoryId: number): Module[] {
  return modules.filter(m => m.territoryId === territoryId);
}

export function isTerritoryCompleted(unlockedCards: number, territory: Territory): boolean {
  return unlockedCards >= territory.requiredCards;
}

export function getTerritoryStarStatus(unlockedCards: number, territory: Territory): 'locked' | 'in_progress' | 'completed' {
  if (unlockedCards >= territory.requiredCards) return 'completed';
  if (unlockedCards > 0) return 'in_progress';
  return 'locked';
}

// ===========================================
// КОНСТАНТЫ
// ===========================================

export const TOTAL_STEPS = 160;
export const TOTAL_TERRITORIES = 4;
export const TOTAL_MODULES = 16;
export const TOTAL_PRODUCT_CARDS = 26;
