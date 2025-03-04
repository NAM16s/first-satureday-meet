
import { User, Transaction, YearlyData, MemberDues } from './types';

export const USERS: User[] = [
  { id: 'wsnam', password: '01043322627', name: '남원식', role: 'admin' },
  { id: 'bwkang', password: '01054033570', name: '강병우', role: 'treasurer' },
  { id: 'swkim', password: '01038394065', name: '김성우', role: 'member' },
  { id: 'twkim', password: '01084573448', name: '김태우', role: 'member' },
  { id: 'wjkim', password: '01044543460', name: '김원중', role: 'member' },
  { id: 'sgmoon', password: '01024155454', name: '문석규', role: 'member' },
  { id: 'hysong', password: '01036721764', name: '송호영', role: 'member' },
  { id: 'bsyoo', password: '01034035754', name: '유봉상', role: 'member' },
  { id: 'ywyoo', password: '01049472072', name: '유영우', role: 'member' },
  { id: 'jglee', password: '01030204982', name: '이정규', role: 'member' },
  { id: 'pylim', password: '01088534982', name: '임평열', role: 'member' },
  // Hidden admin account
  { id: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
];

// Initial transactions - empty array to start
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Current year
export const CURRENT_YEAR = new Date().getFullYear();

// Initial year data
export const INITIAL_YEARLY_DATA: YearlyData = {
  year: CURRENT_YEAR,
  balanceForward: 0,
  currentBalance: 0,
  monthlyIncomes: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 })),
  monthlyExpenses: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 })),
};

// Categories
export const INCOME_CATEGORIES = ['회비', '기타'];
export const EXPENSE_CATEGORIES = ['식대', '경조사비', '기타'];

// Local storage keys
export const STORAGE_KEYS = {
  USERS: 'club_users',
  TRANSACTIONS: 'club_transactions',
  YEARLY_DATA: 'club_yearly_data',
  AUTH_USER: 'club_auth_user',
  BACKUP: 'club_backups',
};

// Function to get Korean month name
export const getKoreanMonthName = (month: number): string => {
  return `${month}월`;
};

// Function to sort users by Korean name
export const sortUsersByKoreanName = (users: User[]): User[] => {
  return [...users].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
};

// Format currency to Korean Won
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date to Korean format
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};
