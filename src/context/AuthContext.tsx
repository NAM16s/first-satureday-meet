
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../utils/types';
import { USERS, STORAGE_KEYS } from '../utils/constants';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (id: string, password: string) => boolean;
  logout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with default users if not in localStorage
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(USERS));
    }

    const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Save users to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  const login = (id: string, password: string): boolean => {
    const user = users.find(
      (u) => u.id === id && u.password === password
    );

    if (user) {
      // Don't store password in localStorage for security
      const safeUser = { ...user };
      setCurrentUser(safeUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(safeUser));
      toast.success(`안녕하세요, ${user.name}님`);
      return true;
    } else {
      toast.error('아이디 또는 비밀번호가 올바르지 않습니다.');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    toast.info('로그아웃 되었습니다.');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        users,
        setUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
