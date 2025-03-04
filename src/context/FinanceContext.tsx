
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Transaction, YearlyData, MemberDues } from '../utils/types';
import { INITIAL_TRANSACTIONS, INITIAL_YEARLY_DATA, STORAGE_KEYS, CURRENT_YEAR } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface FinanceContextType {
  transactions: Transaction[];
  yearlyData: YearlyData[];
  selectedYear: number;
  memberDues: MemberDues[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setSelectedYear: (year: number) => void;
  calculateDues: () => void;
  updateDues: (userId: string, month: number, amount: number) => void;
  getCurrentYearData: () => YearlyData;
  getRecentTransactions: (type: 'income' | 'expense', limit: number) => Transaction[];
  createBackup: () => void;
  restoreBackup: (timestamp: string) => boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([INITIAL_YEARLY_DATA]);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [memberDues, setMemberDues] = useState<MemberDues[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    }

    const storedYearlyData = localStorage.getItem(STORAGE_KEYS.YEARLY_DATA);
    if (storedYearlyData) {
      setYearlyData(JSON.parse(storedYearlyData));
    } else {
      localStorage.setItem(STORAGE_KEYS.YEARLY_DATA, JSON.stringify([INITIAL_YEARLY_DATA]));
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.YEARLY_DATA, JSON.stringify(yearlyData));
  }, [yearlyData]);

  // Recalculate yearly data whenever transactions change
  useEffect(() => {
    calculateYearlyData();
    calculateDues();
  }, [transactions]);

  const getCurrentYearData = (): YearlyData => {
    const yearData = yearlyData.find(data => data.year === selectedYear);
    return yearData || { 
      year: selectedYear,
      balanceForward: 0,
      currentBalance: 0,
      monthlyIncomes: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 })),
      monthlyExpenses: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 }))
    };
  };

  const calculateYearlyData = () => {
    // Group transactions by year
    const transactionsByYear = transactions.reduce((acc, transaction) => {
      const year = new Date(transaction.date).getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(transaction);
      return acc;
    }, {} as { [year: number]: Transaction[] });

    // Ensure we have data for all years from the earliest transaction to current year
    const years = Object.keys(transactionsByYear).map(Number);
    const minYear = Math.min(...years, CURRENT_YEAR);
    const maxYear = Math.max(...years, CURRENT_YEAR);

    const newYearlyData: YearlyData[] = [];

    // Calculate data for each year
    for (let year = minYear; year <= maxYear; year++) {
      const yearTransactions = transactionsByYear[year] || [];
      
      // Calculate monthly income and expenses
      const monthlyIncomes: { [month: number]: number } = {};
      const monthlyExpenses: { [month: number]: number } = {};
      
      for (let i = 1; i <= 12; i++) {
        monthlyIncomes[i] = 0;
        monthlyExpenses[i] = 0;
      }

      yearTransactions.forEach(transaction => {
        const month = new Date(transaction.date).getMonth() + 1;
        const amount = transaction.amount;

        if (transaction.category === '회비' || transaction.category === '기타') {
          monthlyIncomes[month] += amount;
        } else {
          monthlyExpenses[month] += amount;
        }
      });

      // Calculate balance forward (previous year's balance)
      const previousYearData = newYearlyData.find(data => data.year === year - 1);
      const balanceForward = previousYearData ? previousYearData.currentBalance : 0;

      // Calculate total income and expenses for the year
      const totalIncome = Object.values(monthlyIncomes).reduce((sum, amount) => sum + amount, 0);
      const totalExpense = Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0);

      // Calculate current balance
      const currentBalance = balanceForward + totalIncome - totalExpense;

      newYearlyData.push({
        year,
        balanceForward,
        currentBalance,
        monthlyIncomes: Object.entries(monthlyIncomes).map(([month, amount]) => ({
          month: parseInt(month),
          amount
        })),
        monthlyExpenses: Object.entries(monthlyExpenses).map(([month, amount]) => ({
          month: parseInt(month),
          amount
        }))
      });
    }

    setYearlyData(newYearlyData);
  };

  const calculateDues = () => {
    // Get the stored users
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    
    // Filter transactions to only include membership dues for the selected year
    const duesTransactions = transactions.filter(
      transaction => 
        transaction.category === '회비' && 
        new Date(transaction.date).getFullYear() === selectedYear
    );

    const newMemberDues: MemberDues[] = [];

    // Calculate dues for each member
    users.forEach(user => {
      const userDuesTransactions = duesTransactions.filter(
        transaction => transaction.userId === user.id
      );

      // Initialize duesByMonth with zeros for each month
      const duesByMonth: { [month: number]: number } = {};
      for (let i = 1; i <= 12; i++) {
        duesByMonth[i] = 0;
      }

      // Fill in actual dues paid
      userDuesTransactions.forEach(transaction => {
        const month = new Date(transaction.date).getMonth() + 1;
        duesByMonth[month] += transaction.amount;
      });

      // Calculate total dues paid and unpaid amount
      const totalDue = Object.values(duesByMonth).reduce((sum, amount) => sum + amount, 0);
      // Assuming a monthly due of 50,000 won per member (adjust as needed)
      const expectedYearlyDue = 12 * 50000;
      const unpaidAmount = expectedYearlyDue - totalDue;

      newMemberDues.push({
        userId: user.id,
        duesByMonth,
        totalDue,
        unpaidAmount: unpaidAmount > 0 ? unpaidAmount : 0
      });
    });

    setMemberDues(newMemberDues);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };

    setTransactions(prev => [...prev, newTransaction]);
    toast.success('거래가 추가되었습니다.');
  };

  const updateTransaction = (transaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => (t.id === transaction.id ? transaction : t))
    );
    toast.success('거래가 업데이트되었습니다.');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('거래가 삭제되었습니다.');
  };

  const updateDues = (userId: string, month: number, amount: number) => {
    // Create a transaction for the dues
    const newTransaction: Omit<Transaction, 'id'> = {
      date: new Date(selectedYear, month - 1, 1).toISOString(),
      userId,
      category: '회비',
      amount,
      description: `${month}월 회비`
    };

    addTransaction(newTransaction);
  };

  const getRecentTransactions = (type: 'income' | 'expense', limit: number): Transaction[] => {
    const filteredTransactions = transactions.filter(transaction => {
      const isIncome = transaction.category === '회비' || transaction.category === '기타';
      return type === 'income' ? isIncome : !isIncome;
    });

    return filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const createBackup = () => {
    const timestamp = new Date().toISOString();
    const backupData = {
      timestamp,
      data: {
        users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
        transactions,
        yearlyData,
        memberDues
      }
    };

    // Get existing backups
    const backupsStr = localStorage.getItem(STORAGE_KEYS.BACKUP) || '[]';
    const backups = JSON.parse(backupsStr);
    
    // Add new backup
    backups.push(backupData);
    
    // Store backups
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backups));
    
    toast.success('백업이 생성되었습니다.');
    return timestamp;
  };

  const restoreBackup = (timestamp: string): boolean => {
    try {
      // Get backups
      const backupsStr = localStorage.getItem(STORAGE_KEYS.BACKUP) || '[]';
      const backups = JSON.parse(backupsStr);
      
      // Find backup with matching timestamp
      const backup = backups.find((b: any) => b.timestamp === timestamp);
      
      if (!backup) {
        toast.error('백업을 찾을 수 없습니다.');
        return false;
      }
      
      // Restore data
      setTransactions(backup.data.transactions);
      setYearlyData(backup.data.yearlyData);
      setMemberDues(backup.data.memberDues);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(backup.data.transactions));
      localStorage.setItem(STORAGE_KEYS.YEARLY_DATA, JSON.stringify(backup.data.yearlyData));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backup.data.users));
      
      toast.success('백업이 복구되었습니다.');
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('백업 복구에 실패했습니다.');
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        yearlyData,
        selectedYear,
        memberDues,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setSelectedYear,
        calculateDues,
        updateDues,
        getCurrentYearData,
        getRecentTransactions,
        createBackup,
        restoreBackup
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
