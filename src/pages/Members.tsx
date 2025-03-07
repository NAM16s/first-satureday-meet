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
import { MemberContactDialog } from '@/components/MemberContactDialog';
import { MonthlyDue, DuesData, EventData } from '@/utils/types';

const Members = () => {
  const { canEdit, currentUser } = useAuth();
  const membersRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [members, setMembers] = useState<any[]>([]);
  const [duesStatus, setDuesStatus] = useState<DuesData[]>([]);
  const [specialEvents, setSpecialEvents] = useState<EventData[]>([]);
  
  const defaultDuesAmount = 50000;

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

  const [unpaidDialogOpen, setUnpaidDialogOpen] = useState(false);
  const [activeUnpaidData, setActiveUnpaidData] = useState<{
    userId: string;
    memberName: string;
    amount: number;
  } | null>(null);
  
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [activeContactData, setActiveContactData] = useState<{
    memberName: string;
    contact: string;
  } | null>(null);

  useEffect(() => {
    const syncMembersWithUserAccounts = async () => {
      try {
        let membersData = await databaseService.getMembers();
        
        const users = JSON.parse(localStorage.getItem('moim_users') || '[]');
        const adminIds = users.filter((u: any) => u.role === 'admin').map((u: any) => u.id);
        membersData = membersData.filter(member => !adminIds.includes(member.id));
        
        const userIds = users.map((u: any) => u.id);
        
        const allYearsDues = await loadAllYearsDuesData();
        
        const filteredMembers = membersData.filter(member => {
          if (userIds.includes(member.id)) {
            return true;
          }
          
          const hasDuesPayments = allYearsDues.some(dues => 
            dues.userId === member.id && 
            dues.monthlyDues.some((due: MonthlyDue) => due.status === 'paid' || due.status === 'prepaid')
          );
          
          return hasDuesPayments;
        });
        
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

  const loadAllYearsDuesData = async () => {
    try {
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedDuesStatus = await databaseService.getDues(selectedYear);
        if (savedDuesStatus && savedDuesStatus.length > 0) {
          setDuesStatus(savedDuesStatus);
        } else {
          const newDuesStatus: DuesData[] = members.map(member => ({
            userId: member.id,
            year: selectedYear,
            monthlyDues: Array.from({ length: 12 }, (_, i) => ({
              month: i + 1,
              status: '-' as '-',
              amount: defaultDuesAmount
            })) as MonthlyDue[],
            unpaidAmount: 0
          }));
          setDuesStatus(newDuesStatus);
          await databaseService.saveDues(selectedYear, newDuesStatus);
        }

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
  }, [selectedYear, members, defaultDuesAmount]);

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
      status: monthDue?.status || '-',
      amount: monthDue?.amount || defaultDuesAmount,
      color: monthDue?.color,
      unpaidAmount: userDues?.unpaidAmount || 0
    });
    
    setDuesDialogOpen(true);
  };

  const handleDuesSave = async (result: {
    status: 'unpaid' | 'paid' | 'prepaid' | '-';
    amount: number;
    color?: string;
    isDefaultDues?: boolean;
  }) => {
    if (!activeDuesData) return;
    
    const { userId, month } = activeDuesData;
    const { status, amount, color, isDefaultDues } = result;
    
    const userDuesIndex = duesStatus.findIndex(dues => dues.userId === userId);
    if (userDuesIndex === -1) return;
    
    const userDues = duesStatus[userDuesIndex];
    const monthDueIndex = userDues.monthlyDues.findIndex(due => due.month === month);
    if (monthDueIndex === -1) return;
    
    const previousStatus = userDues.monthlyDues[monthDueIndex].status || '-';
    const previousAmount = userDues.monthlyDues[monthDueIndex].amount || defaultDuesAmount;
    let newUnpaidAmount = userDues.unpaidAmount || 0;
    
    if (status === 'unpaid' && previousStatus !== 'unpaid') {
      newUnpaidAmount += defaultDuesAmount;
    } 
    else if (status === 'paid') {
      if (previousStatus === 'unpaid') {
        if (amount < defaultDuesAmount) {
          newUnpaidAmount += (defaultDuesAmount - amount);
        }
      } else if (previousStatus === 'paid') {
        if (amount < previousAmount) {
          newUnpaidAmount += (previousAmount - amount);
        } else if (amount > previousAmount) {
          newUnpaidAmount = Math.max(0, newUnpaidAmount - (amount - previousAmount));
        }
      }
    }
    
    const newDuesStatus = [...duesStatus];
    newDuesStatus[userDuesIndex] = {
      ...userDues,
      unpaidAmount: newUnpaidAmount,
      monthlyDues: [
        ...userDues.monthlyDues.slice(0, monthDueIndex),
        {
          ...userDues.monthlyDues[monthDueIndex],
          status: status as MonthlyDue['status'],
          amount,
          color
        },
        ...userDues.monthlyDues.slice(monthDueIndex + 1)
      ]
    };
    
    setDuesStatus(newDuesStatus);
    
    try {
      await databaseService.saveDues(selectedYear, newDuesStatus);

      const member = members.find(m => m.id === userId);
      
      if (status === 'paid' && previousStatus !== 'paid') {
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
      else if (status === 'paid' && previousStatus === 'paid' && amount !== previousAmount) {
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
    } catch (error) {
      console.error("Error updating dues:", error);
      toast.error("회비 정보 저장 중 오류가 발생했습니다.");
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

  const handleMemberNameClick = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const users = JSON.parse(localStorage.getItem('moim_users') || '[]');
    const user = users.find((u: any) => u.id === memberId);
    
    setActiveContactData({
      memberName: member.name,
      contact: user?.contact || '연락처 정보가 없습니다.'
    });
    
    setContactDialogOpen(true);
  };

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
            <CardTitle className="text-left">회원 회비 납부 현황</CardTitle>
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
            <div className="w-28"></div> {/* Spacer for alignment */}
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
                        <td 
                          className="border p-2 sticky left-0 bg-white z-10 cursor-pointer hover:underline"
                          onClick={() => handleMemberNameClick(member.id)}
                        >
                          {member.name}
                        </td>
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
                            {userDues?.unpaidAmount && userDues.unpaidAmount > 0 
                              ? userDues.unpaidAmount.toLocaleString() + '원' 
                              : '-'}
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
        
        <EventsManager 
          selectedYear={selectedYear}
          events={specialEvents}
          onEventsChange={handleEventsChange}
        />
      </div>

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
      
      {activeUnpaidData && (
        <UnpaidAmountDialog
          open={unpaidDialogOpen}
          onOpenChange={setUnpaidDialogOpen}
          memberName={activeUnpaidData.memberName}
          currentAmount={activeUnpaidData.amount}
          onSave={handleUnpaidSave}
        />
      )}
      
      {activeContactData && (
        <MemberContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          memberName={activeContactData.memberName}
          contact={activeContactData.contact}
        />
      )}
    </div>
  );
};

export default Members;
