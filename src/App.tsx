import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useScopeStore } from './stores/scopeStore';
import { Layout } from './components/layout';
import { ToastContainer } from './components/ui/ToastContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

// ---------------------------------------------------------------------------
// Lazy-loaded pages (with auto-retry on chunk load errors)
// ---------------------------------------------------------------------------

const LandingPage = lazyWithRetry(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Consolidated wrapper pages (tabs inside)
const HomePage = lazyWithRetry(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const TeamHubPage = lazyWithRetry(() => import('./pages/TeamHubPage').then(m => ({ default: m.TeamHubPage })));
const CompetenciesPage = lazyWithRetry(() => import('./pages/CompetenciesPage').then(m => ({ default: m.CompetenciesPage })));
const AIStudioPage = lazyWithRetry(() => import('./pages/AIStudioPage').then(m => ({ default: m.AIStudioPage })));

// Standalone pages (unchanged)
const LearningPage = lazyWithRetry(() => import('./pages/LearningPage').then(m => ({ default: m.LearningPage })));
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazyWithRetry(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const TasksPage = lazyWithRetry(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const PlanogramPage = lazyWithRetry(() => import('./pages/PlanogramPage').then(m => ({ default: m.PlanogramPage })));
const AnalyticsPage = lazyWithRetry(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const GoalsPage = lazyWithRetry(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const QuizPage = lazyWithRetry(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const RolesPage = lazyWithRetry(() => import('./pages/RolesPage').then(m => ({ default: m.RolesPage })));
const ShelfCorrectionPage = lazyWithRetry(() => import('./pages/ShelfCorrectionPage').then(m => ({ default: m.ShelfCorrectionPage })));

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
    return <Navigate to="/landing" replace />;
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
      {/* Лендинг (доступен всегда) */}
      <Route path="/landing" element={<LandingPage />} />

      {/* Страница входа (публичная) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* ==========================================
          ОСНОВНЫЕ СТРАНИЦЫ (10 разделов)
          ========================================== */}

      {/* Главная = Dashboard + KPI (tabs) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute pageKey="dashboard">
            <HomePage />
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

      {/* Команда = Team + Supervisor + AdminUsers (tabs) */}
      <Route
        path="/team"
        element={
          <ProtectedRoute pageKey="team">
            <TeamHubPage />
          </ProtectedRoute>
        }
      />

      {/* Компетенции = Assessments + Matrix + Profiles (tabs) */}
      <Route
        path="/competencies"
        element={
          <ProtectedRoute pageKey="competencies">
            <CompetenciesPage />
          </ProtectedRoute>
        }
      />

      {/* AI Студия = Generation + KnowledgeBase + Chat (tabs) */}
      <Route
        path="/ai-studio"
        element={
          <ProtectedRoute pageKey="ai-studio">
            <AIStudioPage />
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

      {/* Планограмма AI (ShelfScan) */}
      <Route
        path="/planogram"
        element={
          <ProtectedRoute pageKey="planogram">
            <PlanogramPage />
          </ProtectedRoute>
        }
      />

      {/* Аналитика = Overview + AI L&D + Effectiveness + Reports (tabs) */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute pageKey="analytics">
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* ==========================================
          АДМИН-РАЗДЕЛ
          ========================================== */}

      {/* Управление ролями (admin+) */}
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute pageKey="admin-roles">
            <RolesPage />
          </ProtectedRoute>
        }
      />

      {/* Коррекция ShelfScan (admin/supervisor) */}
      <Route
        path="/shelf-corrections"
        element={
          <ProtectedRoute pageKey="shelf-corrections">
            <ShelfCorrectionPage />
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

      {/* ==========================================
          REDIRECTS — обратная совместимость
          ========================================== */}

      {/* Рейтинг → Главная (вкладка KPI) */}
      <Route path="/rating" element={<Navigate to="/dashboard?tab=kpi" replace />} />
      <Route path="/kpi" element={<Navigate to="/dashboard?tab=kpi" replace />} />

      {/* Supervisor → Команда (вкладка Управление) */}
      <Route path="/supervisor" element={<Navigate to="/team?tab=management" replace />} />

      {/* Admin Users → Команда (вкладка Админ) */}
      <Route path="/admin/users" element={<Navigate to="/team?tab=admin" replace />} />

      {/* Оценка / Матрица / Профили → Компетенции */}
      <Route path="/assessments" element={<Navigate to="/competencies" replace />} />
      <Route path="/competency-matrix" element={<Navigate to="/competencies?tab=matrix" replace />} />
      <Route path="/competency-profiles" element={<Navigate to="/competencies?tab=profiles" replace />} />

      {/* AI Генерация / База знаний / Чат → AI Студия */}
      <Route path="/generation" element={<Navigate to="/ai-studio" replace />} />
      <Route path="/knowledge-base" element={<Navigate to="/ai-studio?tab=knowledge" replace />} />
      <Route path="/chat" element={<Navigate to="/ai-studio?tab=chat" replace />} />

      {/* Отчёты → Аналитика (вкладка Отчёты) */}
      <Route path="/reports" element={<Navigate to="/analytics?tab=reports" replace />} />

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
