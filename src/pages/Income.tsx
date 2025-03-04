
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';

const Income = () => {
  const incomeRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newIncomeOpen, setNewIncomeOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({
    date: '',
    member: '',
    type: '',
    amount: '',
    description: ''
  });

  // 수입 데이터 로드
  const [incomes, setIncomes] = useState(() => databaseService.getIncomes());
  
  // 회원 데이터 로드
  const [members, setMembers] = useState(() => databaseService.getMembers());

  // 데이터 변경시 저장
  useEffect(() => {
    databaseService.saveIncomes(incomes);
  }, [incomes]);

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

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.date || !newIncome.member || !newIncome.type || !newIncome.amount) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const date = new Date(newIncome.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const memberName = members.find(m => m.id === newIncome.member)?.name || '';
    
    const newIncomeItem = databaseService.addIncome({
      date: newIncome.date,
      name: memberName,
      type: newIncome.type,
      amount: Number(newIncome.amount),
      description: newIncome.description,
      year,
      month,
      userId: newIncome.member
    });

    setIncomes(prev => [newIncomeItem, ...prev]);
    setNewIncomeOpen(false);
    setNewIncome({ date: '', member: '', type: '', amount: '', description: '' });
    toast.success('새로운 수입이 추가되었습니다.');
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
          <Dialog open={newIncomeOpen} onOpenChange={setNewIncomeOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                새로운 수입
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새로운 수입 추가</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddIncome} className="space-y-4">
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
                  <Button type="button" variant="outline" onClick={() => setNewIncomeOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit">추가</Button>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">회원명</th>
                    <th className="p-2 text-left">항목</th>
                    <th className="p-2 text-right">금액</th>
                    <th className="p-2 text-left">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.length > 0 ? (
                    filteredIncomes.map(income => (
                      <tr key={income.id} className="border-b">
                        <td className="p-2">{income.date}</td>
                        <td className="p-2">{income.name}</td>
                        <td className="p-2">{income.type}</td>
                        <td className="p-2 text-right">{income.amount.toLocaleString()}원</td>
                        <td className="p-2">{income.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        {selectedYear}년도의 수입 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Income;
