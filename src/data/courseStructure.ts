// ===========================================
// КУРС "160 ШАГОВ К ЭКСПЕРТУ N'MEDOV"
// Структура: 4 уровня, 16 модулей, 160 шагов
// ===========================================

// ===========================================
// ТИПЫ
// ===========================================

export type UserLevel = 'trainee' | 'agent' | 'pro' | 'leader';
export type StepType = 'theory' | 'practice' | 'quiz' | 'video' | 'case_study' | 'checkpoint';

export interface Level {
  id: number;
  key: UserLevel;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  stepsRange: [number, number];
}

export interface Module {
  id: number;
  levelId: number;
  title: string;
  titleUz: string;
  description: string;
  descriptionUz: string;
  icon: string;
  color: string;
  stepsRange: [number, number];
}

export interface Checkpoint {
  id: number;
  afterStep: number;
  title: string;
  titleUz: string;
  productCount: number; // Сколько продуктов на экзамене
  requiredScore: number; // Минимум для прохождения (%)
}

export interface Step {
  id: number;
  moduleId: number;
  levelId: number;
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
// 4 УРОВНЯ
// ===========================================

export const levels: Level[] = [
  {
    id: 1,
    key: 'trainee',
    title: 'Стажёр',
    titleUz: 'Stajer',
    description: 'Базовые знания и дисциплина. Изучите основы работы торгового представителя.',
    descriptionUz: 'Asosiy bilimlar va intizom. Savdo vakili ishining asoslarini o\'rganing.',
    icon: '🌱',
    color: '#10B981',
    stepsRange: [1, 40]
  },
  {
    id: 2,
    key: 'agent',
    title: 'Агент',
    titleUz: 'Agent',
    description: 'Техники продаж и мерчандайзинг. Освойте DSPM и 8 шагов визита.',
    descriptionUz: 'Savdo texnikasi va merchandayzing. DSPM va 8 qadam tashrifini o\'rganing.',
    icon: '⚔️',
    color: '#3B82F6',
    stepsRange: [41, 100]
  },
  {
    id: 3,
    key: 'pro',
    title: 'Профи',
    titleUz: 'Profi',
    description: 'Продвинутые техники и работа с возражениями. Станьте мастером продаж.',
    descriptionUz: 'Ilg\'or texnikalar va e\'tirozlar bilan ishlash. Savdo ustasi bo\'ling.',
    icon: '🎯',
    color: '#8B5CF6',
    stepsRange: [101, 140]
  },
  {
    id: 4,
    key: 'leader',
    title: 'Лидер',
    titleUz: 'Lider',
    description: 'Аналитика и наставничество. Развивайте команду и территорию.',
    descriptionUz: 'Tahlil va murabbiylik. Jamoa va hududni rivojlantiring.',
    icon: '👑',
    color: '#F59E0B',
    stepsRange: [141, 160]
  }
];

// ===========================================
// 16 МОДУЛЕЙ
// ===========================================

export const modules: Module[] = [
  // === УРОВЕНЬ 1: СТАЖЁР (1-40) ===
  {
    id: 1,
    levelId: 1,
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
    levelId: 1,
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
    levelId: 1,
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
    levelId: 1,
    title: 'Основы визита',
    titleUz: 'Tashrif asoslari',
    description: 'Базовый чек-лист визита в торговую точку',
    descriptionUz: 'Savdo nuqtasiga tashrif uchun asosiy tekshirish ro\'yxati',
    icon: '📋',
    color: '#065F46',
    stepsRange: [31, 40]
  },

  // === УРОВЕНЬ 2: АГЕНТ (41-100) ===
  {
    id: 5,
    levelId: 2,
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
    levelId: 2,
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
    levelId: 2,
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
    levelId: 2,
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
    levelId: 2,
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
    levelId: 2,
    title: '8 шагов визита (часть 2)',
    titleUz: '8 qadam tashrif (2-qism)',
    description: 'Презентация, работа с заказом, завершение',
    descriptionUz: 'Taqdimot, buyurtma bilan ishlash, yakunlash',
    icon: '🚶',
    color: '#172554',
    stepsRange: [91, 100]
  },

  // === УРОВЕНЬ 3: ПРОФИ (101-140) ===
  {
    id: 11,
    levelId: 3,
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
    levelId: 3,
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
    levelId: 3,
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
    levelId: 3,
    title: 'Конкурентная борьба',
    titleUz: 'Raqobat kurashi',
    description: 'Анализ конкурентов и позиционирование',
    descriptionUz: 'Raqobatchilar tahlili va pozitsiyalash',
    icon: '⚡',
    color: '#5B21B6',
    stepsRange: [131, 140]
  },

  // === УРОВЕНЬ 4: ЛИДЕР (141-160) ===
  {
    id: 15,
    levelId: 4,
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
    levelId: 4,
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
// 12 ЗАСТАВ (Checkpoints)
// ===========================================

export const checkpoints: Checkpoint[] = [
  { id: 1, afterStep: 40, title: 'Застава Стажёра', titleUz: 'Stajer to\'sig\'i', productCount: 5, requiredScore: 80 },
  { id: 2, afterStep: 50, title: 'Застава Дистрибуции', titleUz: 'Distribyutsiya to\'sig\'i', productCount: 5, requiredScore: 80 },
  { id: 3, afterStep: 60, title: 'Застава Выкладки', titleUz: 'Joylashtirish to\'sig\'i', productCount: 5, requiredScore: 80 },
  { id: 4, afterStep: 70, title: 'Застава Цен', titleUz: 'Narx to\'sig\'i', productCount: 5, requiredScore: 80 },
  { id: 5, afterStep: 80, title: 'Застава Мерчандайзинга', titleUz: 'Merchandayzing to\'sig\'i', productCount: 5, requiredScore: 80 },
  { id: 6, afterStep: 90, title: 'Застава Визита 1', titleUz: 'Tashrif to\'sig\'i 1', productCount: 5, requiredScore: 80 },
  { id: 7, afterStep: 100, title: 'Застава Агента', titleUz: 'Agent to\'sig\'i', productCount: 5, requiredScore: 85 },
  { id: 8, afterStep: 110, title: 'Застава ФУП', titleUz: 'FUP to\'sig\'i', productCount: 5, requiredScore: 85 },
  { id: 9, afterStep: 120, title: 'Застава Возражений', titleUz: 'E\'tirozlar to\'sig\'i', productCount: 5, requiredScore: 85 },
  { id: 10, afterStep: 130, title: 'Застава Психологии', titleUz: 'Psixologiya to\'sig\'i', productCount: 5, requiredScore: 85 },
  { id: 11, afterStep: 140, title: 'Застава Профи', titleUz: 'Profi to\'sig\'i', productCount: 5, requiredScore: 90 },
  { id: 12, afterStep: 150, title: 'Застава Территории', titleUz: 'Hudud to\'sig\'i', productCount: 5, requiredScore: 90 },
];

// ===========================================
// ФУНКЦИИ ПОМОЩНИКИ
// ===========================================

export function getLevelByStep(stepId: number): Level | undefined {
  return levels.find(l => stepId >= l.stepsRange[0] && stepId <= l.stepsRange[1]);
}

export function getModuleByStep(stepId: number): Module | undefined {
  return modules.find(m => stepId >= m.stepsRange[0] && stepId <= m.stepsRange[1]);
}

export function getCheckpointAfterStep(stepId: number): Checkpoint | undefined {
  return checkpoints.find(c => c.afterStep === stepId);
}

export function getLevelProgress(completedSteps: number[], level: Level): number {
  const levelSteps = completedSteps.filter(
    s => s >= level.stepsRange[0] && s <= level.stepsRange[1]
  );
  const totalSteps = level.stepsRange[1] - level.stepsRange[0] + 1;
  return Math.round((levelSteps.length / totalSteps) * 100);
}
