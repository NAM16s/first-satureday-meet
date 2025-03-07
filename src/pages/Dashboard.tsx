
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import { MONTH_NAMES } from '@/utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [duesData, setDuesData] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // 모든 회원 데이터 불러오기
        const membersData = await databaseService.getMembers();
        setMembers(membersData);
        
        // 연간 수입 불러오기
        const incomesData = await databaseService.getIncomes();
        const yearIncomes = incomesData.filter(income => income.year === selectedYear);
        setIncomes(yearIncomes);
        
        // 연간 지출 불러오기
        const expensesData = await databaseService.getExpenses();
        const yearExpenses = expensesData.filter(expense => {
          const expenseYear = new Date(expense.date).getFullYear();
          return expenseYear === selectedYear;
        });
        setExpenses(yearExpenses);
        
        // 회비 데이터 불러오기
        const duesData = await databaseService.getDues(selectedYear);
        setDuesData(duesData);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadData();
  }, [selectedYear]);
  
  useEffect(() => {
    calculateMonthlyStats();
  }, [incomes, expenses]);
  
  const handleExportImage = () => {
    exportAsImage(dashboardRef.current!.id, `대시보드_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };
  
  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };
  
  const calculateMonthlyStats = () => {
    const stats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: MONTH_NAMES[i],
      income: 0,
      expense: 0,
      balance: 0
    }));
    
    // 월별 수입 계산
    incomes.forEach(income => {
      if (income.month) {
        stats[income.month - 1].income += income.amount;
      } else {
        const month = new Date(income.date).getMonth();
        stats[month].income += income.amount;
      }
    });
    
    // 월별 지출 계산
    expenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      stats[month].expense += expense.amount;
    });
    
    // 월별 잔액 계산
    stats.forEach(stat => {
      stat.balance = stat.income - stat.expense;
    });
    
    setMonthlyStats(stats);
  };
  
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalIncome - totalExpense;
  
  const memberCount = members.length;
  
  // 미납자 수 계산
  const unpaidMembersCount = duesData.filter(dues => 
    dues.unpaidAmount > 0
  ).length;
  
  // 회비 납부율 계산
  const duesPaymentCount = duesData.reduce((count, dues) => {
    const paidMonths = dues.monthlyDues.filter((due: any) => 
      due.status === 'paid' || due.status === 'prepaid'
    ).length;
    return count + paidMonths;
  }, 0);
  
  const maxPossiblePayments = memberCount * 12;
  const duesPaymentRate = maxPossiblePayments > 0 
    ? Math.round((duesPaymentCount / maxPossiblePayments) * 100) 
    : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">대시보드</h2>
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
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="dashboard-content" ref={dashboardRef} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">총 수입</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalIncome.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">총 지출</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalExpense.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">잔액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {balance.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">회비 납부율</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {duesPaymentRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                총 회원 {memberCount}명 중 {unpaidMembersCount}명 미납
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>월별 수입/지출 차트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyStats}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()}원`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="수입" fill="#22c55e" />
                  <Bar dataKey="expense" name="지출" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>월별 잔액 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>월</TableHead>
                    <TableHead>수입</TableHead>
                    <TableHead>지출</TableHead>
                    <TableHead>잔액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((stat) => (
                    <TableRow key={stat.month}>
                      <TableCell>{stat.monthName}</TableCell>
                      <TableCell>{stat.income.toLocaleString()}원</TableCell>
                      <TableCell>{stat.expense.toLocaleString()}원</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {stat.balance > 0 ? (
                            <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                          ) : stat.balance < 0 ? (
                            <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
                          ) : null}
                          <span className={stat.balance > 0 ? 'text-green-600' : stat.balance < 0 ? 'text-red-600' : ''}>
                            {stat.balance.toLocaleString()}원
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>최근 거래 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>분류</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...incomes, ...expenses]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          {items.type ? (
                            incomes.includes(item) ? '수입' : '지출'
                          ) : (
                            <span>
                              {incomes.includes(item) ? '수입' : '지출'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{item.description || item.name}</TableCell>
                        <TableCell className={incomes.includes(item) ? 'text-green-600' : 'text-red-600'}>
                          {incomes.includes(item) ? '+' : '-'}
                          {item.amount.toLocaleString()}원
                        </TableCell>
                      </TableRow>
                    ))}
                  {[...incomes, ...expenses].length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        거래 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
