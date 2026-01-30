import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LearningPage } from './pages/LearningPage';

// Защищённый роут — редирект на логин если не авторизован
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Публичный роут — редирект на learning если уже авторизован
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/learning" replace />;
  }
  
  return <>{children}</>;
}

// Главный компонент приложения
function AppRoutes() {
  return (
    <Routes>
      {/* Публичные роуты */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      {/* Защищённые роуты */}
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

// Корневой компонент с провайдерами
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
