import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ArrowUpDown } from 'lucide-react';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { ExpenseDialog } from '@/components/expense/ExpenseDialog';
import { Expense } from '@/utils/types';
import { useAuth } from '@/context/AuthContext';

const ExpensesPage = () => {
  const { canEdit } = useAuth();
  const expensesRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortColumn, setSortColumn] = useState<'date' | 'name' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadData = async () => {
      try {
        const expensesData = await databaseService.getExpenses();
        const filteredByYear = expensesData.filter(expense => new Date(expense.date).getFullYear() === selectedYear);
        setExpenses(filteredByYear);
      } catch (error) {
        console.error('Error loading expense data:', error);
        toast.error('지출 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    const sortedExpenses = [...expenses].sort((a, b) => {
      if (sortColumn === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortColumn === 'name') {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      } else if (sortColumn === 'type') {
        const typeA = a.type.toLowerCase();
        const typeB = b.type.toLowerCase();
        return sortDirection === 'asc' 
          ? typeA.localeCompare(typeB) 
          : typeB.localeCompare(typeA);
      }
      return 0;
    });
    
    setExpenses(sortedExpenses);
  }, [sortColumn, sortDirection]);

  const handleColumnSort = (column: 'date' | 'name' | 'type') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddNew = () => {
    if (!canEdit) {
      toast.info('지출 내역은 회계 또는 관리자만 추가할 수 있습니다.');
      return;
    }
    
    setIsCreating(true);
    setActiveExpense({
      id: '',
      date: new Date().toISOString().split('T')[0],
      userId: '',
      name: '',
      type: '식대',
      amount: 0,
      description: '',
      year: selectedYear,
      month: new Date().getMonth() + 1
    });
    setDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    if (!canEdit) {
      toast.info('지출 내역은 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
    setIsCreating(false);
    setActiveExpense(expense);
    setDialogOpen(true);
  };

  const handleSaveExpense = async (expense: Expense) => {
    try {
      if (isCreating) {
        await databaseService.addExpense(expense);
        toast.success('지출이 추가되었습니다.');
      } else {
        await databaseService.updateExpense(expense.id, expense);
        toast.success('지출이 수정되었습니다.');
      }
      
      const updatedExpenses = await databaseService.getExpenses();
      const filteredByYear = updatedExpenses.filter(e => new Date(e.date).getFullYear() === selectedYear);
      setExpenses(filteredByYear);
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('지출을 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await databaseService.deleteExpense(id);
      toast.success('지출이 삭제되었습니다.');
      
      const updatedExpenses = await databaseService.getExpenses();
      const filteredByYear = updatedExpenses.filter(e => new Date(e.date).getFullYear() === selectedYear);
      setExpenses(filteredByYear);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('지출을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleExportImage = () => {
    exportAsImage(expensesRef.current!.id, `지출내역_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">지출내역</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">{selectedYear}년</span>
          <Button variant="outline" size="sm" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="expenses-content" ref={expensesRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>지출 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th 
                      className="border p-2 text-left cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => handleColumnSort('date')}
                    >
                      <div className="flex items-center">
                        날짜
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="border p-2 text-left cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => handleColumnSort('name')}
                    >
                      <div className="flex items-center">
                        내용
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="border p-2 text-left cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => handleColumnSort('type')}
                    >
                      <div className="flex items-center">
                        항목
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="border p-2 text-left">설명</th>
                    <th className="border p-2 text-right">금액</th>
                    {canEdit && <th className="border p-2 text-center">관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.map(expense => (
                      <tr key={expense.id} className="border-b">
                        <td className="border p-2">{expense.date}</td>
                        <td className="border p-2">{expense.name}</td>
                        <td className="border p-2">{expense.type}</td>
                        <td className="border p-2">{expense.description}</td>
                        <td className="border p-2 text-right text-red-600">
                          {expense.amount.toLocaleString()}원
                        </td>
                        {canEdit && (
                          <td className="border p-2 text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              수정
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="p-4 text-center text-muted-foreground">
                        지출 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td colSpan={4} className="border p-2 text-right">합계</td>
                    <td className="border p-2 text-right text-red-600">
                      {expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}원
                    </td>
                    {canEdit && <td className="border"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeExpense && (
        <ExpenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          expense={activeExpense}
          isCreating={isCreating}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
