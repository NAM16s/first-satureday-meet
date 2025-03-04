
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatCurrency, getKoreanMonthName, formatDate } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { yearlyData, selectedYear, setSelectedYear, getRecentTransactions } = useFinance();
  const { users } = useAuth();
  const currentYearData = yearlyData.find(data => data.year === selectedYear) || {
    year: selectedYear,
    balanceForward: 0,
    currentBalance: 0,
    monthlyIncomes: [],
    monthlyExpenses: []
  };

  const recentIncomes = getRecentTransactions('income', 5);
  const recentExpenses = getRecentTransactions('expense', 5);

  // Prepare data for the chart
  const chartData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const income = currentYearData.monthlyIncomes.find(data => data.month === month)?.amount || 0;
    const expense = currentYearData.monthlyExpenses.find(data => data.month === month)?.amount || 0;
    
    return {
      month: getKoreanMonthName(month),
      수입: income,
      지출: expense,
    };
  });

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
  };

  // Find username by userId
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  return (
    <Layout title="대시보드">
      <div className="space-y-6">
        {/* Year selector */}
        <div className="flex justify-center items-center mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousYear}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center px-4 py-2 bg-card border rounded-md">
            <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{selectedYear}년</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextYear}
            className="ml-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전년도 이월</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentYearData.balanceForward)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">현재 잔액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(currentYearData.currentBalance)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{selectedYear}년 월별 수입/지출 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('ko-KR', {
                        notation: 'compact',
                        compactDisplay: 'short'
                      }).format(value)
                    } 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)} 
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="수입" fill="#4f46e5" />
                  <Bar dataKey="지출" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>최근 수입 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {recentIncomes.length > 0 ? (
                <div className="space-y-3">
                  {recentIncomes.map((income) => (
                    <div key={income.id} className="flex justify-between items-center p-3 bg-accent rounded-md">
                      <div>
                        <div className="font-medium">{getUserName(income.userId)}</div>
                        <div className="text-sm text-muted-foreground">{income.category} - {formatDate(income.date)}</div>
                      </div>
                      <div className="font-semibold text-primary">{formatCurrency(income.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">수입 내역이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>최근 지출 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length > 0 ? (
                <div className="space-y-3">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-accent rounded-md">
                      <div>
                        <div className="font-medium">{getUserName(expense.userId)}</div>
                        <div className="text-sm text-muted-foreground">{expense.category} - {formatDate(expense.date)}</div>
                      </div>
                      <div className="font-semibold text-destructive">{formatCurrency(expense.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">지출 내역이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
