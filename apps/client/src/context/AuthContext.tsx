import React, { createContext, useContext, useState, useEffect } from 'react';
import { isJwtExpired } from '@drinkhub/shared';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken && isJwtExpired(savedToken)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return null;
    }
    return savedToken;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (token && isJwtExpired(token)) {
      logout();
      return;
    }

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_e) {
        logout();
      }
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
