import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

const Members = () => {
  const { canEdit, currentUser } = useAuth();
  const membersRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Member data from database
  const [members, setMembers] = useState<any[]>([]);

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
  
  // Load members data and synchronize with user accounts
  useEffect(() => {
    const syncMembersWithUserAccounts = async () => {
      try {
        let membersData = await databaseService.getMembers();
        
        // Always filter out admin accounts regardless of current user role
        const users = JSON.parse(localStorage.getItem('moim_users') || '[]');
        const adminIds = users.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
        membersData = membersData.filter(member => !adminIds.includes(member.id));
        
        // Get all user IDs from localStorage
        const userIds = users.map((u: any) => u.id);
        
        // Get all dues data to check for payments
        const allYearsDues = await loadAllYearsDuesData();
        
        // Filter out members who have deleted user accounts and no dues payments
        const filteredMembers = membersData.filter(member => {
          // Keep the member if they still have a user account
          if (userIds.includes(member.id)) {
            return true;
          }
          
          // Check if the member has any dues payments
          const hasDuesPayments = allYearsDues.some(dues => 
            dues.userId === member.id && 
            dues.monthlyDues.some((due: any) => due.paid)
          );
          
          // Keep the member if they have dues payments, remove if not
          return hasDuesPayments;
        });
        
        // Update members list if it changed
        if (JSON.stringify(filteredMembers) !== JSON.stringify(membersData)) {
          await databaseService.saveMembers(filteredMembers);
          toast.success('회원 목록이 업데이트되었습니다.');
        }
        
        setMembers(filteredMembers);
      } catch (error) {
        console.error('Error synchronizing members:', error);
        toast.error('회원 데이터 동기화 중 오류가 발생했습니다.');
      }
    };
    
    syncMembersWithUserAccounts();
  }, [currentUser]);

  // Helper function to load all years' dues data
  const loadAllYearsDuesData = async () => {
    try {
      // Get data for current year and past 3 years to check for dues payments
      const currentYear = new Date().getFullYear();
      let allDues = [];
      
      for (let year = currentYear - 3; year <= currentYear; year++) {
        const yearDues = await databaseService.getDues(year);
        if (yearDues && yearDues.length > 0) {
          allDues = [...allDues, ...yearDues];
        }
      }
      
      return allDues;
    } catch (error) {
      console.error('Error loading all dues data:', error);
      return [];
    }
  };

  // Load dues and expenses when year changes
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load dues data for the selected year
        const savedDuesStatus = await databaseService.getDues(selectedYear);
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
          await databaseService.saveDues(selectedYear, newDuesStatus);
        }

        // Get member-related expenses (경조사비)
        const allExpenses = await databaseService.getExpenses();
        const memberEvents = allExpenses.filter(expense => 
          expense.type === '경조사비' && 
          new Date(expense.date).getFullYear() === selectedYear
        );
        setSpecialEvents(memberEvents);
      } catch (error) {
        console.error('Error loading dues and events:', error);
        toast.error('회비 및 경조사비 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    if (members.length > 0) {
      loadData();
    }
  }, [selectedYear, members]);

  // Save dues data when it changes
  useEffect(() => {
    const saveDuesData = async () => {
      if (duesStatus.length > 0) {
        await databaseService.saveDues(selectedYear, duesStatus);
      }
    };
    
    saveDuesData();
  }, [duesStatus, selectedYear]);

  const handleExportImage = () => {
    exportAsImage(membersRef.current!.id, `회원관리_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleDuesClick = (userId: string, month: number) => {
    if (!canEdit) {
      toast.info('회비 정보는 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
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

  const handleDuesSave = async () => {
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
      const today = new Date();
      const date = new Date(today);
      date.setFullYear(selectedYear, month - 1, today.getDate());
      
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

      await databaseService.addIncome(newIncome);
      toast.success(`${month}월 회비가 수입내역에 추가되었습니다.`);
    } 
    else if (!isPaid && previouslyPaid) {
      // Remove income entry
      const incomes = await databaseService.getIncomes();
      const duesIncome = incomes.find(income => 
        income.type === '회비' && 
        income.year === selectedYear && 
        income.month === month && 
        income.userId === userId
      );
      
      if (duesIncome) {
        await databaseService.deleteIncome(duesIncome.id);
        toast.info(`${month}월 회비 납부가 취소되었습니다.`);
      }
    } 
    else if (isPaid && previouslyPaid && amount !== monthDue?.amount) {
      // Update income amount
      const incomes = await databaseService.getIncomes();
      const duesIncome = incomes.find(income => 
        income.type === '회비' && 
        income.year === selectedYear && 
        income.month === month && 
        income.userId === userId
      );
      
      if (duesIncome) {
        await databaseService.updateIncome(duesIncome.id, { amount });
        toast.success(`${month}월 회비 금액 수정되었습니다.`);
      }
    }
    
    setDuesDialogOpen(false);
    setActiveDuesData(null);
  };

  const handleUnpaidChange = (userId: string, value: number) => {
    if (!canEdit) {
      toast.info('미납액은 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
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

  // Calculate monthly dues totals
  const calculateMonthlyTotals = () => {
    const monthlyTotals = Array(12).fill(0);
    
    duesStatus.forEach(userDues => {
      userDues.monthlyDues.forEach((due: any) => {
        if (due.paid) {
          monthlyTotals[due.month - 1] += due.amount;
        }
      });
    });
    
    return monthlyTotals;
  };

  const monthlyTotals = calculateMonthlyTotals();
  const totalDues = monthlyTotals.reduce((sum, amount) => sum + amount, 0);

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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
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
                    <th className="border p-2 text-left sticky left-0 bg-muted z-10 min-w-[100px]">회원명</th>
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
                        <td className="border p-2 sticky left-0 bg-white z-10">{member.name}</td>
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
                            readOnly={!canEdit}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td className="border p-2 sticky left-0 bg-muted z-10">월별 합계</td>
                    {monthlyTotals.map((total, index) => (
                      <td key={index} className="border p-2 text-center text-green-600">
                        {total.toLocaleString()}원
                      </td>
                    ))}
                    <td className="border p-2 text-center text-green-600">
                      {totalDues.toLocaleString()}원
                    </td>
                  </tr>
                </tfoot>
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
