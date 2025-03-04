
// 사용자 역할 타입
export type Role = 'admin' | 'treasurer' | 'member';

// 사용자 인터페이스
export interface User {
  id: string;
  password: string;
  name: string;
  role: Role;
}

// 수입 항목 타입
export type IncomeType = '회비' | '기타';

// 지출 항목 타입
export type ExpenseType = '식대' | '경조사비' | '기타';

// 수입 인터페이스
export interface Income {
  id: string;
  date: string;
  userId: string;
  type: IncomeType;
  amount: number;
  description?: string;
  year: number;
  month: number;
}

// 지출 인터페이스
export interface Expense {
  id: string;
  date: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  description?: string;
  year: number;
  month: number;
}

// 회비 납부 상태 인터페이스
export interface DuesStatus {
  userId: string;
  year: number;
  monthlyDues: {
    month: number;
    amount: number;
    isPaid: boolean;
    incomeId?: string;
  }[];
}

// 재정 데이터 인터페이스
export interface FinanceData {
  incomes: Income[];
  expenses: Expense[];
  duesStatus: DuesStatus[];
  settings: {
    monthlyDuesAmount: number;
    carryoverAmount: Record<number, number>; // 년도별 이월 금액
  };
}
