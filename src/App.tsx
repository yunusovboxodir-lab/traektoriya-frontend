import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { LearningPage } from './pages/LearningPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanogramPage } from './pages/PlanogramPage';
import { TeamPage } from './pages/TeamPage';
import { GenerationPage } from './pages/GenerationPage';
import { QuizPage } from './pages/QuizPage';

// ===========================================
// ЗАЩИЩЁННЫЙ РОУТ
// Если не авторизован → редирект на /login
// ===========================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ===========================================
// ПУБЛИЧНЫЙ РОУТ
// Если уже авторизован → редирект на /learning
// ===========================================
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/learning" replace />;
  }

  return <>{children}</>;
}

// ===========================================
// РОУТЫ ПРИЛОЖЕНИЯ
// ===========================================
function AppRoutes() {
  return (
    <Routes>
      {/* Страница входа */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Страница обучения (защищённая) */}
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <LearningPage />
          </ProtectedRoute>
        }
      />

      {/* Дашборд (защищённый) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Планограмма AI (защищённый) */}
      <Route
        path="/planogram"
        element={
          <ProtectedRoute>
            <PlanogramPage />
          </ProtectedRoute>
        }
      />

      {/* Команда (защищённый) */}
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        }
      />

      {/* AI Генерация уроков (защищённый) */}
      <Route
        path="/generation"
        element={
          <ProtectedRoute>
            <GenerationPage />
          </ProtectedRoute>
        }
      />

      {/* Квиз/Тест (защищённый) */}
      <Route
        path="/quiz/:contentItemId"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />

      {/* Редирект по умолчанию */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ===========================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// ===========================================
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
