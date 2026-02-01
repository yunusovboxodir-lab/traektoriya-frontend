import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// ===========================================
// СТРАНИЦА ВХОДА В СИСТЕМУ
// ===========================================
export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Небольшая задержка для UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);
    
    if (success) {
      navigate('/learning');
    } else {
      setError('Неверный логин или пароль');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">Traektoriya</h1>
          <p className="text-gray-500 mt-2">Платформа обучения N'Medov</p>
        </div>

        {/* Форма входа */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Поле логина */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              required
              autoFocus
            />
          </div>

          {/* Поле пароля */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              required
            />
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Кнопка входа */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Вход...
              </span>
            ) : (
              '🚀 Войти'
            )}
          </button>
        </form>

        {/* Подсказка с демо-доступами */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 text-center mb-3">Демо доступы:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border">
              <div className="font-medium text-purple-600">Супервайзер</div>
              <div className="text-gray-500">super / super123</div>
            </div>
            <div className="bg-white p-2 rounded-lg border">
              <div className="font-medium text-blue-600">Агент</div>
              <div className="text-gray-500">agent1 / agent1</div>
            </div>
          </div>
        </div>

        {/* Футер */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © 2025 N'Medov Distribution
        </p>
      </div>
    </div>
  );
}
