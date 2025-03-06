import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import { DuesDialog } from '@/components/dues/DuesDialog';
import { UnpaidAmountDialog } from '@/components/dues/UnpaidAmountDialog';
import { EventsManager } from '@/components/events/EventsManager';
import { MonthlyDue, DuesData, EventData } from '@/utils/types';

const Members = () => {
  const { canEdit, currentUser } = useAuth();
  const membersRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Member data from database
  const [members, setMembers] = useState<any[]>([]);

  // Dues data from database
  const [duesStatus, setDuesStatus] = useState<DuesData[]>([]);

  // Special events (expenses linked to members)
  const [specialEvents, setSpecialEvents] = useState<EventData[]>([]);

  // State for dues dialog
  const [duesDialogOpen, setDuesDialogOpen] = useState(false);
  const [activeDuesData, setActiveDuesData] = useState<{
    userId: string;
    memberName: string;
    month: number;
    status: string;
    amount: number;
    color?: string;
    unpaidAmount: number;
  } | null>(null);
  
  // State for unpaid amount dialog
  const [unpaidDialogOpen, setUnpaidDialogOpen] = useState(false);
  const [activeUnpaidData, setActiveUnpaidData] = useState<{
    userId: string;
    memberName: string;
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
            dues.monthlyDues.some((due: MonthlyDue) => due.status === 'paid' || due.status === 'prepaid')
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
          const newDuesStatus: DuesData[] = members.map(member => ({
            userId: member.id,
            year: selectedYear,
            monthlyDues: Array.from({ length: 12 }, (_, i) => ({
              month: i + 1,
              status: 'unpaid' as 'unpaid',
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
        ).map(expense => ({
          id: expense.id,
          date: expense.date,
          name: expense.name || '',
          description: expense.description || '',
          amount: expense.amount
        }));
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
      status: monthDue?.status || 'unpaid',
      amount: monthDue?.amount || 50000,
      color: monthDue?.color,
      unpaidAmount: userDues?.unpaidAmount || 0
    });
    
    setDuesDialogOpen(true);
  };

  const handleDuesSave = async (result: {
    status: 'unpaid' | 'paid' | 'prepaid';
    amount: number;
    color?: string;
    isDefaultDues?: boolean;
  }) => {
    if (!activeDuesData) return;
    
    const { userId, month } = activeDuesData;
    const { status, amount, color, isDefaultDues } = result;
    
    // Find current dues status
    const userDuesIndex = duesStatus.findIndex(dues => dues.userId === userId);
    if (userDuesIndex === -1) return;
    
    const userDues = duesStatus[userDuesIndex];
    const monthDueIndex = userDues.monthlyDues.findIndex(due => due.month === month);
    if (monthDueIndex === -1) return;
    
    const previousStatus = userDues.monthlyDues[monthDueIndex].status || 'unpaid';
    let newUnpaidAmount = userDues.unpaidAmount || 0;
    
    // 2. 자동 미납액 변경 로직 구현
    // 2.1. '미납' 선택 시 미납액 증가
    if (status === 'unpaid' && previousStatus !== 'unpaid') {
      newUnpaidAmount += amount;
    } 
    // 2.2. '납부' 선택 시 미납액 계산
    else if (status === 'paid') {
      if (previousStatus === 'unpaid') {
        // 미납 -> 납부: 납부금액이 회비보다 적으면 차액 미납액에 추가
        if (amount < userDues.monthlyDues[monthDueIndex].amount) {
          newUnpaidAmount += (userDues.monthlyDues[monthDueIndex].amount - amount);
        }
      } else if (previousStatus === 'paid') {
        // 납부 -> 납부(금액 변경): 납부금액 차이에 따라 미납액 조정
        const prevAmount = userDues.monthlyDues[monthDueIndex].amount || 0;
        if (amount < prevAmount) {
          // 이전보다 적게 납부: 차액 미납액에 추가
          newUnpaidAmount += (prevAmount - amount);
        } else if (amount > prevAmount) {
          // 이전보다 많이 납부: 차액만큼 미납액 감소 (음수 방지)
          newUnpaidAmount = Math.max(0, newUnpaidAmount - (amount - prevAmount));
        }
      }
    }
    // 2.3. '선납' 선택 시 미납액 변경 없음 (별도 처리 필요 없음)
    
    // Update dues status
    const newDuesStatus = [...duesStatus];
    newDuesStatus[userDuesIndex] = {
      ...userDues,
      unpaidAmount: newUnpaidAmount,
      monthlyDues: [
        ...userDues.monthlyDues.slice(0, monthDueIndex),
        {
          ...userDues.monthlyDues[monthDueIndex],
          status,
          amount,
          color
        },
        ...userDues.monthlyDues.slice(monthDueIndex + 1)
      ]
    };
    
    setDuesStatus(newDuesStatus);
    
    // 회비 상태 변경 후 미납액 기록 저장
    await databaseService.saveDues(selectedYear, newDuesStatus);

    // Handle income updates if paid
    const member = members.find(m => m.id === userId);
    
    if (status === 'paid' && previousStatus !== 'paid') {
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
    else if (status !== 'paid' && previousStatus === 'paid') {
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
    else if (status === 'paid' && previousStatus === 'paid' && amount !== userDues.monthlyDues[monthDueIndex].amount) {
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
    
    setActiveDuesData(null);
  };

  const handleUnpaidClick = (userId: string, amount: number) => {
    if (!canEdit) {
      toast.info('미납액은 회계 또는 관리자만 수정할 수 있습니다.');
      return;
    }
    
    const member = members.find(m => m.id === userId);
    
    setActiveUnpaidData({
      userId,
      memberName: member?.name || '',
      amount
    });
    
    setUnpaidDialogOpen(true);
  };

  const handleUnpaidSave = (amount: number) => {
    if (!activeUnpaidData) return;
    
    const { userId } = activeUnpaidData;
    
    setDuesStatus(prev => 
      prev.map(user => 
        user.userId === userId 
          ? { ...user, unpaidAmount: amount }
          : user
      )
    );
    
    toast.success('미납액이 수정되었습니다.');
    setActiveUnpaidData(null);
  };

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleEventsChange = (updatedEvents: EventData[]) => {
    setSpecialEvents(updatedEvents);
  };

  // Calculate monthly dues totals
  const calculateMonthlyTotals = () => {
    const monthlyTotals = Array(12).fill(0);
    
    duesStatus.forEach(userDues => {
      userDues.monthlyDues.forEach((due: MonthlyDue) => {
        if (due.status === 'paid') {
          monthlyTotals[due.month - 1] += due.amount;
        }
      });
    });
    
    return monthlyTotals;
  };

  const monthlyTotals = calculateMonthlyTotals();
  const totalDues = monthlyTotals.reduce((sum, amount) => sum + amount, 0);

  // Get display value for dues status
  const getDuesDisplay = (due: MonthlyDue) => {
    if (!due) return '-';
    
    switch (due.status) {
      case 'paid':
        return due.amount ? due.amount.toLocaleString() + '원' : '-';
      case 'unpaid':
        return '미납';
      case 'prepaid':
        return '선납';
      default:
        return '-';
    }
  };

  // Get button color for dues status
  const getDuesButtonStyle = (due: MonthlyDue) => {
    if (!due) return {};
    
    switch (due.status) {
      case 'paid':
        return { 
          variant: 'default' as const, 
          className: `w-24 bg-green-600 hover:bg-green-700 ${due.color || ''}`,
          textColor: 'text-black'
        };
      case 'unpaid':
        return { 
          variant: 'outline' as const, 
          className: `w-24 text-red-500 ${due.color || ''}` 
        };
      case 'prepaid':
        return { 
          variant: 'outline' as const, 
          className: `w-24 text-blue-500 ${due.color || ''}` 
        };
      default:
        return { 
          variant: 'outline' as const, 
          className: 'w-24' 
        };
    }
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
                          const buttonStyle = getDuesButtonStyle(monthDue);
                          return (
                            <td key={index} className="border p-2 text-center">
                              <Button 
                                variant={buttonStyle.variant}
                                size="sm"
                                className={buttonStyle.className}
                                onClick={() => handleDuesClick(member.id, month)}
                              >
                                <span className={monthDue?.status === 'paid' ? 'text-black' : ''}>
                                  {getDuesDisplay(monthDue)}
                                </span>
                              </Button>
                            </td>
                          );
                        })}
                        <td 
                          className="border p-2 text-center cursor-pointer"
                          onClick={() => handleUnpaidClick(member.id, userDues?.unpaidAmount || 0)}
                        >
                          <span className="text-red-500 font-medium">
                            {userDues?.unpaidAmount ? userDues.unpaidAmount.toLocaleString() + '원' : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td className="border p-2 sticky left-0 bg-muted z-10">월별 합계</td>
                    {calculateMonthlyTotals().map((total, index) => (
                      <td key={index} className="border p-2 text-center text-green-600">
                        {total > 0 ? total.toLocaleString() + '원' : ''}
                      </td>
                    ))}
                    <td className="border p-2 text-center text-green-600">
                      {totalDues > 0 ? totalDues.toLocaleString() + '원' : ''}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* 경조사비 지급 내역 - 이제 EventsManager 컴포넌트로 분리 */}
        <EventsManager 
          selectedYear={selectedYear}
          events={specialEvents}
          onEventsChange={handleEventsChange}
        />
      </div>

      {/* 회비 다이얼로그 */}
      {activeDuesData && (
        <DuesDialog
          open={duesDialogOpen}
          onOpenChange={setDuesDialogOpen}
          userId={activeDuesData.userId}
          memberName={activeDuesData.memberName}
          month={activeDuesData.month}
          year={selectedYear}
          currentStatus={activeDuesData.status}
          defaultDues={activeDuesData.amount}
          onSave={handleDuesSave}
          color={activeDuesData.color}
          unpaidAmount={activeDuesData.unpaidAmount}
        />
      )}
      
      {/* 미납액 수정 다이얼로그 */}
      {activeUnpaidData && (
        <UnpaidAmountDialog
          open={unpaidDialogOpen}
          onOpenChange={setUnpaidDialogOpen}
          memberName={activeUnpaidData.memberName}
          currentAmount={activeUnpaidData.amount}
          onSave={handleUnpaidSave}
        />
      )}
    </div>
  );
};

export default Members;
