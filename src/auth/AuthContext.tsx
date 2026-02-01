import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ===========================================
// ТИПЫ ПОЛЬЗОВАТЕЛЕЙ
// ===========================================
export type UserRole = 'supervisor' | 'agent';

export interface User {
  id: string;
  login: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isSupervisor: boolean;
}

// ===========================================
// БАЗА ПОЛЬЗОВАТЕЛЕЙ (ДЕМО)
// TODO: Перенести на backend в продакшене
// ===========================================
const USERS_DB: { login: string; password: string; user: User }[] = [
  {
    login: 'super',
    password: 'super123',
    user: { id: 'sv-001', login: 'super', name: 'Супервайзер', role: 'supervisor' }
  },
  {
    login: 'agent1',
    password: 'agent1',
    user: { id: 'ag-001', login: 'agent1', name: 'Алишер К.', role: 'agent' }
  },
  {
    login: 'agent2',
    password: 'agent2',
    user: { id: 'ag-002', login: 'agent2', name: 'Дилшод М.', role: 'agent' }
  },
  {
    login: 'agent3',
    password: 'agent3',
    user: { id: 'ag-003', login: 'agent3', name: 'Саида Р.', role: 'agent' }
  },
  {
    login: 'agent4',
    password: 'agent4',
    user: { id: 'ag-004', login: 'agent4', name: 'Бобур А.', role: 'agent' }
  },
  {
    login: 'agent5',
    password: 'agent5',
    user: { id: 'ag-005', login: 'agent5', name: 'Жамшид Т.', role: 'agent' }
  },
  {
    login: 'agent6',
    password: 'agent6',
    user: { id: 'ag-006', login: 'agent6', name: 'Нодир Х.', role: 'agent' }
  },
  {
    login: 'agent7',
    password: 'agent7',
    user: { id: 'ag-007', login: 'agent7', name: 'Фарход И.', role: 'agent' }
  }
];

// ===========================================
// КОНТЕКСТ АВТОРИЗАЦИИ
// ===========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер авторизации
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Восстановление сессии из localStorage при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('traektoriya_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('traektoriya_user');
      }
    }
  }, []);

  // Функция входа
  const login = (username: string, password: string): boolean => {
    const found = USERS_DB.find(
      u => u.login === username && u.password === password
    );
    
    if (found) {
      setUser(found.user);
      localStorage.setItem('traektoriya_user', JSON.stringify(found.user));
      return true;
    }
    return false;
  };

  // Функция выхода
  const logout = () => {
    setUser(null);
    localStorage.removeItem('traektoriya_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isSupervisor: user?.role === 'supervisor'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования авторизации в компонентах
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
