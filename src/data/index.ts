// Экспорт курсов
export * from './salesRepCourse';

// Типы для системы обучения
export type CourseType = 'sales_rep' | 'supervisor';
export type UserRole = 'agent' | 'supervisor' | 'manager' | 'admin';

// Конфигурация доступа к курсам по ролям
export const courseAccess: Record<UserRole, CourseType[]> = {
    agent: ['sales_rep'],
    supervisor: ['sales_rep', 'supervisor'],
    manager: ['sales_rep', 'supervisor'],
    admin: ['sales_rep', 'supervisor']
};

// Глобальные достижения
export const globalBadges = [
  { id: 'first_login', icon: '👋', title: 'Добро пожаловать', titleUz: 'Xush kelibsiz', description: 'Первый вход в систему' },
  { id: 'first_step', icon: '🎉', title: 'Первый шаг', titleUz: 'Birinchi qadam', description: 'Начал обучение' },
  { id: 'week_streak', icon: '🔥', title: 'Неделя подряд', titleUz: 'Hafta davomida', description: '7 дней обучения подряд' },
  { id: 'month_streak', icon: '💎', title: 'Месяц подряд', titleUz: 'Oy davomida', description: '30 дней обучения подряд' },
  ];

// Уровни пользователя
export const userLevels = [
  { level: 1, title: 'Новичок', titleUz: 'Yangi', minPoints: 0, icon: '🌱' },
  { level: 2, title: 'Ученик', titleUz: 'Oquvchi', minPoints: 100, icon: '📖' },
  { level: 3, title: 'Практик', titleUz: 'Amaliyotchi', minPoints: 300, icon: '✍️' },
  { level: 4, title: 'Специалист', titleUz: 'Mutaxassis', minPoints: 600, icon: '⭐' },
  { level: 5, title: 'Эксперт', titleUz: 'Ekspert', minPoints: 1000, icon: '🎓' },
  { level: 6, title: 'Мастер', titleUz: 'Usta', minPoints: 1500, icon: '🏆' },
  { level: 7, title: 'Гуру', titleUz: 'Guru', minPoints: 2000, icon: '👑' },
  ];

// Функция определения уровня по баллам
export function getUserLevel(points: number) {
    let currentLevel = userLevels[0];
    for (const level of userLevels) {
          if (points >= level.minPoints) {
                  currentLevel = level;
          } else { break; }
    }
    const nextLevel = userLevels.find(l => l.level === currentLevel.level + 1);
    const progress = nextLevel 
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
          : 100;
    return { ...currentLevel, progress: Math.min(100, Math.max(0, progress)), nextLevel };
}
