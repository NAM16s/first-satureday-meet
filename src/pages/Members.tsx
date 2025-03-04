
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Members = () => {
  const membersRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Member data from database
  const [members, setMembers] = useState(() => databaseService.getMembers());

  // Dues data from database
  const [duesStatus, setDuesStatus] = useState<any[]>([]);

  // Special events (expenses linked to members)
  const [specialEvents, setSpecialEvents] = useState<any[]>([]);

  // State for dues dialog
  const [duesDialogOpen, setDuesDialogOpen] = useState(false);
  const [activeDuesData, setActiveDuesData] = useState<{
    userId: string;
    memberName: string;
    month: number;
    amount: number;
  } | null>(null);

  // Load dues and expenses when year changes
  useEffect(() => {
    // Load dues data for the selected year
    const savedDuesStatus = databaseService.getDues(selectedYear);
    if (savedDuesStatus && savedDuesStatus.length > 0) {
      setDuesStatus(savedDuesStatus);
    } else {
      // Initialize new dues data for the year
      const newDuesStatus = members.map(member => ({
        userId: member.id,
        year: selectedYear,
        monthlyDues: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          paid: false,
          amount: 50000
        })),
        unpaidAmount: 0
      }));
      setDuesStatus(newDuesStatus);
      databaseService.saveDues(selectedYear, newDuesStatus);
    }

    // Get member-related expenses (경조사비)
    const allExpenses = databaseService.getExpenses();
    const memberEvents = allExpenses.filter(expense => 
      expense.type === '경조사비' && 
      new Date(expense.date).getFullYear() === selectedYear
    );
    setSpecialEvents(memberEvents);
  }, [selectedYear, members]);

  // Save dues data when it changes
  useEffect(() => {
    if (duesStatus.length > 0) {
      databaseService.saveDues(selectedYear, duesStatus);
    }
  }, [duesStatus, selectedYear]);

  const handleExportImage = () => {
    exportAsImage(membersRef.current!.id, `회원관리_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleDuesClick = (userId: string, month: number) => {
    const member = members.find(m => m.id === userId);
    const userDues = duesStatus.find(dues => dues.userId === userId);
    const monthDue = userDues?.monthlyDues.find(due => due.month === month);
    
    setActiveDuesData({
      userId,
      memberName: member?.name || '',
      month,
      amount: monthDue?.paid ? monthDue.amount : 0
    });
    
    setDuesDialogOpen(true);
  };

  const handleDuesSave = () => {
    if (!activeDuesData) return;
    
    const { userId, month, amount } = activeDuesData;
    const isPaid = amount > 0;
    
    // Find current dues status
    const userDues = duesStatus.find(dues => dues.userId === userId);
    const monthDue = userDues?.monthlyDues.find(due => due.month === month);
    const previouslyPaid = monthDue?.paid || false;
    
    // Update dues status
    setDuesStatus(prev => 
      prev.map(user => 
        user.userId === userId 
          ? {
              ...user,
              monthlyDues: user.monthlyDues.map(due => 
                due.month === month 
                  ? { ...due, paid: isPaid, amount: amount }
                  : due
              )
            }
          : user
      )
    );

    // Handle income updates
    const member = members.find(m => m.id === userId);
    
    if (isPaid && !previouslyPaid) {
      // Add new income entry
      const date = new Date();
      date.setFullYear(selectedYear, month - 1, 15); // Default to middle of month
      
      const newIncome = {
        date: date.toISOString().split('T')[0],
        name: member?.name || '',
        type: '회비',
        amount: amount,
        description: `${selectedYear}년 ${month}월 회비`,
        year: selectedYear,
        month: month,
        userId: userId
      };

      databaseService.addIncome(newIncome);
      toast.success(`${month}월 회비가 수입내역에 추가되었습니다.`);
    } 
    else if (!isPaid && previouslyPaid) {
      // Remove income entry
      const incomes = databaseService.getIncomes();
      const duesIncome = incomes.find(income => 
        income.type === '회비' && 
        income.year === selectedYear && 
        income.month === month && 
        income.userId === userId
      );
      
      if (duesIncome) {
        databaseService.deleteIncome(duesIncome.id);
        toast.info(`${month}월 회비 납부가 취소되었습니다.`);
      }
    } 
    else if (isPaid && previouslyPaid && amount !== monthDue?.amount) {
      // Update income amount
      const incomes = databaseService.getIncomes();
      const duesIncome = incomes.find(income => 
        income.type === '회비' && 
        income.year === selectedYear && 
        income.month === month && 
        income.userId === userId
      );
      
      if (duesIncome) {
        databaseService.updateIncome(duesIncome.id, { amount });
        toast.success(`${month}월 회비 금액이 수정되었습니다.`);
      }
    }
    
    setDuesDialogOpen(false);
    setActiveDuesData(null);
  };

  const handleUnpaidChange = (userId: string, value: number) => {
    setDuesStatus(prev => 
      prev.map(user => 
        user.userId === userId 
          ? { ...user, unpaidAmount: value }
          : user
      )
    );
    toast.success('미납액이 수정되었습니다.');
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">회원관리</h2>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="members-content" ref={membersRef} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle>회원 회비 납부 현황</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">회원명</th>
                    {MONTH_NAMES.map((month, index) => (
                      <th key={index} className="border p-2 text-center">{month}</th>
                    ))}
                    <th className="border p-2 text-center">미납액</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const userDues = duesStatus.find(dues => dues.userId === member.id);
                    return (
                      <tr key={member.id} className="border-b">
                        <td className="border p-2">{member.name}</td>
                        {MONTH_NAMES.map((_, index) => {
                          const month = index + 1;
                          const monthDue = userDues?.monthlyDues.find(due => due.month === month);
                          return (
                            <td key={index} className="border p-2 text-center">
                              <Button 
                                variant={monthDue?.paid ? "default" : "outline"}
                                size="sm"
                                className={`w-24 ${monthDue?.paid ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                onClick={() => handleDuesClick(member.id, month)}
                              >
                                {monthDue?.paid ? `${monthDue.amount.toLocaleString()}원` : '-'}
                              </Button>
                            </td>
                          );
                        })}
                        <td className="border p-2 text-center">
                          <Input
                            type="number"
                            value={userDues?.unpaidAmount || 0}
                            onChange={(e) => handleUnpaidChange(member.id, Number(e.target.value))}
                            className="w-24 text-right mx-auto"
                            step={1000}
                            min={0}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>경조사비 지급 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">회원명</th>
                    <th className="p-2 text-left">내용</th>
                    <th className="p-2 text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {specialEvents.length > 0 ? (
                    specialEvents.map(event => (
                      <tr key={event.id} className="border-b">
                        <td className="p-2">{event.date}</td>
                        <td className="p-2">{event.name}</td>
                        <td className="p-2">{event.description}</td>
                        <td className="p-2 text-right">{event.amount.toLocaleString()}원</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        {selectedYear}년도의 경조사비 지급 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dues Input Dialog */}
      <Dialog open={duesDialogOpen} onOpenChange={setDuesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeDuesData ? `${activeDuesData.memberName} - ${activeDuesData.month}월 회비` : '회비 입력'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">회비 금액</Label>
              <Input
                id="amount"
                type="number"
                value={activeDuesData?.amount || 0}
                onChange={(e) => setActiveDuesData(prev => 
                  prev ? { ...prev, amount: Number(e.target.value) } : null
                )}
                min={0}
                step={1000}
                className="text-right"
              />
              <p className="text-sm text-muted-foreground">0원으로 입력 시 미납 처리됩니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuesDialogOpen(false)}>취소</Button>
            <Button onClick={handleDuesSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
