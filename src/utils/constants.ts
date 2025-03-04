
import { User, Role } from './types';

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USERS: 'moim_users',
  AUTH_USER: 'moim_auth_user',
  FINANCE_DATA: 'moim_finance_data',
  SETTINGS: 'moim_settings',
  TRANSACTIONS: 'moim_transactions',
  YEARLY_DATA: 'moim_yearly_data',
  BACKUP: 'moim_backup'
};

// 현재 연도 상수
export const CURRENT_YEAR = new Date().getFullYear();

// 기본 사용자 목록
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
  { id: 'pylim', password: '01088534982', name: '임평열', role: 'member' }
];

// 초기 트랜잭션 목록
export const INITIAL_TRANSACTIONS = [];

// 초기 연간 데이터
export const INITIAL_YEARLY_DATA = {
  year: CURRENT_YEAR,
  balanceForward: 0,
  currentBalance: 0,
  monthlyIncomes: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 })),
  monthlyExpenses: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 }))
};

// 수입/지출 항목 타입
export const INCOME_TYPES = ['회비', '기타'] as const;
export const EXPENSE_TYPES = ['식대', '경조사비', '기타'] as const;

// 월 이름 (테이블 헤더용)
export const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월', 
  '7월', '8월', '9월', '10월', '11월', '12월'
];
