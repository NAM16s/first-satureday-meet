
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TransactionData {
  id: string;
  date: string;
  type?: string;
  description?: string;
  name?: string;
  amount: number;
}

interface RecentTransactionsTableProps {
  incomes: TransactionData[];
  expenses: TransactionData[];
}

export const RecentTransactionsTable = ({ incomes, expenses }: RecentTransactionsTableProps) => {
  const recentTransactions = [...incomes, ...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
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
            {recentTransactions.length > 0 ? (
              recentTransactions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    {item.type ? (
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
              ))
            ) : (
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
  );
};
