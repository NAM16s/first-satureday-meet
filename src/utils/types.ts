export type Role = 'admin' | 'treasurer' | 'member';

export interface User {
  id: string;
  name: string;
  password: string;
  role: Role;
  contact?: string;
}

export interface Member {
  id: string;
  name: string;
}

export interface DuesData {
  userId: string;
  year: number;
  monthlyDues: MonthlyDue[];
  unpaidAmount?: number;
}

export interface MonthlyDue {
  month: number;
  paid?: boolean;
  status?: 'unpaid' | 'paid' | 'prepaid';
  amount?: number;
  color?: string;
}

export interface MemberSettings {
  userId: string;
  defaultDues?: number;
}

export interface EventHistory {
  id: string;
  year: number;
  events: EventData[];
  created_at: string;
}

export interface EventData {
  id: string;
  date: string;
  name: string;
  description: string;
  amount?: number;
}

export type IncomeType = '회비' | '기타';

export type ExpenseType = '식대' | '경조사비' | '기타';

export interface Income {
  id: string;
  date: string;
  userId: string;
  type: IncomeType;
  amount: number;
  description?: string;
  year: number;
  month: number;
  name: string;
}

export interface Expense {
  id: string;
  date: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  description?: string;
  year: number;
  month: number;
  name: string;
}

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

export interface FinanceData {
  incomes: Income[];
  expenses: Expense[];
  duesStatus: DuesStatus[];
  settings: {
    monthlyDuesAmount: number;
    carryoverAmount: Record<number, number>; // 년도별 이월 금액
  };
}

export interface Transaction {
  id: string;
  date: string;
  userId: string;
  category: string;
  amount: number;
  description?: string;
}

export interface YearlyData {
  year: number;
  balanceForward: number;
  currentBalance: number;
  monthlyIncomes: { month: number; amount: number }[];
  monthlyExpenses: { month: number; amount: number }[];
}

export interface MemberDues {
  userId: string;
  duesByMonth: { [month: number]: number };
  totalDue: number;
  unpaidAmount: number;
}
