
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const Members = () => {
  const membersRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 임시 회원 데이터 - 한글 이름 기준 오름차순 정렬
  const [members, setMembers] = useState([
    { id: 'bwkang', name: '강병우' },
    { id: 'swkim', name: '김성우' },
    { id: 'twkim', name: '김태우' },
    { id: 'wjkim', name: '김원중' },
    { id: 'sgmoon', name: '문석규' },
    { id: 'wsnam', name: '남원식' },
    { id: 'hysong', name: '송호영' },
    { id: 'bsyoo', name: '유봉상' },
    { id: 'ywyoo', name: '유영우' },
    { id: 'jglee', name: '이정규' },
    { id: 'pylim', name: '임평열' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'ko')));

  // 회비 납부 상태 데이터
  const [duesStatus, setDuesStatus] = useState(
    members.map(member => ({
      userId: member.id,
      year: selectedYear,
      monthlyDues: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        paid: Math.random() > 0.3,
        amount: 50000
      })),
      unpaidAmount: Math.floor(Math.random() * 3) * 50000
    }))
  );

  // 경조사비 지급 내역
  const [specialEvents, setSpecialEvents] = useState([
    { id: '1', date: '2023-12-05', memberId: 'twkim', name: '김태우', content: '결혼축의금', amount: 200000 },
    { id: '2', date: '2023-09-15', memberId: 'bsyoo', name: '유봉상', content: '부친상', amount: 100000 },
  ]);

  // 수입 내역 데이터 (다른 페이지와 공유될 데이터)
  const [incomes, setIncomes] = useState(() => {
    const savedIncomes = localStorage.getItem('moim_incomes');
    return savedIncomes ? JSON.parse(savedIncomes) : [];
  });

  // 년도가 변경될 때마다 해당 년도의 회비 납부 상태 데이터 로드
  useEffect(() => {
    const savedDuesStatus = localStorage.getItem(`moim_dues_${selectedYear}`);
    if (savedDuesStatus) {
      setDuesStatus(JSON.parse(savedDuesStatus));
    } else {
      // 새로운 년도의 데이터 생성
      setDuesStatus(
        members.map(member => ({
          userId: member.id,
          year: selectedYear,
          monthlyDues: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            paid: false,
            amount: 50000
          })),
          unpaidAmount: 0
        }))
      );
    }
  }, [selectedYear, members]);

  // duesStatus 변경시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(`moim_dues_${selectedYear}`, JSON.stringify(duesStatus));
  }, [duesStatus, selectedYear]);

  // incomes 변경시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('moim_incomes', JSON.stringify(incomes));
  }, [incomes]);

  const handleExportImage = () => {
    exportAsImage(membersRef.current!.id, `회원관리_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleDuesChange = (userId: string, month: number, amount: number) => {
    // 해당 월에 이미 납부한 회비가 있는지 확인
    const userDues = duesStatus.find(dues => dues.userId === userId);
    const monthDue = userDues?.monthlyDues.find(due => due.month === month);
    const isPaid = amount > 0;
    const previouslyPaid = monthDue?.paid || false;
    
    // 회비 납부 상태 업데이트
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

    // 수입내역에 회비 납부 추가 (금액이 0보다 크고, 이전에 납부하지 않았을 경우)
    if (isPaid && !previouslyPaid) {
      const member = members.find(m => m.id === userId);
      const date = new Date();
      date.setFullYear(selectedYear, month - 1, 15); // 해당 월의 중간일로 설정
      
      const newIncome = {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        name: member?.name || '',
        type: '회비',
        amount: amount,
        description: `${selectedYear}년 ${month}월 회비`,
        year: selectedYear,
        month: month,
        userId: userId
      };

      setIncomes(prev => [newIncome, ...prev]);
      toast.success(`${month}월 회비가 수입내역에 추가되었습니다.`);
    }
    // 이미 납부한 회비를 취소할 경우 (금액이 0이고, 이전에 납부했을 경우)
    else if (!isPaid && previouslyPaid) {
      // 해당 회비 납부에 대한 수입내역 제거
      setIncomes(prev => 
        prev.filter(income => 
          !(income.type === '회비' && 
            income.year === selectedYear && 
            income.month === month && 
            income.userId === userId)
        )
      );
      toast.info(`${month}월 회비 납부가 취소되었습니다.`);
    }
    // 금액만 변경된 경우 (이미 납부한 상태에서 금액만 수정)
    else if (isPaid && previouslyPaid && amount !== monthDue?.amount) {
      // 해당 회비 납부에 대한 수입내역 업데이트
      setIncomes(prev => 
        prev.map(income => 
          (income.type === '회비' && 
            income.year === selectedYear && 
            income.month === month && 
            income.userId === userId)
            ? { ...income, amount: amount }
            : income
        )
      );
      toast.success(`${month}월 회비 금액이 수정되었습니다.`);
    }
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

      <div className="flex justify-center items-center space-x-4 mb-6">
        <Button variant="outline" size="sm" onClick={handlePreviousYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-xl font-semibold">{selectedYear}년</h3>
        <Button variant="outline" size="sm" onClick={handleNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div id="members-content" ref={membersRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>회원 회비 납부 현황 ({selectedYear}년)</CardTitle>
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
                              <Input 
                                type="number"
                                value={monthDue?.paid ? monthDue.amount : 0}
                                onChange={(e) => handleDuesChange(member.id, month, Number(e.target.value))}
                                className="w-24 text-right mx-auto"
                                step={1000}
                                min={0}
                              />
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
                  {specialEvents.map(event => (
                    <tr key={event.id} className="border-b">
                      <td className="p-2">{event.date}</td>
                      <td className="p-2">{event.name}</td>
                      <td className="p-2">{event.content}</td>
                      <td className="p-2 text-right">{event.amount.toLocaleString()}원</td>
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

export default Members;
