
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'moim_users',
  MEMBERS: 'moim_members',
  INCOMES: 'moim_incomes',
  EXPENSES: 'moim_expenses',
  DUES: 'moim_dues',
  EVENTS: 'moim_events',
  SETTINGS: 'moim_settings',
  BACKUP: 'moim_backup'
};

// Generic get function
const getData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

// Generic set function
const setData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Members
const getMembers = () => {
  return getData(STORAGE_KEYS.MEMBERS, [
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
  ].sort((a, b) => a.name.localeCompare(b.name, 'ko')));
};

const saveMembers = (members: any[]) => {
  setData(STORAGE_KEYS.MEMBERS, members.sort((a, b) => a.name.localeCompare(b.name, 'ko')));
};

// Dues
const getDues = (year: number) => {
  return getData(`${STORAGE_KEYS.DUES}_${year}`, []);
};

const saveDues = (year: number, dues: any[]) => {
  setData(`${STORAGE_KEYS.DUES}_${year}`, dues);
};

// Incomes
const getIncomes = () => {
  return getData(STORAGE_KEYS.INCOMES, []);
};

const saveIncomes = (incomes: any[]) => {
  setData(STORAGE_KEYS.INCOMES, incomes);
};

const addIncome = (income: any) => {
  const incomes = getIncomes();
  const newIncome = {
    ...income,
    id: income.id || uuidv4()
  };
  const updatedIncomes = [newIncome, ...incomes];
  saveIncomes(updatedIncomes);
  return newIncome;
};

const updateIncome = (id: string, updatedData: any) => {
  const incomes = getIncomes();
  const updatedIncomes = incomes.map(income => 
    income.id === id ? { ...income, ...updatedData } : income
  );
  saveIncomes(updatedIncomes);
};

const deleteIncome = (id: string) => {
  const incomes = getIncomes();
  const updatedIncomes = incomes.filter(income => income.id !== id);
  saveIncomes(updatedIncomes);
};

// Expenses
const getExpenses = () => {
  return getData(STORAGE_KEYS.EXPENSES, []);
};

const saveExpenses = (expenses: any[]) => {
  setData(STORAGE_KEYS.EXPENSES, expenses);
};

const addExpense = (expense: any) => {
  const expenses = getExpenses();
  const newExpense = {
    ...expense,
    id: expense.id || uuidv4()
  };
  const updatedExpenses = [newExpense, ...expenses];
  saveExpenses(updatedExpenses);
  return newExpense;
};

const updateExpense = (id: string, updatedData: any) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.map(expense => 
    expense.id === id ? { ...expense, ...updatedData } : expense
  );
  saveExpenses(updatedExpenses);
};

const deleteExpense = (id: string) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.filter(expense => expense.id !== id);
  saveExpenses(updatedExpenses);
};

// Special Events
const getEvents = () => {
  return getData(STORAGE_KEYS.EVENTS, []);
};

const saveEvents = (events: any[]) => {
  setData(STORAGE_KEYS.EVENTS, events);
};

// Backup
const createBackup = () => {
  const backup = {
    members: getMembers(),
    incomes: getIncomes(),
    expenses: getExpenses(),
    events: getEvents(),
    timestamp: new Date().toISOString()
  };
  
  // Get existing backups
  const backups = getData(STORAGE_KEYS.BACKUP, []);
  
  // Create a new backup entry
  const backupEntry = {
    id: uuidv4(),
    date: new Date().toLocaleString(),
    name: `백업_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`,
    data: backup
  };
  
  // Add new backup to the list
  const updatedBackups = [backupEntry, ...backups];
  setData(STORAGE_KEYS.BACKUP, updatedBackups);
  
  return backupEntry;
};

const getBackups = () => {
  return getData(STORAGE_KEYS.BACKUP, []);
};

const restoreBackup = (backupId: string) => {
  const backups = getBackups();
  const backup = backups.find(b => b.id === backupId);
  
  if (backup && backup.data) {
    if (backup.data.members) saveMembers(backup.data.members);
    if (backup.data.incomes) saveIncomes(backup.data.incomes);
    if (backup.data.expenses) saveExpenses(backup.data.expenses);
    if (backup.data.events) saveEvents(backup.data.events);
    return true;
  }
  
  return false;
};

const deleteBackup = (backupId: string) => {
  const backups = getBackups();
  const updatedBackups = backups.filter(b => b.id !== backupId);
  setData(STORAGE_KEYS.BACKUP, updatedBackups);
};

export const databaseService = {
  // Storage keys
  STORAGE_KEYS,
  
  // Members
  getMembers,
  saveMembers,
  
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
  
  // Backup
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup
};
