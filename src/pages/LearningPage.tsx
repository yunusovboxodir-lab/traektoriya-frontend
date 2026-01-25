import { Link } from 'react-router-dom';

export function LearningPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">← Назад</Link>
          <h1 className="text-xl font-bold">Обучение</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Мои курсы</h2>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-500">Раздел в разработке</p>
        </div>
      </main>
    </div>
  );
}
