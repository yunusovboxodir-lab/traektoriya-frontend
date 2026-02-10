import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout';
import { LoginPage } from './pages/LoginPage';
import { LearningPage } from './pages/LearningPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanogramPage } from './pages/PlanogramPage';
import { TeamPage } from './pages/TeamPage';
import { GenerationPage } from './pages/GenerationPage';
import { QuizPage } from './pages/QuizPage';
import { TasksPage } from './pages/TasksPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// ===========================================
// ЗАЩИЩЁННЫЙ РОУТ С LAYOUT
// Если не авторизован → редирект на /login
// ===========================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// ===========================================
// ПУБЛИЧНЫЙ РОУТ
// Если уже авторизован → редирект на /dashboard
// ===========================================
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ===========================================
// РОУТЫ ПРИЛОЖЕНИЯ
// ===========================================
function AppRoutes() {
  return (
    <Routes>
      {/* Страница входа (публичная) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Дашборд — главная страница */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Обучение */}
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <LearningPage />
          </ProtectedRoute>
        }
      />

      {/* Товары */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId"
        element={
          <ProtectedRoute>
            <ProductDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Задачи / Kanban */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />

      {/* Команда */}
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        }
      />

      {/* Оценка */}
      <Route
        path="/assessments"
        element={
          <ProtectedRoute>
            <AssessmentsPage />
          </ProtectedRoute>
        }
      />

      {/* AI Генерация */}
      <Route
        path="/generation"
        element={
          <ProtectedRoute>
            <GenerationPage />
          </ProtectedRoute>
        }
      />

      {/* Планограмма AI */}
      <Route
        path="/planogram"
        element={
          <ProtectedRoute>
            <PlanogramPage />
          </ProtectedRoute>
        }
      />

      {/* Аналитика */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Квиз/Тест */}
      <Route
        path="/quiz/:contentItemId"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />

      {/* Редирект по умолчанию → Дашборд */}
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
