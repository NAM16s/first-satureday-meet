
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../utils/types';
import { USERS, STORAGE_KEYS } from '../utils/constants';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (id: string, password: string) => boolean;
  logout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Compute if the current user can edit (admin or treasurer)
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'treasurer';

  // 초기 렌더링 시 localStorage에서 사용자 로드
  useEffect(() => {
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // localStorage에 없으면 기본 사용자로 초기화
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(USERS));
    }

    const storedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // 사용자가 변경될 때 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  const login = (id: string, password: string): boolean => {
    const user = users.find(
      (u) => u.id === id && u.password === password
    );

    if (user) {
      // 보안을 위해 localStorage에 비밀번호 저장 안 함
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

  // Add users to members list when they are created
  useEffect(() => {
    const syncUsersToMembers = async () => {
      for (const user of users) {
        await databaseService.syncUserToMembers(user);
      }
    };
    
    if (users.length > 0) {
      syncUsersToMembers();
    }
  }, [users]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        users,
        setUsers,
        canEdit,
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
