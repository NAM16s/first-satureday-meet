
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { IncomeDialog } from '@/components/income/IncomeDialog';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';

const Income = () => {
  const incomeRef = useRef<HTMLDivElement>(null);
  const { canEdit } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [incomes, setIncomes] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  useEffect(() => {
    const loadIncomes = async () => {
      try {
        const allIncomes = await databaseService.getIncomes();
        const filteredIncomes = allIncomes.filter(income => income.year === selectedYear);
        setIncomes(filteredIncomes);
      } catch (error) {
        console.error('Error loading incomes:', error);
        toast.error('수입 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadIncomes();
  }, [selectedYear]);

  const handleExportImage = () => {
    exportAsImage(incomeRef.current!.id, `수입내역_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleAddNewIncome = () => {
    setEditingIncome(null);
    setDialogOpen(true);
  };

  const handleEditIncome = (income: any) => {
    setEditingIncome(income);
    setDialogOpen(true);
  };

  const handleSaveIncome = async (incomeData: any) => {
    try {
      if (editingIncome) {
        await databaseService.updateIncome(editingIncome.id, incomeData);
        
        setIncomes(prev => 
          prev.map(income => 
            income.id === editingIncome.id ? { ...incomeData, id: editingIncome.id } : income
          )
        );
        
        toast.success('수입이 수정되었습니다.');
      } else {
        const newIncome = await databaseService.addIncome(incomeData);
        
        setIncomes(prev => [...prev, newIncome]);
        
        toast.success('새 수입이 추가되었습니다.');
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('수입 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await databaseService.deleteIncome(id);
      
      setIncomes(prev => prev.filter(income => income.id !== id));
      
      toast.success('수입이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('수입 삭제 중 오류가 발생했습니다.');
    }
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const filteredIncomes = incomes.filter(income => 
    income.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    income.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedIncomes = [...filteredIncomes].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const calculateTotal = (items: any[]) => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  const total = calculateTotal(filteredIncomes);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">수입내역</h2>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="income-content" ref={incomeRef} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>수입 내역 상세</CardTitle>
            <div className="flex-grow flex justify-center">
              <div className="flex items-center space-x-2 mx-4">
                <Button variant="outline" size="sm" onClick={handlePreviousYear}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg">{selectedYear}년</span>
                <Button variant="outline" size="sm" onClick={handleNextYear}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="회원명으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddNewIncome} 
                  disabled={!canEdit}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  새로운 수입
                </Button>
              </DialogTrigger>
              <IncomeDialog
                income={editingIncome}
                onSave={handleSaveIncome}
                onDelete={handleDeleteIncome}
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
                  <TableHead>회원명</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>세부내용</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  {canEdit && <TableHead className="text-center">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIncomes.length > 0 ? (
                  sortedIncomes.map((income) => (
                    <TableRow 
                      key={income.id} 
                      className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={canEdit ? () => handleEditIncome(income) : undefined}
                    >
                      <TableCell>{income.date}</TableCell>
                      <TableCell>{income.name}</TableCell>
                      <TableCell>{income.type}</TableCell>
                      <TableCell>{income.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{income.amount.toLocaleString()}원</TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditIncome(income);
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
                      수입 내역이 없습니다.
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

export default Income;
