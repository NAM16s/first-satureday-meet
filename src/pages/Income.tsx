
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const Income = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newIncomeOpen, setNewIncomeOpen] = useState(false);

  // 임시 수입 데이터
  const incomes = [
    { id: '1', date: '2023-12-15', name: '김성우', type: '회비', amount: 50000, description: '12월 회비' },
    { id: '2', date: '2023-12-14', name: '유영우', type: '회비', amount: 50000, description: '12월 회비' },
    { id: '3', date: '2023-12-10', name: '이정규', type: '회비', amount: 50000, description: '12월 회비' },
    { id: '4', date: '2023-12-08', name: '강병우', type: '기타', amount: 100000, description: '친목비 환급' },
    { id: '5', date: '2023-12-05', name: '문석규', type: '회비', amount: 50000, description: '12월 회비' },
  ];

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleExportImage = () => {
    // 이미지 내보내기 로직 (미구현)
    alert('이미지 내보내기 기능은 아직 구현되지 않았습니다.');
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    // 수입 추가 로직 (미구현)
    setNewIncomeOpen(false);
    alert('새로운 수입이 추가되었습니다.');
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
                    <Input id="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member">회원</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="회원 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="김성우">김성우</SelectItem>
                        <SelectItem value="김태우">김태우</SelectItem>
                        <SelectItem value="김원중">김원중</SelectItem>
                        {/* 다른 회원들도 추가 */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">항목</Label>
                    <Select>
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
                    <Input id="amount" type="number" min="0" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명 (선택사항)</Label>
                  <Textarea id="description" placeholder="설명을 입력하세요" />
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
                {incomes.map(income => (
                  <tr key={income.id} className="border-b">
                    <td className="p-2">{income.date}</td>
                    <td className="p-2">{income.name}</td>
                    <td className="p-2">{income.type}</td>
                    <td className="p-2 text-right">{income.amount.toLocaleString()}원</td>
                    <td className="p-2">{income.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Income;
