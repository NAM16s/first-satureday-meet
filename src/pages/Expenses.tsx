
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import { ExpensesTable } from '@/components/expense/ExpensesTable';
import { ExpensesHeader } from '@/components/expense/ExpensesHeader';
import { ExpensesCardHeader } from '@/components/expense/ExpensesCardHeader';
import { Expense } from '@/utils/types';

const Expenses = () => {
  const expensesRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const allExpenses = await databaseService.getExpenses();
        const filteredExpenses = allExpenses.filter(expense => {
          const expenseYear = new Date(expense.date).getFullYear();
          return expenseYear === selectedYear;
        });
        setExpenses(filteredExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
        toast.error('지출 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadExpenses();
  }, [selectedYear]);

  const handleExportImage = () => {
    exportAsImage(expensesRef.current!.id, `지출내역_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleAddNewExpense = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleSaveExpense = async (expenseData: Expense) => {
    try {
      if (editingExpense) {
        await databaseService.updateExpense(editingExpense.id, expenseData);
        
        setExpenses(prev => 
          prev.map(expense => 
            expense.id === editingExpense.id ? { ...expenseData, id: editingExpense.id } : expense
          )
        );
        
        toast.success('지출이 수정되었습니다.');
      } else {
        const newExpense = await databaseService.addExpense(expenseData);
        
        setExpenses(prev => [...prev, newExpense]);
        
        toast.success('새 지출이 추가되었습니다.');
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('지출 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await databaseService.deleteExpense(id);
      
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast.success('지출이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('지출 삭제 중 오류가 발생했습니다.');
    }
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const calculateTotal = (items: Expense[]) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const total = calculateTotal(expenses);

  return (
    <div className="space-y-6">
      <ExpensesHeader
        selectedYear={selectedYear}
        onPreviousYear={handlePreviousYear}
        onNextYear={handleNextYear}
        onExportImage={handleExportImage}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        editingExpense={editingExpense}
        onAddNewExpense={handleAddNewExpense}
        onSaveExpense={handleSaveExpense}
        onDeleteExpense={handleDeleteExpense}
        canEdit={canEdit}
      />

      <div id="expenses-content" ref={expensesRef} className="space-y-6">
        <Card>
          <ExpensesCardHeader
            selectedYear={selectedYear}
            onPreviousYear={handlePreviousYear}
            onNextYear={handleNextYear}
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editingExpense={editingExpense}
            onAddNewExpense={handleAddNewExpense}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            canEdit={canEdit}
          />
          <CardContent>
            <ExpensesTable
              expenses={expenses}
              canEdit={canEdit}
              total={total}
              onEditExpense={handleEditExpense}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
