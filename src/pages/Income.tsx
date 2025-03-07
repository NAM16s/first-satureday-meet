import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { Income as IncomeType } from '@/utils/types';

const Income = () => {
  const incomeRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadIncomes = async () => {
      try {
        const allIncomes = await databaseService.getIncomes();
        const filteredIncomes = allIncomes.filter(income => income.year === selectedYear);
        setIncomes(filteredIncomes);
      } catch (error) {
        console.error('Error loading incomes:', error);
        toast.error('수입 내역을 불러오는 중 오류가 발생했습니다.');
      }
    };

    loadIncomes();
  }, [selectedYear]);

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

  const filteredIncomes = incomes.filter(income =>
    income.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">수입내역</h2>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousYear}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium">{selectedYear}년</span>
            <Button variant="outline" size="sm" onClick={handleNextYear}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center">
          <Input
            placeholder="회원명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 mr-2"
          />
          <Button variant="outline" onClick={handleExportImage}>
            <Download className="mr-2 h-4 w-4" />
            이미지로 내보내기
          </Button>
        </div>
      </div>

      <div id="income-content" ref={incomeRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>수입 내역 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">이름</th>
                    <th className="p-2 text-left">유형</th>
                    <th className="p-2 text-right">금액</th>
                    <th className="p-2 text-left">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomes.map((income) => (
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
    </div>
  );
};

export default Income;
