// ===========================================
// ЭКСПОРТ ДАННЫХ КУРСА "160 ШАГОВ К ЭКСПЕРТУ"
// ===========================================

// Структура курса (территории)
export {
  territories,
  modules,
  getTerritoryByStep,
  getModuleByStep,
  getTerritoryProgress,
  getModulesByTerritory,
  isTerritoryCompleted,
  getTerritoryStarStatus,
  TOTAL_STEPS,
  TOTAL_TERRITORIES,
  TOTAL_MODULES,
  TOTAL_PRODUCT_CARDS,
  type Territory,
  type Module,
  type Step,
  type QuizQuestion,
  type PracticeTask,
  type Badge,
  type TerritoryKey,
  type StepType
} from './courseStructure';

// Библиотека продуктов
export {
  products,
  productCategories,
  getProductsByCategory,
  getProductById,
  getBestsellers,
  getNewProducts,
  getRandomProducts,
  getCategoryInfo,
  TOTAL_PRODUCTS,
  QUIZ_PASS_THRESHOLD,
  type Product,
  type ProductCategory,
  type ProductCategoryInfo,
  type ProductQuiz
} from './productLibrary';

// ===========================================
// ИНФОРМАЦИЯ О КУРСЕ
// ===========================================

export const COURSE_INFO = {
  id: 'nmedov-160-steps',
  title: '160 шагов к эксперту N\'Medov',
  titleUz: 'N\'Medov ekspertiga 160 qadam',
  description: 'Карта компетенций торгового представителя',
  descriptionUz: 'Savdo vakili kompetensiya xaritasi',
  totalSteps: 160,
  totalTerritories: 4,
  totalModules: 16,
  totalProducts: 26,
  estimatedHours: 40,
  version: '2.0'
};

// ===========================================
// ЛИМИТЫ КАРТОЧЕК ПО ТЕРРИТОРИЯМ
// ===========================================

export const TERRITORY_CARD_LIMITS = {
  novice: 7,   // Территория Новичка
  agent: 13,   // Территория Агента
  expert: 20,  // Территория Эксперта
  master: 26   // Территория Мастера (все)
};

// ===========================================
// БЕЙДЖИ ЗА ДОСТИЖЕНИЯ
// ===========================================

export const achievementBadges = [
  // Территориальные бейджи
  { id: 'novice_star', icon: '🌱', title: 'Звезда Новичка', titleUz: 'Yangi xodim yulduzi', description: 'Территория Новичка закрыта' },
  { id: 'agent_star', icon: '⚔️', title: 'Звезда Агента', titleUz: 'Agent yulduzi', description: 'Территория Агента закрыта' },
  { id: 'expert_star', icon: '🎯', title: 'Звезда Эксперта', titleUz: 'Ekspert yulduzi', description: 'Территория Эксперта закрыта' },
  { id: 'master_star', icon: '👑', title: 'Звезда Мастера', titleUz: 'Usta yulduzi', description: 'Территория Мастера закрыта' },
  
  // Продуктовые бейджи
  { id: 'first_card', icon: '🃏', title: 'Первая карточка', titleUz: 'Birinchi kartochka', description: 'Первый продукт разблокирован' },
  { id: 'category_master_paste', icon: '🍫', title: 'Знаток паст', titleUz: 'Pasta bilimdon', description: 'Все пасты разблокированы' },
  { id: 'category_master_noodles', icon: '🍜', title: 'Знаток лапши', titleUz: 'Makaron bilimdon', description: 'Вся лапша разблокирована' },
  { id: 'category_master_bars', icon: '🍫', title: 'Знаток батончиков', titleUz: 'Batoncik bilimdon', description: 'Все батончики разблокированы' },
  { id: 'category_master_cookies', icon: '🍪', title: 'Знаток печенья', titleUz: 'Pechene bilimdon', description: 'Всё печенье разблокировано' },
  { id: 'product_master', icon: '🏆', title: 'Мастер продуктов', titleUz: 'Mahsulot ustasi', description: 'Все 26 продуктов разблокированы' },
  
  // Учебные бейджи
  { id: 'first_lesson', icon: '📖', title: 'Первый урок', titleUz: 'Birinchi dars', description: 'Первый урок пройден' },
  { id: 'module_complete', icon: '📚', title: 'Модуль закрыт', titleUz: 'Modul yopildi', description: 'Первый модуль полностью пройден' },
  { id: 'perfect_quiz', icon: '💯', title: 'Отличник', titleUz: 'A\'lochi', description: '100% на тесте продукта' },
  { id: 'speed_learner', icon: '⚡', title: 'Быстрый ученик', titleUz: 'Tez o\'quvchi', description: '5 уроков за день' },
  { id: 'week_streak', icon: '🔥', title: '7 дней подряд', titleUz: '7 kun ketma-ket', description: 'Неделя без пропусков' },
  
  // Финальные бейджи
  { id: 'course_complete', icon: '🎓', title: 'Эксперт N\'Medov', titleUz: 'N\'Medov eksperti', description: 'Курс полностью пройден' }
];

// ===========================================
// УРОВНИ ПОЛЬЗОВАТЕЛЯ (по баллам)
// ===========================================

export const userLevels = [
  { level: 1, title: 'Новичок', titleUz: 'Yangi', minPoints: 0, icon: '🌱' },
  { level: 2, title: 'Ученик', titleUz: 'Shogird', minPoints: 100, icon: '📚' },
  { level: 3, title: 'Стажёр', titleUz: 'Stajer', minPoints: 300, icon: '🎒' },
  { level: 4, title: 'Помощник', titleUz: 'Yordamchi', minPoints: 600, icon: '🤝' },
  { level: 5, title: 'Агент', titleUz: 'Agent', minPoints: 1000, icon: '⚔️' },
  { level: 6, title: 'Специалист', titleUz: 'Mutaxassis', minPoints: 1500, icon: '🎯' },
  { level: 7, title: 'Профи', titleUz: 'Profi', minPoints: 2200, icon: '💎' },
  { level: 8, title: 'Эксперт', titleUz: 'Ekspert', minPoints: 3000, icon: '🏆' },
  { level: 9, title: 'Мастер', titleUz: 'Usta', minPoints: 4000, icon: '👑' },
  { level: 10, title: 'Легенда', titleUz: 'Afsona', minPoints: 5000, icon: '🌟' }
];

export function getUserLevel(points: number) {
  const level = [...userLevels].reverse().find(l => points >= l.minPoints);
  return level || userLevels[0];
}

export function getNextLevel(points: number) {
  const currentIndex = userLevels.findIndex(l => l.minPoints > points);
  return currentIndex >= 0 ? userLevels[currentIndex] : null;
}

export function getProgressToNextLevel(points: number): number {
  const current = getUserLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  
  const pointsInLevel = points - current.minPoints;
  const pointsNeeded = next.minPoints - current.minPoints;
  return Math.round((pointsInLevel / pointsNeeded) * 100);
}
