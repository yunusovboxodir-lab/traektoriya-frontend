import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const cards = [
    { title: 'Обучение', desc: 'Курсы и тренинги', icon: '📚', path: '/learning', color: 'from-blue-500 to-blue-600' },
    { title: 'Товары', desc: 'Библиотека товаров', icon: '📦', path: '/products', color: 'from-cyan-500 to-cyan-600' },
    { title: 'Задачи', desc: 'Kanban-доска задач', icon: '📋', path: '/tasks', color: 'from-amber-500 to-amber-600' },
    { title: 'Команда', desc: 'Управление персоналом', icon: '👥', path: '/team', color: 'from-green-500 to-green-600' },
    { title: 'Оценка', desc: 'Аттестации и тесты', icon: '✅', path: '/assessments', color: 'from-rose-500 to-rose-600' },
    { title: 'AI Генерация', desc: 'Создание уроков с помощью ИИ', icon: '🤖', path: '/generation', color: 'from-indigo-500 to-indigo-600' },
    { title: 'Планограмма AI', desc: 'Анализ выкладки', icon: '📸', path: '/planogram', color: 'from-purple-500 to-purple-600' },
    { title: 'Аналитика', desc: 'Статистика и отчёты', icon: '📊', path: '/analytics', color: 'from-teal-500 to-teal-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Добро пожаловать{user?.full_name ? `, ${user.full_name}` : ''}!
      </h1>
      <p className="text-gray-500 mb-8">Выберите раздел для работы</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link key={card.path} to={card.path} className="block group">
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all cursor-pointer">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-2xl mb-4`}>
                {card.icon}
              </div>
              <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{card.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
