import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { coursesApi, type Course, type ContentItem } from '../api/courses';

// ===========================================
// СТРАНИЦА ОБУЧЕНИЯ
// ===========================================
export function LearningPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContent, setShowContent] = useState(false);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Загрузить курсы при монтировании
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await coursesApi.getCourses(0, 50);
      setCourses(response.data.courses || []);
      setError('');
    } catch (err: any) {
      setError('Ошибка при загрузке курсов');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course);
    setShowContent(true);

    try {
      const response = await coursesApi.getCourseContent(course.id);
      setCourseContent(response.data || []);
    } catch (err) {
      console.error('Error loading course content:', err);
      setCourseContent([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4"></div>
          <p>Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Traektoriya</h1>
            <p className="text-sm text-gray-500">
              Привет, <span className="font-semibold">{user?.full_name || user?.employee_id}</span>!
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Выход
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Сообщение об ошибке */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Если курс не выбран */}
        {!showContent ? (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Доступные курсы</h2>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Нет доступных курсов</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <div className="text-5xl"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span> {course.category}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {course.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Если курс выбран
          <div>
            <button
              onClick={() => {
                setShowContent(false);
                setSelectedCourse(null);
                setCourseContent([]);
              }}
              className="mb-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
            >
               Назад к курсам
            </button>

            {selectedCourse && (
              <div>
                <h2 className="text-3xl font-bold mb-2 text-gray-800">
                  {selectedCourse.title}
                </h2>
                <p className="text-gray-600 mb-8">{selectedCourse.description}</p>

                <h3 className="text-2xl font-bold mb-6 text-gray-800">Содержание</h3>

                {courseContent.length === 0 ? (
                  <div className="text-center py-8 bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Контент этого курса ещё не загружен</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseContent.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">
                            {item.content_type === 'lesson' ? '' : ''}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                              {idx + 1}. {item.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.content_text.substring(0, 200)}...
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Тип: {item.content_type}</span>
                              <span>v{item.version}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
