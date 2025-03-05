
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const { canEdit } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // State for real data
  const [carryoverAmount, setCarryoverAmount] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [recentIncomes, setRecentIncomes] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [previousYearBalance, setPreviousYearBalance] = useState(0);

  // Load data when year changes
  useEffect(() => {
    const loadData = async () => {
      try {
        // Calculate previous year's final balance
        const prevYearBalance = await databaseService.calculatePreviousYearBalance(selectedYear);
        setPreviousYearBalance(prevYearBalance);
        
        // Get carryover amount
        const savedCarryover = await databaseService.getCarryoverAmount(selectedYear);
        setCarryoverAmount(savedCarryover);
        
        // Calculate current balance
        const balance = await databaseService.calculateCurrentBalance(selectedYear);
        setCurrentBalance(balance);
        
        // Get monthly data
        const monthly = await databaseService.getMonthlyFinanceData(selectedYear);
        setMonthlyData(monthly);
        
        // Get recent incomes
        const allIncomes = await databaseService.getIncomes();
        const filteredIncomes = allIncomes.slice(0, 5); // Get latest 5 incomes
        setRecentIncomes(filteredIncomes);
        
        // Get recent expenses
        const allExpenses = await databaseService.getExpenses();
        const filteredExpenses = allExpenses.slice(0, 5); // Get latest 5 expenses
        setRecentExpenses(filteredExpenses);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
      }
    };
    
    loadData();
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

  // Auto-update carryover from previous year's final balance
  useEffect(() => {
    if (previousYearBalance !== 0) {
      const updateCarryover = async () => {
        await databaseService.saveCarryoverAmount(selectedYear, previousYearBalance);
        setCarryoverAmount(previousYearBalance);
        
        // Update current balance after saving carryover
        const balance = await databaseService.calculateCurrentBalance(selectedYear);
        setCurrentBalance(balance);
      };
      
      updateCarryover();
    }
  }, [previousYearBalance, selectedYear]);

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
              <CardTitle className="text-lg">이전년도 이월 금액</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{carryoverAmount.toLocaleString()}원</p>
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
                      <td className="border p-2">{MONTH_NAMES[data.month - 1]}</td>
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
                    {recentIncomes.length > 0 ? (
                      recentIncomes.map(income => (
                        <tr key={income.id} className="border-b">
                          <td className="p-2">{income.date}</td>
                          <td className="p-2">{income.name}</td>
                          <td className="p-2">{income.type}</td>
                          <td className="p-2 text-right">{income.amount.toLocaleString()}원</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          수입 내역이 없습니다.
                        </td>
                      </tr>
                    )}
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
                    {recentExpenses.length > 0 ? (
                      recentExpenses.map(expense => (
                        <tr key={expense.id} className="border-b">
                          <td className="p-2">{expense.date}</td>
                          <td className="p-2">{expense.name}</td>
                          <td className="p-2">{expense.type}</td>
                          <td className="p-2 text-right">{expense.amount.toLocaleString()}원</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          지출 내역이 없습니다.
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
    </div>
  );
};

export default Dashboard;
