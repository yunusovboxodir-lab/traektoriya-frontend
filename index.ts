// ===========================================
// ЭКСПОРТ ДАННЫХ КУРСА "160 ШАГОВ К ЭКСПЕРТУ"
// ===========================================

// Структура курса
export {
  levels,
  modules,
  checkpoints,
  getLevelByStep,
  getModuleByStep,
  getCheckpointAfterStep,
  getLevelProgress,
  type Level,
  type Module,
  type Checkpoint,
  type Step,
  type QuizQuestion,
  type PracticeTask,
  type Badge,
  type UserLevel,
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
  productStats,
  type Product,
  type ProductCategory,
  type ProductCategoryInfo
} from './productLibrary';

// ===========================================
// КОНСТАНТЫ КУРСА
// ===========================================

export const COURSE_INFO = {
  id: 'nmedov-160-steps',
  title: '160 шагов к эксперту N\'Medov',
  titleUz: 'N\'Medov ekspertiga 160 qadam',
  description: 'Полный курс обучения торгового представителя',
  descriptionUz: 'Savdo vakili uchun to\'liq o\'quv kursi',
  totalSteps: 160,
  totalLevels: 4,
  totalModules: 16,
  totalCheckpoints: 12,
  estimatedHours: 40,
  version: '2.0'
};

// ===========================================
// БЕЙДЖИ ЗА ДОСТИЖЕНИЯ
// ===========================================

export const achievementBadges = [
  // Уровневые бейджи
  { id: 'trainee_complete', icon: '🌱', title: 'Стажёр', titleUz: 'Stajer', description: 'Пройден уровень Стажёр' },
  { id: 'agent_complete', icon: '⚔️', title: 'Агент', titleUz: 'Agent', description: 'Пройден уровень Агент' },
  { id: 'pro_complete', icon: '🎯', title: 'Профи', titleUz: 'Profi', description: 'Пройден уровень Профи' },
  { id: 'leader_complete', icon: '👑', title: 'Лидер', titleUz: 'Lider', description: 'Пройден уровень Лидер' },
  
  // Модульные бейджи
  { id: 'welcome_complete', icon: '👋', title: 'Добро пожаловать!', titleUz: 'Xush kelibsiz!', description: 'Введение пройдено' },
  { id: 'portrait_complete', icon: '👤', title: 'Знаю себя', titleUz: 'O\'zimni bilaman', description: 'Портрет ТП пройден' },
  { id: 'tools_complete', icon: '🛠️', title: 'Вооружён', titleUz: 'Qurollangan', description: 'Инструменты освоены' },
  { id: 'visit_basics_complete', icon: '📋', title: 'Первый визит', titleUz: 'Birinchi tashrif', description: 'Основы визита пройдены' },
  { id: 'distribution_complete', icon: '📦', title: 'Мастер дистрибуции', titleUz: 'Distribyutsiya ustasi', description: 'DSPM Дистрибуция пройден' },
  { id: 'shelving_complete', icon: '📊', title: 'Мастер выкладки', titleUz: 'Joylashtirish ustasi', description: 'DSPM Выкладка пройден' },
  { id: 'pricing_complete', icon: '💰', title: 'Ценовой эксперт', titleUz: 'Narx eksperti', description: 'DSPM Ценообразование пройден' },
  { id: 'merchandising_complete', icon: '🎨', title: 'Мерчандайзер', titleUz: 'Merchandayzer', description: 'DSPM Мерчандайзинг пройден' },
  { id: 'visit_steps_complete', icon: '👣', title: '8 шагов', titleUz: '8 qadam', description: '8 шагов визита пройдены' },
  { id: 'fup_complete', icon: '💎', title: 'Убедительный', titleUz: 'Ishonchli', description: 'ФУП пройден' },
  { id: 'objections_complete', icon: '🛡️', title: 'Непробиваемый', titleUz: 'Buzilmas', description: 'Работа с возражениями пройдена' },
  { id: 'psychology_complete', icon: '🧠', title: 'Психолог', titleUz: 'Psixolog', description: 'Психология клиента пройдена' },
  { id: 'competition_complete', icon: '⚡', title: 'Конкурент', titleUz: 'Raqobatchi', description: 'Конкурентная борьба пройдена' },
  { id: 'territory_complete', icon: '🗺️', title: 'Стратег', titleUz: 'Strateg', description: 'Анализ территории пройден' },
  { id: 'mentoring_complete', icon: '🎓', title: 'Наставник', titleUz: 'Murabbiy', description: 'Наставничество пройдено' },
  
  // Специальные бейджи
  { id: 'first_step', icon: '🎉', title: 'Первый шаг', titleUz: 'Birinchi qadam', description: 'Первый урок пройден' },
  { id: 'week_streak', icon: '🔥', title: '7 дней подряд', titleUz: '7 kun ketma-ket', description: 'Неделя без пропусков' },
  { id: 'month_streak', icon: '💪', title: '30 дней подряд', titleUz: '30 kun ketma-ket', description: 'Месяц без пропусков' },
  { id: 'product_master', icon: '🏆', title: 'Знаток продуктов', titleUz: 'Mahsulot bilimdon', description: 'Все продукты изучены' },
  { id: 'speed_learner', icon: '⚡', title: 'Быстрый ученик', titleUz: 'Tez o\'quvchi', description: '10 уроков за день' },
  { id: 'perfect_score', icon: '💯', title: 'Отличник', titleUz: 'A\'lochi', description: '100% на тесте' },
  { id: 'course_complete', icon: '🏅', title: 'Эксперт N\'Medov', titleUz: 'N\'Medov eksperti', description: 'Курс полностью пройден' }
];

// ===========================================
// УРОВНИ ПОЛЬЗОВАТЕЛЯ (Геймификация)
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
