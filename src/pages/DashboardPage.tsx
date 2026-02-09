import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cards = [
    { title: 'Обучение', desc: 'Курсы и тренинги', icon: '📚', path: '/learning', color: 'from-blue-500 to-blue-600' },
    { title: 'AI Генерация', desc: 'Создание уроков с помощью ИИ', icon: '🤖', path: '/generation', color: 'from-indigo-500 to-indigo-600' },
    { title: 'Planogram AI', desc: 'Анализ выкладки', icon: '📸', path: '/planogram', color: 'from-purple-500 to-purple-600' },
    { title: 'Команда', desc: 'Управление персоналом', icon: '👥', path: '/team', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Traektoriya</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.full_name || 'Пользователь'}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Выйти</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Добро пожаловать!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Link key={card.path} to={card.path} className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-2xl mb-4`}>
                  {card.icon}
                </div>
                <h3 className="font-semibold text-lg group-hover:text-blue-600">{card.title}</h3>
                <p className="text-gray-500 text-sm">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
