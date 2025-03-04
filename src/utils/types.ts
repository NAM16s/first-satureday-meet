
export type UserRole = 'admin' | 'treasurer' | 'member';

export interface User {
  id: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface Transaction {
  id: string;
  date: string;
  userId: string;
  category: string;
  amount: number;
  description?: string;
}

export interface MonthlyIncome {
  month: number;
  amount: number;
}

export interface MonthlyExpense {
  month: number;
  amount: number;
}

export interface YearlyData {
  year: number;
  balanceForward: number;
  currentBalance: number;
  monthlyIncomes: MonthlyIncome[];
  monthlyExpenses: MonthlyExpense[];
}

export interface MemberDues {
  userId: string;
  duesByMonth: { [month: number]: number };
  totalDue: number;
  unpaidAmount: number;
}

export interface BackupData {
  timestamp: string;
  data: {
    users: User[];
    transactions: Transaction[];
    yearlyData: YearlyData[];
    memberDues: MemberDues[];
  };
}
