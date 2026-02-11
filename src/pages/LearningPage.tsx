import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  // Загрузить курсы при монтировании
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await coursesApi.getCourses(0, 50);
      setCourses(response.data.items || []);
      setError('');
    } catch {
      setError('Ошибка при загрузке курсов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course);
    setShowContent(true);

    try {
      const response = await coursesApi.getCourseContent(course.id);
      setCourseContent(response.data.items || []);
    } catch {
      setCourseContent([]);
    }
  };

  const handleContentClick = (item: ContentItem) => {
    if (item.content_type === 'quiz' && selectedCourse) {
      navigate(`/quiz/${item.id}`, {
        state: { quiz: item, courseId: selectedCourse.id },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Сообщение об ошибке */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Если курс не выбран */}
      {!showContent ? (
        <div>
          <h1 className="text-2xl font-bold mb-8 text-gray-800">Доступные курсы</h1>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📚</div>
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
                    <div className="text-5xl">📚</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{course.code}</span>
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
            className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            &larr; Назад к курсам
          </button>

          {selectedCourse && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {selectedCourse.title}
              </h2>
              <p className="text-gray-600 mb-8">{selectedCourse.description}</p>

              <h3 className="text-xl font-bold mb-6 text-gray-800">Содержание</h3>

              {courseContent.length === 0 ? (
                <div className="text-center py-8 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Контент этого курса ещё не загружен</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseContent.map((item, idx) => {
                    const isQuiz = item.content_type === 'quiz';
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleContentClick(item)}
                        className={`bg-white p-6 rounded-lg shadow-md border-l-4 transition ${
                          isQuiz
                            ? 'border-orange-500 hover:shadow-lg cursor-pointer hover:bg-orange-50'
                            : 'border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">
                            {isQuiz ? '📝' : '📖'}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                              {idx + 1}. {item.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.content?.substring(0, 200)}...
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded-full ${
                                isQuiz
                                  ? 'bg-orange-100 text-orange-700 font-medium'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {isQuiz ? 'Тест' : 'Урок'}
                              </span>
                              <span>v{item.version}</span>
                            </div>
                            {isQuiz && (
                              <p className="text-xs text-orange-600 mt-2 font-medium">
                                Нажмите чтобы пройти тест &rarr;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
