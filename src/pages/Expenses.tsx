
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';

const Expenses = () => {
  const { canEdit } = useAuth();
  const expensesRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState({
    id: '',
    date: '',
    name: '',
    type: '',
    amount: '',
    description: ''
  });

  // Expenses from database
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses when component mounts
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const expensesData = await databaseService.getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      toast.error("지출 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered expenses for the selected year
  const filteredExpenses = expenses.filter(expense => {
    const year = new Date(expense.date).getFullYear();
    return year === selectedYear;
  });

  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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

  const handleInputChange = (field: string, value: string) => {
    setNewExpense(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setNewExpense({ id: '', date: '', name: '', type: '', amount: '', description: '' });
    setIsEditing(false);
    setSelectedExpenseId(null);
  };

  const handleOpenEditDialog = (expense: any) => {
    if (!canEdit) {
      toast.info('지출 정보는 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
    setIsEditing(true);
    setSelectedExpenseId(expense.id);
    
    setNewExpense({
      id: expense.id,
      date: expense.date,
      name: expense.name,
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description || ''
    });
    
    setNewExpenseOpen(true);
  };

  const handleOpenDeleteDialog = (expenseId: string) => {
    if (!canEdit) {
      toast.info('지출 정보는 회계 또는 관리자만 삭제할 수 있습니다.');
      return;
    }
    
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      await databaseService.deleteExpense(expenseToDelete);
      
      // Update the local state
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseToDelete));
      
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      toast.success('지출이 삭제되었습니다.');
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("지출 삭제에 실패했습니다.");
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.date || !newExpense.name || !newExpense.type || !newExpense.amount) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const date = new Date(newExpense.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    try {
      if (isEditing && selectedExpenseId) {
        // Updating existing expense
        const updatedData = {
          date: newExpense.date,
          name: newExpense.name,
          type: newExpense.type,
          amount: Number(newExpense.amount),
          description: newExpense.description,
          year,
          month
        };
        
        await databaseService.updateExpense(selectedExpenseId, updatedData);
        
        // Update local state
        setExpenses(prevExpenses => 
          prevExpenses.map(expense => 
            expense.id === selectedExpenseId 
              ? { ...expense, ...updatedData, id: selectedExpenseId }
              : expense
          )
        );
        
        toast.success('지출이 수정되었습니다.');
      } else {
        // Adding new expense
        const newExpenseItem = await databaseService.addExpense({
          date: newExpense.date,
          name: newExpense.name,
          type: newExpense.type,
          amount: Number(newExpense.amount),
          description: newExpense.description,
          year,
          month
        });

        setExpenses(prev => [newExpenseItem, ...prev]);
        toast.success('새로운 지출이 추가되었습니다.');
      }

      setNewExpenseOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to process expense:", error);
      toast.error(isEditing ? "지출 수정에 실패했습니다." : "지출 추가에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">지출내역</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportImage}>
            <Download className="mr-2 h-4 w-4" />
            이미지로 내보내기
          </Button>
          <Dialog open={newExpenseOpen} onOpenChange={(open) => {
            setNewExpenseOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!canEdit}>
                <PlusCircle className="mr-2 h-4 w-4" />
                새로운 지출
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? '지출 수정' : '새로운 지출 추가'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">내용</Label>
                    <Input 
                      id="name" 
                      placeholder="내용 입력" 
                      value={newExpense.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">항목</Label>
                    <Select
                      value={newExpense.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="항목 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="식대">식대</SelectItem>
                        <SelectItem value="경조사비">경조사비</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">금액</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      min="0"
                      value={newExpense.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명 (선택사항)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="설명을 입력하세요"
                    value={newExpense.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setNewExpenseOpen(false);
                    resetForm();
                  }}>
                    취소
                  </Button>
                  <Button type="submit">{isEditing ? '수정' : '추가'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handlePreviousYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-xl font-semibold">{selectedYear}년</h3>
        <Button variant="outline" size="sm" onClick={handleNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div id="expenses-content" ref={expensesRef} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>지출 내역</CardTitle>
            <div className="text-lg font-semibold text-red-600">
              총 지출: {totalExpense.toLocaleString()}원
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-4 text-center">데이터를 불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">날짜</th>
                      <th className="p-2 text-left">내용</th>
                      <th className="p-2 text-left">항목</th>
                      <th className="p-2 text-right">금액</th>
                      <th className="p-2 text-left">설명</th>
                      <th className="p-2 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map(expense => (
                        <tr key={expense.id} className="border-b hover:bg-muted/50 cursor-pointer">
                          <td className="p-2">{expense.date}</td>
                          <td className="p-2">{expense.name}</td>
                          <td className="p-2">{expense.type}</td>
                          <td className="p-2 text-right">{expense.amount.toLocaleString()}원</td>
                          <td className="p-2">{expense.description}</td>
                          <td className="p-2 flex justify-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(expense)}
                              disabled={!canEdit}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"
                              onClick={() => handleOpenDeleteDialog(expense.id)}
                              disabled={!canEdit}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          {selectedYear}년도의 지출 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>지출 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 지출 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setExpenseToDelete(null);
            }}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-red-500 hover:bg-red-700">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;
