
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MONTH_NAMES } from '@/utils/constants';

const Members = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // 임시 회원 데이터
  const members = [
    { id: 'wsnam', name: '남원식' },
    { id: 'bwkang', name: '강병우' },
    { id: 'swkim', name: '김성우' },
    { id: 'twkim', name: '김태우' },
    { id: 'wjkim', name: '김원중' },
    { id: 'sgmoon', name: '문석규' },
    { id: 'hysong', name: '송호영' },
    { id: 'bsyoo', name: '유봉상' },
    { id: 'ywyoo', name: '유영우' },
    { id: 'jglee', name: '이정규' },
    { id: 'pylim', name: '임평열' },
  ];

  const handleExportImage = () => {
    // 이미지 내보내기 로직 (미구현)
    alert('이미지 내보내기 기능은 아직 구현되지 않았습니다.');
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
                {members.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="border p-2">{member.name}</td>
                    {MONTH_NAMES.map((_, index) => (
                      <td key={index} className="border p-2 text-center">
                        {Math.random() > 0.3 ? (
                          <span className="text-green-600">O</span>
                        ) : (
                          <span className="text-red-600">X</span>
                        )}
                      </td>
                    ))}
                    <td className="border p-2 text-center">
                      {(Math.floor(Math.random() * 3) * 50000).toLocaleString()}원
                    </td>
                  </tr>
                ))}
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
                <tr className="border-b">
                  <td className="p-2">2023-12-05</td>
                  <td className="p-2">김태우</td>
                  <td className="p-2">결혼축의금</td>
                  <td className="p-2 text-right">200,000원</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">2023-09-15</td>
                  <td className="p-2">유봉상</td>
                  <td className="p-2">부친상</td>
                  <td className="p-2 text-right">100,000원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
