import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useScopeStore } from './stores/scopeStore';
import { TacticalLayout } from './components/layout';
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
const TacticalLearningPage = lazyWithRetry(() => import('./pages/TacticalLearningPage').then(m => ({ default: m.TacticalLearningPage })));
const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazyWithRetry(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const TasksPage = lazyWithRetry(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const PlanogramPage = lazyWithRetry(() => import('./pages/PlanogramPage').then(m => ({ default: m.PlanogramPage })));
const AnalyticsPage = lazyWithRetry(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const GoalsPage = lazyWithRetry(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const QuizPage = lazyWithRetry(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })));
const RolesPage = lazyWithRetry(() => import('./pages/RolesPage').then(m => ({ default: m.RolesPage })));
const PulsePipelinePage = lazyWithRetry(() => import('./pages/PulsePipelinePage').then(m => ({ default: m.PulsePipelinePage })));
const OfflinePage = lazyWithRetry(() => import('./pages/OfflinePage').then(m => ({ default: m.OfflinePage })));
const OfflineProgramsPage = lazyWithRetry(() => import('./pages/OfflineProgramsPage').then(m => ({ default: m.OfflineProgramsPage })));
const OfflineProgramEditPage = lazyWithRetry(() => import('./pages/OfflineProgramEditPage').then(m => ({ default: m.OfflineProgramEditPage })));
const OfflineSessionPresenterPage = lazyWithRetry(() => import('./pages/OfflineSessionPresenterPage').then(m => ({ default: m.OfflineSessionPresenterPage })));
const OfflineMobileTestPage = lazyWithRetry(() => import('./pages/OfflineMobileTestPage').then(m => ({ default: m.OfflineMobileTestPage })));
const ShelfCorrectionPage = lazyWithRetry(() => import('./pages/ShelfCorrectionPage').then(m => ({ default: m.ShelfCorrectionPage })));
const DictionaryUZPage = lazyWithRetry(() => import('./pages/DictionaryUZPage').then(m => ({ default: m.DictionaryUZPage })));
const TranslationReviewPage = lazyWithRetry(() => import('./pages/TranslationReviewPage').then(m => ({ default: m.TranslationReviewPage })));
const TrainingPlanPage = lazyWithRetry(() => import('./pages/TrainingPlanPage').then(m => ({ default: m.TrainingPlanPage })));
const TrainingRequestNewPage = lazyWithRetry(() => import('./pages/TrainingRequestNewPage').then(m => ({ default: m.TrainingRequestNewPage })));
const CaseStudioPage = lazyWithRetry(() => import('./pages/CaseStudioPage').then(m => ({ default: m.CaseStudioPage })));
const CaseStudioDetailPage = lazyWithRetry(() => import('./pages/CaseStudioDetailPage').then(m => ({ default: m.CaseStudioDetailPage })));
const CaseStudioNewPage = lazyWithRetry(() => import('./pages/CaseStudioNewPage').then(m => ({ default: m.CaseStudioNewPage })));
const CaseCategoryEditPage = lazyWithRetry(() => import('./pages/CaseCategoryEditPage').then(m => ({ default: m.CaseCategoryEditPage })));
const CaseStudioMyPage = lazyWithRetry(() => import('./pages/CaseStudioMyPage').then(m => ({ default: m.CaseStudioMyPage })));
const CharacterPreview = lazyWithRetry(() => import('./components/learning/blocks/CharacterPreview').then(m => ({ default: m.CharacterPreview })));

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

  return <TacticalLayout>{children}</TacticalLayout>;
}

// ===========================================
// PRESENTER РОУТ — авторизация без Layout (для fullscreen-проектора)
// ===========================================
function PresenterRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// ===========================================
// FULLSCREEN PROTECTED — auth + scope-check, БЕЗ Layout-сайдбара
// (для Tactical-карты, у которой собственный header/menu)
// ===========================================
function FullscreenProtectedRoute({ children, pageKey }: { children: React.ReactNode; pageKey?: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isPageAllowed = useScopeStore((state) => state.isPageAllowed);
  const getFirstAllowedPath = useScopeStore((state) => state.getFirstAllowedPath);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (pageKey && !isPageAllowed(pageKey)) {
    return <Navigate to={getFirstAllowedPath()} replace />;
  }
  return <>{children}</>;
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
      {/* Dev: Character preview (temp) */}
      <Route path="/dev/characters" element={<CharacterPreview />} />

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

      {/* Обучение — главный экран = Tactical-карта (fullscreen, без Layout-сайдбара) */}
      <Route
        path="/learning"
        element={
          <FullscreenProtectedRoute pageKey="learning">
            <TacticalLearningPage />
          </FullscreenProtectedRoute>
        }
      />
      {/* Открытие конкретного курса по ID (из Tactical-карты) */}
      <Route
        path="/learning/course/:courseId"
        element={
          <ProtectedRoute pageKey="learning">
            <LearningPage />
          </ProtectedRoute>
        }
      />
      {/* Старый маршрут — редирект на новый главный */}
      <Route path="/learning/tactical" element={<Navigate to="/learning" replace />} />
      {/* Старый full-list-вид (модули → разделы → курсы) — оставлен как fallback */}
      <Route
        path="/learning/legacy"
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

      {/* Офлайн активности */}
      <Route
        path="/activities"
        element={
          <ProtectedRoute pageKey="offline">
            <OfflinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/programs"
        element={
          <ProtectedRoute pageKey="offline">
            <OfflineProgramsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/programs/:programId/edit"
        element={
          <ProtectedRoute pageKey="offline">
            <OfflineProgramEditPage />
          </ProtectedRoute>
        }
      />
      {/* Режим проектора — авторизация без Layout (fullscreen) */}
      <Route
        path="/activities/sessions/:sessionId/present"
        element={
          <PresenterRoute>
            <OfflineSessionPresenterPage />
          </PresenterRoute>
        }
      />
      {/* Мобильный тест — БЕЗ авторизации (гости на тренинге) */}
      <Route
        path="/activities/m/:accessCode/:phase"
        element={<OfflineMobileTestPage />}
      />

      {/* Module 15: Smart Training Plan */}
      <Route
        path="/training-plan"
        element={
          <ProtectedRoute pageKey="training_plan">
            <TrainingPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-plan/requests/new"
        element={
          <ProtectedRoute pageKey="training_plan">
            <TrainingRequestNewPage />
          </ProtectedRoute>
        }
      />

      {/* Module 17: Case Studio (Кейсотека) */}
      <Route
        path="/case-studio"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studio/my"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseStudioMyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studio/new"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseStudioNewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studio/categories/new"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseCategoryEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studio/categories/:categoryId/edit"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseCategoryEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studio/:scenarioId"
        element={
          <ProtectedRoute pageKey="case_studio">
            <CaseStudioDetailPage />
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

      {/* Pulse Pipeline (admin+) — универсальный визард создания Pulse для роли */}
      <Route
        path="/admin/pulse-pipeline"
        element={
          <ProtectedRoute pageKey="admin-roles">
            <PulsePipelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pulse-pipeline/:jobId"
        element={
          <ProtectedRoute pageKey="admin-roles">
            <PulsePipelinePage />
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

      {/* Словарь UZ */}
      <Route
        path="/dictionary-uz"
        element={
          <ProtectedRoute pageKey="dictionary-uz">
            <DictionaryUZPage />
          </ProtectedRoute>
        }
      />

      {/* Проверка переводов (админ) */}
      <Route
        path="/translation-review"
        element={
          <ProtectedRoute pageKey="dictionary-uz">
            <TranslationReviewPage />
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
