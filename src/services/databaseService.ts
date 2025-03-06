import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { MemberSettings, DuesData, MonthlyDue, EventHistory } from '@/utils/types';

// Storage keys for backward compatibility during migration
const STORAGE_KEYS = {
  USERS: 'moim_users',
  MEMBERS: 'moim_members',
  INCOMES: 'moim_incomes',
  EXPENSES: 'moim_expenses',
  DUES: 'moim_dues',
  EVENTS: 'moim_events',
  SETTINGS: 'moim_settings',
  BACKUP: 'moim_backup',
  MEMBER_SETTINGS: 'moim_member_settings',
  EVENT_HISTORIES: 'moim_event_histories'
};

// Generic get function from localStorage (for migration/fallback)
const getLocalData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

// Generic set function to localStorage (for migration/fallback)
const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Type-safe way to access tables
const tables = {
  members: 'members',
  dues: 'dues',
  incomes: 'incomes',
  expenses: 'expenses',
  events: 'events',
  settings: 'settings'
} as const;

// Members
const getMembers = async () => {
  try {
    const { data, error } = await supabase
      .from(tables.members)
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    } else {
      // Fallback to localStorage if no data in Supabase yet
      return getLocalData(STORAGE_KEYS.MEMBERS, [
        { id: 'bwkang', name: '강병우' },
        { id: 'swkim', name: '김성우' },
        { id: 'twkim', name: '김태우' },
        { id: 'wjkim', name: '김원중' },
        { id: 'sgmoon', name: '문석규' },
        { id: 'wsnam', name: '남원식' },
        { id: 'hysong', name: '송호영' },
        { id: 'bsyoo', name: '유봉상' },
        { id: 'ywyoo', name: '유영우' },
        { id: 'jglee', name: '이정규' },
        { id: 'pylim', name: '임평열' },
      ]);
    }
  } catch (error) {
    console.error('Error fetching members:', error);
    // Fallback to localStorage
    return getLocalData(STORAGE_KEYS.MEMBERS, []);
  }
};

const saveMembers = async (members: any[]) => {
  try {
    // First, delete all existing members
    const { error: deleteError } = await supabase
      .from(tables.members)
      .delete()
      .neq('id', 'placeholder');
    
    if (deleteError) throw deleteError;
    
    // Then insert all members
    const { error: insertError } = await supabase
      .from(tables.members)
      .insert(members);
    
    if (insertError) throw insertError;
    
    // Also update localStorage for backup
    setLocalData(STORAGE_KEYS.MEMBERS, members.sort((a, b) => a.name.localeCompare(b.name, 'ko')));
  } catch (error) {
    console.error('Error saving members:', error);
    // Fallback to localStorage
    setLocalData(STORAGE_KEYS.MEMBERS, members.sort((a, b) => a.name.localeCompare(b.name, 'ko')));
  }
};

const syncUserToMembers = async (user: any) => {
  try {
    const { data: existingMember, error: checkError } = await supabase
      .from(tables.members)
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    if (!existingMember) {
      const { error: insertError } = await supabase
        .from(tables.members)
        .insert([{ id: user.id, name: user.name }]);
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error syncing user to members:', error);
  }
};

// Member Settings
const getMemberSettings = async (userId: string): Promise<MemberSettings | null> => {
  try {
    const settings = getLocalData<MemberSettings[]>(STORAGE_KEYS.MEMBER_SETTINGS, []);
    return settings.find(s => s.userId === userId) || null;
  } catch (error) {
    console.error('Error fetching member settings:', error);
    return null;
  }
};

const saveMemberSettings = async (userId: string, settings: Partial<MemberSettings>): Promise<void> => {
  try {
    const allSettings = getLocalData<MemberSettings[]>(STORAGE_KEYS.MEMBER_SETTINGS, []);
    const existingIndex = allSettings.findIndex(s => s.userId === userId);
    
    if (existingIndex >= 0) {
      allSettings[existingIndex] = {
        ...allSettings[existingIndex],
        ...settings,
        userId
      };
    } else {
      allSettings.push({
        userId,
        ...settings
      });
    }
    
    setLocalData(STORAGE_KEYS.MEMBER_SETTINGS, allSettings);
  } catch (error) {
    console.error('Error saving member settings:', error);
  }
};

// Dues
const getDues = async (year: number): Promise<DuesData[]> => {
  try {
    const { data, error } = await supabase
      .from(tables.dues)
      .select('*')
      .eq('year', year);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    } else {
      // Fallback to localStorage
      return getLocalData(`${STORAGE_KEYS.DUES}_${year}`, []);
    }
  } catch (error) {
    console.error(`Error fetching dues for year ${year}:`, error);
    // Fallback to localStorage
    return getLocalData(`${STORAGE_KEYS.DUES}_${year}`, []);
  }
};

const saveDues = async (year: number, dues: DuesData[]): Promise<void> => {
  try {
    // First, delete existing dues for the year
    const { error: deleteError } = await supabase
      .from(tables.dues)
      .delete()
      .eq('year', year);
    
    if (deleteError) throw deleteError;
    
    // Then insert new dues
    const { error: insertError } = await supabase
      .from(tables.dues)
      .insert(dues.map(due => ({ ...due, year })));
    
    if (insertError) throw insertError;
    
    // Also update localStorage for backup
    setLocalData(`${STORAGE_KEYS.DUES}_${year}`, dues);
  } catch (error) {
    console.error(`Error saving dues for year ${year}:`, error);
    // Fallback to localStorage
    setLocalData(`${STORAGE_KEYS.DUES}_${year}`, dues);
  }
};

// Incomes
const getIncomes = async () => {
  try {
    const { data, error } = await supabase
      .from(tables.incomes)
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    } else {
      // Fallback to localStorage if no data in Supabase yet
      return getLocalData(STORAGE_KEYS.INCOMES, []);
    }
  } catch (error) {
    console.error('Error fetching incomes:', error);
    // Fallback to localStorage
    return getLocalData(STORAGE_KEYS.INCOMES, []);
  }
};

const saveIncomes = async (incomes: any[]) => {
  try {
    // First, delete all existing incomes
    const { error: deleteError } = await supabase
      .from(tables.incomes)
      .delete()
      .neq('id', 'placeholder');
    
    if (deleteError) throw deleteError;
    
    // Then insert all incomes
    const { error: insertError } = await supabase
      .from(tables.incomes)
      .insert(incomes);
    
    if (insertError) throw insertError;
    
    // Also update localStorage for backup
    setLocalData(STORAGE_KEYS.INCOMES, incomes);
  } catch (error) {
    console.error('Error saving incomes:', error);
    // Fallback to localStorage
    setLocalData(STORAGE_KEYS.INCOMES, incomes);
  }
};

const addIncome = async (income: any) => {
  try {
    const newIncome = {
      ...income,
      id: income.id || uuidv4()
    };
    
    const { error } = await supabase
      .from(tables.incomes)
      .insert([newIncome]);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const incomes = await getIncomes();
    const updatedIncomes = [newIncome, ...incomes];
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
    
    return newIncome;
  } catch (error) {
    console.error('Error adding income:', error);
    // Fallback to localStorage
    const incomes = getLocalData(STORAGE_KEYS.INCOMES, []);
    const newIncome = {
      ...income,
      id: income.id || uuidv4()
    };
    const updatedIncomes = [newIncome, ...incomes];
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
    return newIncome;
  }
};

const updateIncome = async (id: string, updatedData: any) => {
  try {
    const { error } = await supabase
      .from(tables.incomes)
      .update(updatedData)
      .eq('id', id);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const incomes = await getIncomes();
    const updatedIncomes = incomes.map((income: any) => 
      income.id === id ? { ...income, ...updatedData } : income
    );
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
  } catch (error) {
    console.error('Error updating income:', error);
    // Fallback to localStorage
    const incomes = getLocalData(STORAGE_KEYS.INCOMES, []);
    const updatedIncomes = incomes.map((income: any) => 
      income.id === id ? { ...income, ...updatedData } : income
    );
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
  }
};

const deleteIncome = async (id: string) => {
  try {
    const { error } = await supabase
      .from(tables.incomes)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const incomes = await getIncomes();
    const updatedIncomes = incomes.filter((income: any) => income.id !== id);
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
  } catch (error) {
    console.error('Error deleting income:', error);
    // Fallback to localStorage
    const incomes = getLocalData(STORAGE_KEYS.INCOMES, []);
    const updatedIncomes = incomes.filter((income: any) => income.id !== id);
    setLocalData(STORAGE_KEYS.INCOMES, updatedIncomes);
  }
};

// Expenses
const getExpenses = async () => {
  try {
    const { data, error } = await supabase
      .from(tables.expenses)
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    } else {
      // Fallback to localStorage if no data in Supabase yet
      return getLocalData(STORAGE_KEYS.EXPENSES, []);
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
    // Fallback to localStorage
    return getLocalData(STORAGE_KEYS.EXPENSES, []);
  }
};

const saveExpenses = async (expenses: any[]) => {
  try {
    // First, delete all existing expenses
    const { error: deleteError } = await supabase
      .from(tables.expenses)
      .delete()
      .neq('id', 'placeholder');
    
    if (deleteError) throw deleteError;
    
    // Then insert all expenses
    const { error: insertError } = await supabase
      .from(tables.expenses)
      .insert(expenses);
    
    if (insertError) throw insertError;
    
    // Also update localStorage for backup
    setLocalData(STORAGE_KEYS.EXPENSES, expenses);
  } catch (error) {
    console.error('Error saving expenses:', error);
    // Fallback to localStorage
    setLocalData(STORAGE_KEYS.EXPENSES, expenses);
  }
};

const addExpense = async (expense: any) => {
  try {
    const newExpense = {
      ...expense,
      id: expense.id || uuidv4()
    };
    
    const { error } = await supabase
      .from(tables.expenses)
      .insert([newExpense]);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const expenses = await getExpenses();
    const updatedExpenses = [newExpense, ...expenses];
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
    
    return newExpense;
  } catch (error) {
    console.error('Error adding expense:', error);
    // Fallback to localStorage
    const expenses = getLocalData(STORAGE_KEYS.EXPENSES, []);
    const newExpense = {
      ...expense,
      id: expense.id || uuidv4()
    };
    const updatedExpenses = [newExpense, ...expenses];
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
    return newExpense;
  }
};

const updateExpense = async (id: string, updatedData: any) => {
  try {
    const { error } = await supabase
      .from(tables.expenses)
      .update(updatedData)
      .eq('id', id);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const expenses = await getExpenses();
    const updatedExpenses = expenses.map((expense: any) => 
      expense.id === id ? { ...expense, ...updatedData } : expense
    );
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
  } catch (error) {
    console.error('Error updating expense:', error);
    // Fallback to localStorage
    const expenses = getLocalData(STORAGE_KEYS.EXPENSES, []);
    const updatedExpenses = expenses.map((expense: any) => 
      expense.id === id ? { ...expense, ...updatedData } : expense
    );
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
  }
};

const deleteExpense = async (id: string) => {
  try {
    const { error } = await supabase
      .from(tables.expenses)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Also update localStorage for backup
    const expenses = await getExpenses();
    const updatedExpenses = expenses.filter((expense: any) => expense.id !== id);
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
  } catch (error) {
    console.error('Error deleting expense:', error);
    // Fallback to localStorage
    const expenses = getLocalData(STORAGE_KEYS.EXPENSES, []);
    const updatedExpenses = expenses.filter((expense: any) => expense.id !== id);
    setLocalData(STORAGE_KEYS.EXPENSES, updatedExpenses);
  }
};

// Special Events
const getEvents = async () => {
  try {
    const { data, error } = await supabase
      .from(tables.events)
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    } else {
      // Fallback to localStorage
      return getLocalData(STORAGE_KEYS.EVENTS, []);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    // Fallback to localStorage
    return getLocalData(STORAGE_KEYS.EVENTS, []);
  }
};

const saveEvents = async (events: any[]) => {
  try {
    // First, delete all existing events
    const { error: deleteError } = await supabase
      .from(tables.events)
      .delete()
      .neq('id', 'placeholder');
    
    if (deleteError) throw deleteError;
    
    // Then insert all events
    const { error: insertError } = await supabase
      .from(tables.events)
      .insert(events);
    
    if (insertError) throw insertError;
    
    // Also update localStorage for backup
    setLocalData(STORAGE_KEYS.EVENTS, events);
  } catch (error) {
    console.error('Error saving events:', error);
    // Fallback to localStorage
    setLocalData(STORAGE_KEYS.EVENTS, events);
  }
};

// Event histories
const getEventHistories = async (): Promise<EventHistory[]> => {
  return getLocalData<EventHistory[]>(STORAGE_KEYS.EVENT_HISTORIES, []);
};

const createEventHistory = async (year: number, events: any[]): Promise<string> => {
  try {
    const historyId = uuidv4();
    const newHistory: EventHistory = {
      id: historyId,
      year,
      events: [...events],
      created_at: new Date().toISOString()
    };
    
    const histories = getLocalData<EventHistory[]>(STORAGE_KEYS.EVENT_HISTORIES, []);
    setLocalData(STORAGE_KEYS.EVENT_HISTORIES, [newHistory, ...histories]);
    
    return historyId;
  } catch (error) {
    console.error('Error creating event history:', error);
    throw error;
  }
};

// Finance settings
const getSettings = async () => {
  try {
    const { data, error } = await supabase
      .from(tables.settings)
      .select('*')
      .maybeSingle();
    
    if (error) throw error;
    
    if (data) {
      // Convert from database format to app format
      return {
        carryoverAmounts: data.carryover_amounts || {}
      };
    } else {
      // Fallback to localStorage
      return getLocalData(STORAGE_KEYS.SETTINGS, {
        carryoverAmounts: {}
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Fallback to localStorage
    return getLocalData(STORAGE_KEYS.SETTINGS, {
      carryoverAmounts: {}
    });
  }
};

const saveSettings = async (settings: any) => {
  try {
    // Convert from app format to database format
    const dbSettings = {
      carryover_amounts: settings.carryoverAmounts
    };
    
    // First check if settings exist
    const { data, error: checkError } = await supabase
      .from(tables.settings)
      .select('id')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (data) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from(tables.settings)
        .update(dbSettings)
        .eq('id', data.id);
      
      if (updateError) throw updateError;
    } else {
      // Insert new settings
      const { error: insertError } = await supabase
        .from(tables.settings)
        .insert([{ ...dbSettings, id: uuidv4() }]);
      
      if (insertError) throw insertError;
    }
    
    // Also update localStorage for backup
    setLocalData(STORAGE_KEYS.SETTINGS, settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    // Fallback to localStorage
    setLocalData(STORAGE_KEYS.SETTINGS, settings);
  }
};

const getCarryoverAmount = async (year: number) => {
  const settings = await getSettings();
  return settings.carryoverAmounts?.[year] || 0;
};

const saveCarryoverAmount = async (year: number, amount: number) => {
  const settings = await getSettings();
  if (!settings.carryoverAmounts) {
    settings.carryoverAmounts = {};
  }
  settings.carryoverAmounts[year] = amount;
  await saveSettings(settings);
};

// Calculate current balance based on incomes, expenses and carryover
const calculateCurrentBalance = async (year: number) => {
  const carryover = await getCarryoverAmount(year);
  
  const incomes = (await getIncomes()).filter((income: any) => {
    const incomeYear = new Date(income.date).getFullYear();
    return incomeYear === year;
  });
  
  const expenses = (await getExpenses()).filter((expense: any) => {
    const expenseYear = new Date(expense.date).getFullYear();
    return expenseYear === year;
  });
  
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return carryover + totalIncome - totalExpense;
};

// Calculate previous year balance
const calculatePreviousYearBalance = async (year: number) => {
  const prevYear = year - 1;
  const prevYearCarryover = await getCarryoverAmount(prevYear);
  
  const incomes = (await getIncomes()).filter((income: any) => {
    const incomeYear = new Date(income.date).getFullYear();
    return incomeYear === prevYear;
  });
  
  const expenses = (await getExpenses()).filter((expense: any) => {
    const expenseYear = new Date(expense.date).getFullYear();
    return expenseYear === prevYear;
  });
  
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return prevYearCarryover + totalIncome - totalExpense;
};

// Get monthly finance data
const getMonthlyFinanceData = async (year: number) => {
  const incomes = (await getIncomes()).filter((income: any) => {
    const incomeYear = new Date(income.date).getFullYear();
    return incomeYear === year;
  });
  
  const expenses = (await getExpenses()).filter((expense: any) => {
    const expenseYear = new Date(expense.date).getFullYear();
    return expenseYear === year;
  });
  
  // Initialize monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0
  }));
  
  // Aggregate incomes by month
  incomes.forEach(income => {
    const month = new Date(income.date).getMonth();
    monthlyData[month].income += income.amount;
  });
  
  // Aggregate expenses by month
  expenses.forEach(expense => {
    const month = new Date(expense.date).getMonth();
    monthlyData[month].expense += expense.amount;
  });
  
  return monthlyData;
};

// Backup
const createBackup = async () => {
  try {
    const members = await getMembers();
    const incomes = await getIncomes();
    const expenses = await getExpenses();
    const events = await getEvents();
    const settings = await getSettings();
    
    const backup = {
      members,
      incomes,
      expenses,
      events,
      settings,
      timestamp: new Date().toISOString()
    };
    
    // Get existing backups
    const backups = getLocalData(STORAGE_KEYS.BACKUP, []);
    
    // Create a new backup entry
    const backupEntry = {
      id: uuidv4(),
      date: new Date().toLocaleString(),
      name: `백업_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`,
      data: backup
    };
    
    // Add new backup to the list
    const updatedBackups = [backupEntry, ...backups];
    setLocalData(STORAGE_KEYS.BACKUP, updatedBackups);
    
    return backupEntry;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
};

const getBackups = () => {
  return getLocalData(STORAGE_KEYS.BACKUP, []);
};

const restoreBackup = async (backupId: string) => {
  try {
    const backups = getBackups();
    const backup = backups.find((b: any) => b.id === backupId);
    
    if (backup && backup.data) {
      if (backup.data.members) await saveMembers(backup.data.members);
      if (backup.data.incomes) await saveIncomes(backup.data.incomes);
      if (backup.data.expenses) await saveExpenses(backup.data.expenses);
      if (backup.data.events) await saveEvents(backup.data.events);
      if (backup.data.settings) await saveSettings(backup.data.settings);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
};

const deleteBackup = (backupId: string) => {
  const backups = getBackups();
  const updatedBackups = backups.filter((b: any) => b.id !== backupId);
  setLocalData(STORAGE_KEYS.BACKUP, updatedBackups);
};

export const databaseService = {
  // Storage keys
  STORAGE_KEYS,
  
  // Members
  getMembers,
  saveMembers,
  syncUserToMembers,
  
  // Member Settings
  getMemberSettings,
  saveMemberSettings,
  
  // Dues
  getDues,
  saveDues,
  
  // Incomes
  getIncomes,
  saveIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  
  // Expenses
  getExpenses,
  saveExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  
  // Events
  getEvents,
  saveEvents,
  
  // Event histories
  getEventHistories,
  createEventHistory,
  
  // Finance settings
  getSettings,
  saveSettings,
  getCarryoverAmount,
  saveCarryoverAmount,
  calculateCurrentBalance,
  calculatePreviousYearBalance,
  getMonthlyFinanceData,
  
  // Backup
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup
};
