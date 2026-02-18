import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useScopeStore } from './stores/scopeStore';
import { Layout } from './components/layout';
import { ToastContainer } from './components/ui/ToastContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy-loaded pages for code splitting (with auto-retry on chunk load errors)
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LearningPage = lazyWithRetry(() => import('./pages/LearningPage').then(m => ({ default: m.LearningPage })));
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazyWithRetry(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const TasksPage = lazyWithRetry(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const TeamPage = lazyWithRetry(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })));
const AssessmentsPage = lazyWithRetry(() => import('./pages/AssessmentsPage').then(m => ({ default: m.AssessmentsPage })));
const GenerationPage = lazyWithRetry(() => import('./pages/GenerationPage').then(m => ({ default: m.GenerationPage })));
const PlanogramPage = lazyWithRetry(() => import('./pages/PlanogramPage').then(m => ({ default: m.PlanogramPage })));
const AnalyticsPage = lazyWithRetry(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const KnowledgeBasePage = lazyWithRetry(() => import('./pages/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const KPIPage = lazyWithRetry(() => import('./pages/KPIPage').then(m => ({ default: m.KPIPage })));
const ChatPage = lazyWithRetry(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const QuizPage = lazyWithRetry(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const RolesPage = lazyWithRetry(() => import('./pages/RolesPage').then(m => ({ default: m.RolesPage })));
const GoalsPage = lazyWithRetry(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })));

// ===========================================
// ЗАЩИЩЁННЫЙ РОУТ С LAYOUT
// Если не авторизован → редирект на /login
// ===========================================
function ProtectedRoute({ children, pageKey }: { children: React.ReactNode; pageKey?: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isPageAllowed = useScopeStore((state) => state.isPageAllowed);
  const getFirstAllowedPath = useScopeStore((state) => state.getFirstAllowedPath);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If pageKey specified and user doesn't have access — redirect to first allowed page
  if (pageKey && !isPageAllowed(pageKey)) {
    return <Navigate to={getFirstAllowedPath()} replace />;
  }

  return <Layout>{children}</Layout>;
}

// ===========================================
// ПУБЛИЧНЫЙ РОУТ
// Если уже авторизован → редирект на первую разрешённую страницу
// ===========================================
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getFirstAllowedPath = useScopeStore((state) => state.getFirstAllowedPath);

  if (isAuthenticated) {
    return <Navigate to={getFirstAllowedPath()} replace />;
  }

  return <>{children}</>;
}

// ===========================================
// УМНЫЙ РЕДИРЕКТ — на первую разрешённую страницу
// ===========================================
function SmartRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getFirstAllowedPath = useScopeStore((state) => state.getFirstAllowedPath);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getFirstAllowedPath()} replace />;
}

// ===========================================
// РОУТЫ ПРИЛОЖЕНИЯ
// ===========================================
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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

      {/* Дашборд — только admin/superadmin */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute pageKey="dashboard">
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Обучение */}
      <Route
        path="/learning"
        element={
          <ProtectedRoute pageKey="learning">
            <LearningPage />
          </ProtectedRoute>
        }
      />

      {/* Товары */}
      <Route
        path="/products"
        element={
          <ProtectedRoute pageKey="products">
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId"
        element={
          <ProtectedRoute pageKey="products">
            <ProductDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Задачи / Kanban */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute pageKey="tasks">
            <TasksPage />
          </ProtectedRoute>
        }
      />

      {/* Команда */}
      <Route
        path="/team"
        element={
          <ProtectedRoute pageKey="team">
            <TeamPage />
          </ProtectedRoute>
        }
      />

      {/* Оценка */}
      <Route
        path="/assessments"
        element={
          <ProtectedRoute pageKey="assessments">
            <AssessmentsPage />
          </ProtectedRoute>
        }
      />

      {/* AI Генерация */}
      <Route
        path="/generation"
        element={
          <ProtectedRoute pageKey="generation">
            <GenerationPage />
          </ProtectedRoute>
        }
      />

      {/* Планограмма AI */}
      <Route
        path="/planogram"
        element={
          <ProtectedRoute pageKey="planogram">
            <PlanogramPage />
          </ProtectedRoute>
        }
      />

      {/* Аналитика */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute pageKey="analytics">
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* База знаний */}
      <Route
        path="/knowledge-base"
        element={
          <ProtectedRoute pageKey="knowledge-base">
            <KnowledgeBasePage />
          </ProtectedRoute>
        }
      />

      {/* KPI и Рейтинг */}
      <Route
        path="/kpi"
        element={
          <ProtectedRoute pageKey="kpi">
            <KPIPage />
          </ProtectedRoute>
        }
      />

      {/* AI-Консультант */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute pageKey="chat">
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Цели и достижения */}
      <Route
        path="/goals"
        element={
          <ProtectedRoute pageKey="goals">
            <GoalsPage />
          </ProtectedRoute>
        }
      />

      {/* Управление ролями (admin+) */}
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute pageKey="admin-roles">
            <RolesPage />
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

      {/* Редирект по умолчанию → первая разрешённая страница */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
    </Suspense>
  );
}

// ===========================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// ===========================================
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
