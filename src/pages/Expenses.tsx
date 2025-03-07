
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { ExpenseDialog } from '@/components/expense/ExpenseDialog';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';

const Expenses = () => {
  const expensesRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  
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

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleSaveExpense = async (expenseData: any) => {
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

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const calculateTotal = (items: any[]) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const total = calculateTotal(expenses);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">지출내역</h2>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="expenses-content" ref={expensesRef} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>지출 내역</CardTitle>
            <div className="flex-grow flex justify-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handlePreviousYear}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg">{selectedYear}년</span>
                <Button variant="outline" size="sm" onClick={handleNextYear}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddNewExpense} 
                  disabled={!canEdit}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  새로운 지출
                </Button>
              </DialogTrigger>
              <ExpenseDialog
                expense={editingExpense}
                onSave={handleSaveExpense}
                onDelete={handleDeleteExpense}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
              />
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>세부내용</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  {canEdit && <TableHead className="text-center">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.length > 0 ? (
                  sortedExpenses.map((expense) => (
                    <TableRow 
                      key={expense.id} 
                      className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={canEdit ? () => handleEditExpense(expense) : undefined}
                    >
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell>{expense.type}</TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{expense.amount.toLocaleString()}원</TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditExpense(expense);
                            }}
                          >
                            수정
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} className="h-24 text-center">
                      지출 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted font-medium">
                  <TableCell colSpan={4} className="text-right">총계</TableCell>
                  <TableCell className="text-right">{total.toLocaleString()}원</TableCell>
                  {canEdit && <TableCell></TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;
