import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LearningPage } from './pages/LearningPage';

// ===========================================
// ЗАЩИЩЁННЫЙ РОУТ
// Если не авторизован — редирект на /login
// ===========================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// ===========================================
// ПУБЛИЧНЫЙ РОУТ
// Если уже авторизован — редирект на /learning
// ===========================================
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
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
      
      {/* Редирект по умолчанию */}
      <Route path="/" element={<Navigate to="/learning" replace />} />
      <Route path="*" element={<Navigate to="/learning" replace />} />
    </Routes>
  );
}

// ===========================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
// ===========================================
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
