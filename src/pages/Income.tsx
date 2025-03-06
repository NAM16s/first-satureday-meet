
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronLeft, ChevronRight, Plus, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import { IncomeDialog } from '@/components/income/IncomeDialog';
import { Income } from '@/utils/types';

const IncomePage = () => {
  const { canEdit } = useAuth();
  const incomeRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIncome, setActiveIncome] = useState<Income | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [sortColumn, setSortColumn] = useState<'date' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const membersData = await databaseService.getMembers();
        setMembers(membersData);
        
        const incomesData = await databaseService.getIncomes();
        const filteredByYear = incomesData.filter(income => income.year === selectedYear);
        setIncomes(filteredByYear);
      } catch (error) {
        console.error('Error loading income data:', error);
        toast.error('수입 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadData();
  }, [selectedYear]);

  useEffect(() => {
    let filtered = [...incomes];
    
    if (searchQuery) {
      filtered = filtered.filter(income => 
        income.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      if (sortColumn === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortColumn === 'name') {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
      return 0;
    });
    
    setFilteredIncomes(filtered);
  }, [incomes, searchQuery, sortColumn, sortDirection]);

  const handleColumnSort = (column: 'date' | 'name') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddIncome = () => {
    if (!canEdit) {
      toast.info('수입 내역은 회계 또는 관리자만 추가할 수 있습니다.');
      return;
    }
    
    setIsCreating(true);
    setActiveIncome({
      id: '',
      date: new Date().toISOString().split('T')[0],
      userId: '',
      name: '',
      type: '회비',
      amount: 0,
      description: '',
      year: selectedYear,
      month: new Date().getMonth() + 1
    });
    setDialogOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    if (!canEdit) {
      toast.info('수입 내역은 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
    setIsCreating(false);
    setActiveIncome(income);
    setDialogOpen(true);
  };

  const handleSaveIncome = async (income: Income) => {
    try {
      if (isCreating) {
        await databaseService.addIncome(income);
        toast.success('수입이 추가되었습니다.');
      } else {
        await databaseService.updateIncome(income.id, income);
        toast.success('수입이 수정되었습니다.');
      }
      
      const updatedIncomes = await databaseService.getIncomes();
      const filteredByYear = updatedIncomes.filter(i => i.year === selectedYear);
      setIncomes(filteredByYear);
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('수입을 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await databaseService.deleteIncome(id);
      toast.success('수입이 삭제되었습니다.');
      
      const updatedIncomes = await databaseService.getIncomes();
      const filteredByYear = updatedIncomes.filter(i => i.year === selectedYear);
      setIncomes(filteredByYear);
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('수입을 삭제하는 중 오류가 발생했습니다.');
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">수입내역</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportImage}>
            <Download className="mr-2 h-4 w-4" />
            이미지로 내보내기
          </Button>
          {canEdit && (
            <Button onClick={handleAddIncome}>
              <Plus className="mr-2 h-4 w-4" />
              수입추가
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>수입 내역</CardTitle>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg">{selectedYear}년</span>
              <Button variant="outline" size="sm" onClick={handleNextYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Input
                placeholder="회원명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
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
                      {sortColumn === 'date' ? (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <span className="ml-1 h-4 w-4 flex items-center">
                          <ArrowUp className="h-2 w-2" />
                          <ArrowDown className="h-2 w-2" />
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="border p-2 text-left cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleColumnSort('name')}
                  >
                    <div className="flex items-center">
                      회원명
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <span className="ml-1 h-4 w-4 flex items-center">
                          <ArrowUp className="h-2 w-2" />
                          <ArrowDown className="h-2 w-2" />
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="border p-2 text-left">항목</th>
                  <th className="border p-2 text-left">내용</th>
                  <th className="border p-2 text-right">금액</th>
                  {canEdit && <th className="border p-2 text-center">관리</th>}
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.length > 0 ? (
                  filteredIncomes.map(income => (
                    <tr key={income.id} className="border-b">
                      <td className="border p-2">{income.date}</td>
                      <td className="border p-2">{income.name}</td>
                      <td className="border p-2">{income.type}</td>
                      <td className="border p-2">{income.description}</td>
                      <td className="border p-2 text-right text-green-600">
                        {income.amount.toLocaleString()}원
                      </td>
                      {canEdit && (
                        <td className="border p-2 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditIncome(income)}
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
                      수입 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold">
                  <td colSpan={4} className="border p-2 text-right">합계</td>
                  <td className="border p-2 text-right text-green-600">
                    {filteredIncomes.reduce((sum, income) => sum + income.amount, 0).toLocaleString()}원
                  </td>
                  {canEdit && <td className="border"></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {activeIncome && (
        <IncomeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          income={activeIncome}
          isCreating={isCreating}
          members={members}
          onSave={handleSaveIncome}
          onDelete={handleDeleteIncome}
        />
      )}
    </div>
  );
};

export default IncomePage;
