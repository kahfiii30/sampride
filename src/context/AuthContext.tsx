import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'admin' | 'viewer' | null;

interface AuthContextType {
  role: Role;
  login: (selectedRole: 'admin' | 'viewer', pin?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_PIN = '290124';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const savedRole = localStorage.getItem('app_role');
    if (savedRole === 'admin' || savedRole === 'viewer') return savedRole;
    return null;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('app_role', role);
    } else {
      localStorage.removeItem('app_role');
    }
  }, [role]);

  const login = (selectedRole: 'admin' | 'viewer', pin?: string) => {
    if (selectedRole === 'admin') {
      if (pin === ADMIN_PIN) {
        setRole('admin');
        return true;
      }
      return false;
    }
    
    setRole('viewer');
    return true;
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
