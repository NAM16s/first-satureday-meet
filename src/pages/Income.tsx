
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

const Income = () => {
  const { canEdit } = useAuth();
  const incomeRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newIncomeOpen, setNewIncomeOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);

  const [newIncome, setNewIncome] = useState({
    id: '',
    date: '',
    member: '',
    type: '',
    amount: '',
    description: ''
  });

  // 수입 데이터 로드
  const [incomes, setIncomes] = useState<any[]>([]);
  
  // 회원 데이터 로드
  const [members, setMembers] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [incomesData, membersData] = await Promise.all([
          databaseService.getIncomes(),
          databaseService.getMembers()
        ]);
        setIncomes(incomesData);
        setMembers(membersData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 선택한 연도의 수입만 필터링
  const filteredIncomes = incomes.filter(income => {
    const year = new Date(income.date).getFullYear();
    return year === selectedYear;
  });

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleExportImage = () => {
    exportAsImage(incomeRef.current!.id, `수입내역_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleInputChange = (field: string, value: string) => {
    setNewIncome(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setNewIncome({ id: '', date: '', member: '', type: '', amount: '', description: '' });
    setIsEditing(false);
    setSelectedIncomeId(null);
  };

  const handleOpenEditDialog = (income: any) => {
    if (!canEdit) {
      toast.info('수입 정보는 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
    setIsEditing(true);
    setSelectedIncomeId(income.id);
    
    // Find the member ID
    const member = members.find(m => m.name === income.name);
    const memberId = member ? member.id : '';
    
    setNewIncome({
      id: income.id,
      date: income.date,
      member: income.user_id || memberId,
      type: income.type,
      amount: income.amount.toString(),
      description: income.description || ''
    });
    
    setNewIncomeOpen(true);
  };

  const handleOpenDeleteDialog = (incomeId: string) => {
    if (!canEdit) {
      toast.info('수입 정보는 회계 또는 관리자만 삭제할 수 있습니다.');
      return;
    }
    
    setIncomeToDelete(incomeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) return;

    try {
      // Check if this income is tied to dues payment
      const income = incomes.find(inc => inc.id === incomeToDelete);
      if (income.type === '회비') {
        // Need to also update the dues status
        const year = new Date(income.date).getFullYear();
        const month = new Date(income.date).getMonth() + 1;
        const userId = income.user_id;
        
        // Get dues data
        const duesData = await databaseService.getDues(year);
        if (duesData && duesData.length > 0) {
          const userDues = duesData.find((dues: any) => dues.userId === userId);
          if (userDues) {
            // Update dues status for this month
            const updatedDues = duesData.map((dues: any) => 
              dues.userId === userId 
                ? {
                    ...dues,
                    monthlyDues: dues.monthlyDues.map((due: any) => 
                      due.month === month 
                        ? { ...due, paid: false, amount: 0 }
                        : due
                    )
                  }
                : dues
            );
            
            await databaseService.saveDues(year, updatedDues);
          }
        }
      }
      
      // Delete the income
      await databaseService.deleteIncome(incomeToDelete);
      
      // Update the local state
      setIncomes(prevIncomes => prevIncomes.filter(income => income.id !== incomeToDelete));
      
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
      toast.success('수입이 삭제되었습니다.');
    } catch (error) {
      console.error("Failed to delete income:", error);
      toast.error("수입 삭제에 실패했습니다.");
    }
  };

  const handleSubmitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.date || !newIncome.member || !newIncome.type || !newIncome.amount) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const date = new Date(newIncome.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const memberObj = members.find(m => m.id === newIncome.member);
    if (!memberObj) {
      toast.error('유효하지 않은 회원입니다.');
      return;
    }
    
    try {
      if (isEditing && selectedIncomeId) {
        // Updating existing income
        const updatedData = {
          date: newIncome.date,
          name: memberObj.name,
          type: newIncome.type,
          amount: Number(newIncome.amount),
          description: newIncome.description,
          year,
          month,
          userId: newIncome.member
        };
        
        await databaseService.updateIncome(selectedIncomeId, updatedData);
        
        // Update local state
        setIncomes(prevIncomes => 
          prevIncomes.map(income => 
            income.id === selectedIncomeId 
              ? { ...income, ...updatedData, id: selectedIncomeId }
              : income
          )
        );
        
        // If this was dues payment, update the dues status
        if (newIncome.type === '회비') {
          // Get dues data
          const duesData = await databaseService.getDues(year);
          if (duesData && duesData.length > 0) {
            const userDues = duesData.find((dues: any) => dues.userId === newIncome.member);
            if (userDues) {
              // Update dues status for this month
              const updatedDues = duesData.map((dues: any) => 
                dues.userId === newIncome.member 
                  ? {
                      ...dues,
                      monthlyDues: dues.monthlyDues.map((due: any) => 
                        due.month === month 
                          ? { ...due, paid: true, amount: Number(newIncome.amount) }
                          : due
                      )
                    }
                  : dues
              );
              
              await databaseService.saveDues(year, updatedDues);
            }
          }
        }
        
        toast.success('수입이 수정되었습니다.');
      } else {
        // Adding new income
        const newIncomeItem = await databaseService.addIncome({
          date: newIncome.date,
          name: memberObj.name,
          type: newIncome.type,
          amount: Number(newIncome.amount),
          description: newIncome.description,
          year,
          month,
          userId: newIncome.member
        });

        setIncomes(prev => [newIncomeItem, ...prev]);
        
        // If this is dues payment, update the dues status
        if (newIncome.type === '회비') {
          // Get dues data
          const duesData = await databaseService.getDues(year);
          if (duesData && duesData.length > 0) {
            const userDues = duesData.find((dues: any) => dues.userId === newIncome.member);
            if (userDues) {
              // Update dues status for this month
              const updatedDues = duesData.map((dues: any) => 
                dues.userId === newIncome.member 
                  ? {
                      ...dues,
                      monthlyDues: dues.monthlyDues.map((due: any) => 
                        due.month === month 
                          ? { ...due, paid: true, amount: Number(newIncome.amount) }
                          : due
                      )
                    }
                  : dues
              );
              
              await databaseService.saveDues(year, updatedDues);
            }
          }
        }
        
        toast.success('새로운 수입이 추가되었습니다.');
      }

      setNewIncomeOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to process income:", error);
      toast.error(isEditing ? "수입 수정에 실패했습니다." : "수입 추가에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">수입내역</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportImage}>
            <Download className="mr-2 h-4 w-4" />
            이미지로 내보내기
          </Button>
          <Dialog open={newIncomeOpen} onOpenChange={(open) => {
            setNewIncomeOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!canEdit}>
                <PlusCircle className="mr-2 h-4 w-4" />
                새로운 수입
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? '수입 수정' : '새로운 수입 추가'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitIncome} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={newIncome.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member">회원</Label>
                    <Select
                      value={newIncome.member}
                      onValueChange={(value) => handleInputChange('member', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="회원 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">항목</Label>
                    <Select
                      value={newIncome.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="항목 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="회비">회비</SelectItem>
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
                      value={newIncome.amount}
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
                    value={newIncome.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setNewIncomeOpen(false);
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

      <div id="income-content" ref={incomeRef} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>수입 내역</CardTitle>
            <div className="text-lg font-semibold text-green-600">
              총 수입: {totalIncome.toLocaleString()}원
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
                      <th className="p-2 text-left">회원명</th>
                      <th className="p-2 text-left">항목</th>
                      <th className="p-2 text-right">금액</th>
                      <th className="p-2 text-left">설명</th>
                      <th className="p-2 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomes.length > 0 ? (
                      filteredIncomes.map(income => (
                        <tr key={income.id} className="border-b hover:bg-muted/50 cursor-pointer">
                          <td className="p-2">{income.date}</td>
                          <td className="p-2">{income.name}</td>
                          <td className="p-2">{income.type}</td>
                          <td className="p-2 text-right">{income.amount.toLocaleString()}원</td>
                          <td className="p-2">{income.description}</td>
                          <td className="p-2 flex justify-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(income)}
                              disabled={!canEdit}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"
                              onClick={() => handleOpenDeleteDialog(income.id)}
                              disabled={!canEdit}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          {selectedYear}년도의 수입 내역이 없습니다.
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
            <AlertDialogTitle>수입 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 수입 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 회비 납부 기록과 같은 연동된 데이터도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setIncomeToDelete(null);
            }}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIncome} className="bg-red-500 hover:bg-red-700">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Income;
