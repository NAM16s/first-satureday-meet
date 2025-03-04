
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';
import { exportAsImage } from '@/utils/exportUtils';
import { toast } from 'sonner';

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

  const handleExportImage = () => {
    exportAsImage(membersRef.current!.id, `회원관리_${selectedYear}`);
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleDuesChange = (userId: string, month: number, value: boolean) => {
    setDuesStatus(prev => 
      prev.map(user => 
        user.userId === userId 
          ? {
              ...user,
              monthlyDues: user.monthlyDues.map(due => 
                due.month === month 
                  ? { ...due, paid: value }
                  : due
              )
            }
          : user
      )
    );
    // 실제로는 수입내역에도 반영해야 함
    toast.success(`${month}월 회비 납부 상태가 변경되었습니다.`);
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
                              <button 
                                onClick={() => handleDuesChange(member.id, month, !monthDue?.paid)}
                                className="focus:outline-none"
                              >
                                {monthDue?.paid ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </button>
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
