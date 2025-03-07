
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import { MONTH_NAMES } from '@/utils/constants';

// Import our new components
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { MonthlyBalanceTable } from '@/components/dashboard/MonthlyBalanceTable';
import { RecentTransactionsTable } from '@/components/dashboard/RecentTransactionsTable';
import { YearSelector } from '@/components/dashboard/YearSelector';

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
  
  // Calculate summary stats
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
          <YearSelector 
            selectedYear={selectedYear} 
            onPreviousYear={handlePreviousYear} 
            onNextYear={handleNextYear}
          />
        </div>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="dashboard-content" ref={dashboardRef} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard 
            title="총 수입" 
            value={`${totalIncome.toLocaleString()}원`} 
            valueClassName="text-green-600"
          />
          <StatsCard 
            title="총 지출" 
            value={`${totalExpense.toLocaleString()}원`} 
            valueClassName="text-red-600"
          />
          <StatsCard 
            title="잔액" 
            value={`${balance.toLocaleString()}원`} 
            valueClassName={balance >= 0 ? 'text-blue-600' : 'text-red-600'}
          />
          <StatsCard 
            title="회비 납부율" 
            value={`${duesPaymentRate}%`} 
            subValue={`총 회원 ${memberCount}명 중 ${unpaidMembersCount}명 미납`}
          />
        </div>
        
        <MonthlyBarChart data={monthlyStats} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthlyBalanceTable data={monthlyStats} />
          <RecentTransactionsTable incomes={incomes} expenses={expenses} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
