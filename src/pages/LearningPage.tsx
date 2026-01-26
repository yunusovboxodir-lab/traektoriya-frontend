import { useState } from 'react';
import { Link } from 'react-router-dom';

// Демо-данные курсов (потом будут загружаться с API)
const DEMO_COURSES = [
  {
    id: 1,
    code: 'PRODUCT_101',
    title: 'Ассортимент N\'Medov',
    description: 'Изучите весь ассортимент продукции: шоколадная паста, лапша, батончики, печенье',
    thumbnail: '🍫',
    duration: 45,
    lessons: 8,
    progress: 75,
    status: 'in_progress',
    isRequired: true,
    competency: 'Знание продукта'
  },
  {
    id: 2,
    code: 'VISIT_8STEPS',
    title: '8 шагов визита',
    description: 'Стандарт проведения визита в торговую точку: от подготовки до анализа',
    thumbnail: '👣',
    duration: 60,
    lessons: 10,
    progress: 100,
    status: 'completed',
    isRequired: true,
    competency: 'Техника продаж'
  },
  {
    id: 3,
    code: 'MERCH_101',
    title: 'Основы мерчандайзинга',
    description: 'Планограммы, выкладка, золотая полка, POS-материалы',
    thumbnail: '📊',
    duration: 40,
    lessons: 6,
    progress: 0,
    status: 'not_started',
    isRequired: true,
    competency: 'Мерчандайзинг'
  },
  {
    id: 4,
    code: 'OBJECTIONS',
    title: 'Работа с возражениями',
    description: 'Техники преодоления возражений клиентов: "дорого", "не продаётся", "нет места"',
    thumbnail: '💬',
    duration: 35,
    lessons: 5,
    progress: 0,
    status: 'not_started',
    isRequired: false,
    competency: 'Техника продаж'
  },
  {
    id: 5,
    code: 'PLANOGRAM_CHOCO',
    title: 'Планограмма: Шоколадная паста',
    description: 'Правила выкладки Chococream и Chocotella, KPI по доле полки',
    thumbnail: '🏪',
    duration: 20,
    lessons: 3,
    progress: 0,
    status: 'not_started',
    isRequired: false,
    competency: 'Мерчандайзинг'
  }
];

const DEMO_ACHIEVEMENTS = [
  { id: 1, icon: '🎓', title: 'Первый курс', description: 'Завершите первый курс', earned: true },
  { id: 2, icon: '⚡', title: 'Быстрый старт', description: '3 курса за первую неделю', earned: true },
  { id: 3, icon: '🏆', title: 'Отличник', description: 'Все тесты на 100%', earned: false },
  { id: 4, icon: '📚', title: 'Эксперт', description: 'Пройдите все курсы', earned: false },
];

const DEMO_LEADERBOARD = [
  { rank: 1, name: 'Алишер К.', points: 1250, courses: 8 },
  { rank: 2, name: 'Дилшод М.', points: 1100, courses: 7 },
  { rank: 3, name: 'Саида Р.', points: 980, courses: 6 },
  { rank: 4, name: 'Вы', points: 450, courses: 2, isCurrentUser: true },
  { rank: 5, name: 'Бобур А.', points: 400, courses: 2 },
];

type TabType = 'courses' | 'progress' | 'leaderboard';

export function LearningPage() {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCourses = DEMO_COURSES.filter(course => {
    if (filterStatus === 'all') return true;
    return course.status === filterStatus;
  });

  const completedCourses = DEMO_COURSES.filter(c => c.status === 'completed').length;
  const totalPoints = completedCourses * 100 + DEMO_COURSES.filter(c => c.status === 'in_progress').reduce((acc, c) => acc + c.progress, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">✓ Завершён</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">▶ В процессе</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">○ Не начат</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">← Назад</Link>
            <h1 className="text-xl font-bold">📚 Обучение</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Ваши баллы</div>
              <div className="text-xl font-bold text-blue-600">{totalPoints} ⭐</div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{completedCourses}</div>
            <div className="text-sm text-gray-500">Курсов пройдено</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{Math.round(completedCourses / DEMO_COURSES.length * 100)}%</div>
            <div className="text-sm text-gray-500">Общий прогресс</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{DEMO_ACHIEVEMENTS.filter(a => a.earned).length}</div>
            <div className="text-sm text-gray-500">Достижений</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-orange-600">#4</div>
            <div className="text-sm text-gray-500">Место в рейтинге</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'courses', label: '📖 Курсы' },
            { id: 'progress', label: '📈 Мой прогресс' },
            { id: 'leaderboard', label: '🏆 Рейтинг' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'courses' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'all', label: 'Все' },
                { id: 'in_progress', label: 'В процессе' },
                { id: 'not_started', label: 'Не начаты' },
                { id: 'completed', label: 'Завершены' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    filterStatus === filter.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <div
                  key={course.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer ${
                    course.status === 'completed' ? 'border-2 border-green-200' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{course.thumbnail}</div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(course.status)}
                        {course.isRequired && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                            Обязательный
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <span>🕐 {course.duration} мин</span>
                      <span>📝 {course.lessons} уроков</span>
                    </div>

                    <div className="text-xs text-gray-400 mb-2">
                      Компетенция: {course.competency}
                    </div>

                    {/* Progress Bar */}
                    {course.progress > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Прогресс</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      className={`w-full mt-4 py-2 rounded-lg font-medium transition ${
                        course.status === 'completed'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : course.status === 'in_progress'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {course.status === 'completed' ? '✓ Пройти заново' : 
                       course.status === 'in_progress' ? '▶ Продолжить' : '○ Начать'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competencies Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">📊 Развитие компетенций</h3>
              <div className="space-y-4">
                {[
                  { name: 'Знание продукта', current: 2, target: 2, progress: 75 },
                  { name: 'Техника продаж', current: 2, target: 2, progress: 60 },
                  { name: 'Мерчандайзинг', current: 1, target: 2, progress: 30 },
                  { name: 'Работа с CRM', current: 1, target: 2, progress: 50 },
                  { name: 'Коммуникация', current: 2, target: 2, progress: 80 },
                ].map((comp, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{comp.name}</span>
                      <span className="text-gray-500">
                        Уровень {comp.current}/{comp.target}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${comp.progress >= 70 ? 'bg-green-500' : comp.progress >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                        style={{ width: `${comp.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">🏅 Достижения</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_ACHIEVEMENTS.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      achievement.earned
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{achievement.icon}</div>
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Path */}
            <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
              <h3 className="font-bold text-lg mb-4">🛤️ Путь обучения</h3>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {DEMO_COURSES.map((course, i) => (
                  <div key={course.id} className="flex items-center">
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 ${
                        course.status === 'completed'
                          ? 'bg-green-100 border-green-500'
                          : course.status === 'in_progress'
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      {course.status === 'completed' ? '✓' : course.thumbnail}
                    </div>
                    {i < DEMO_COURSES.length - 1 && (
                      <div className={`w-8 h-1 ${
                        course.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {DEMO_COURSES.map(course => (
                  <div key={course.id} className="w-16 text-center truncate">
                    {course.title.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg">🏆 Рейтинг сотрудников</h3>
              <p className="text-sm text-gray-500">Этот месяц</p>
            </div>
            <div className="divide-y">
              {DEMO_LEADERBOARD.map(user => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-4 p-4 ${
                    user.isCurrentUser ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-yellow-400 text-white' :
                    user.rank === 2 ? 'bg-gray-300 text-white' :
                    user.rank === 3 ? 'bg-orange-400 text-white' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${user.isCurrentUser ? 'text-blue-600' : ''}`}>
                      {user.name} {user.isCurrentUser && '(Вы)'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.courses} курсов пройдено
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{user.points}</div>
                    <div className="text-sm text-gray-400">баллов</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
