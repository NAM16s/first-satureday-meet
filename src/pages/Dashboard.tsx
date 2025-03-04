
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';

const Dashboard = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isEditingCarryover, setIsEditingCarryover] = useState(false);
  
  // 이 부분은 실제 데이터로 연결해야 함
  const [carryoverAmount, setCarryoverAmount] = useState(1500000);
  const [currentBalance, setCurrentBalance] = useState(2750000);
  
  const [recentIncomes, setRecentIncomes] = useState([
    { id: '1', date: '2023-12-15', name: '김성우', type: '회비', amount: 50000 },
    { id: '2', date: '2023-12-14', name: '유영우', type: '회비', amount: 50000 },
    { id: '3', date: '2023-12-10', name: '이정규', type: '회비', amount: 50000 },
  ]);

  const [recentExpenses, setRecentExpenses] = useState([
    { id: '1', date: '2023-12-20', name: '회식비', type: '식대', amount: 350000 },
    { id: '2', date: '2023-12-05', name: '김태우 결혼축의금', type: '경조사비', amount: 200000 },
  ]);

  const monthlyData = MONTH_NAMES.map((month, index) => ({
    month: month,
    income: Math.floor(Math.random() * 500000) + 100000, // 임시 데이터
    expense: Math.floor(Math.random() * 300000) + 50000, // 임시 데이터
  }));

  useEffect(() => {
    // 여기서 FinanceContext 데이터를 가져와서 최신 5개의 수입/지출 내역을 가져와야 함
    // 예시 데이터만 표시
  }, [selectedYear]);

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleExportImage = () => {
    exportAsImage(dashboardRef.current!.id, `대시보드_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleCarryoverSave = () => {
    // 실제로는 FinanceContext에 저장해야 함
    setIsEditingCarryover(false);
    toast.success('이월 금액이 저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">대시보드</h2>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
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

      <div id="dashboard-content" ref={dashboardRef} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>이전년도 이월 금액</span>
                {isEditingCarryover ? (
                  <Button size="sm" onClick={handleCarryoverSave}>저장</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditingCarryover(true)}>수정</Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingCarryover ? (
                <Input
                  type="number"
                  value={carryoverAmount}
                  onChange={(e) => setCarryoverAmount(Number(e.target.value))}
                  className="text-xl font-bold"
                />
              ) : (
                <p className="text-2xl font-bold">{carryoverAmount.toLocaleString()}원</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">현재 잔액</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{currentBalance.toLocaleString()}원</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>월별 수입 및 지출 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">월</th>
                    <th className="border p-2 text-right">수입</th>
                    <th className="border p-2 text-right">지출</th>
                    <th className="border p-2 text-right">잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data, index) => (
                    <tr key={index} className="border-b">
                      <td className="border p-2">{data.month}</td>
                      <td className="border p-2 text-right text-green-600">{data.income.toLocaleString()}원</td>
                      <td className="border p-2 text-right text-red-600">{data.expense.toLocaleString()}원</td>
                      <td className="border p-2 text-right">{(data.income - data.expense).toLocaleString()}원</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td className="border p-2">합계</td>
                    <td className="border p-2 text-right text-green-600">
                      {monthlyData.reduce((sum, data) => sum + data.income, 0).toLocaleString()}원
                    </td>
                    <td className="border p-2 text-right text-red-600">
                      {monthlyData.reduce((sum, data) => sum + data.expense, 0).toLocaleString()}원
                    </td>
                    <td className="border p-2 text-right">
                      {monthlyData.reduce((sum, data) => sum + (data.income - data.expense), 0).toLocaleString()}원
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>최근 수입 내역</CardTitle>
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
                    </tr>
                  </thead>
                  <tbody>
                    {recentIncomes.map(income => (
                      <tr key={income.id} className="border-b">
                        <td className="p-2">{income.date}</td>
                        <td className="p-2">{income.name}</td>
                        <td className="p-2">{income.type}</td>
                        <td className="p-2 text-right">{income.amount.toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>최근 지출 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">날짜</th>
                      <th className="p-2 text-left">내용</th>
                      <th className="p-2 text-left">항목</th>
                      <th className="p-2 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map(expense => (
                      <tr key={expense.id} className="border-b">
                        <td className="p-2">{expense.date}</td>
                        <td className="p-2">{expense.name}</td>
                        <td className="p-2">{expense.type}</td>
                        <td className="p-2 text-right">{expense.amount.toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
