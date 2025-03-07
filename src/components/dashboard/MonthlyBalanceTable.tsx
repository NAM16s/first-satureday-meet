
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MonthlyStatsData {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyBalanceTableProps {
  data: MonthlyStatsData[];
}

export const MonthlyBalanceTable = ({ data }: MonthlyBalanceTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 잔액 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>월</TableHead>
              <TableHead>수입</TableHead>
              <TableHead>지출</TableHead>
              <TableHead>잔액</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((stat) => (
              <TableRow key={stat.month}>
                <TableCell>{stat.monthName}</TableCell>
                <TableCell>{stat.income.toLocaleString()}원</TableCell>
                <TableCell>{stat.expense.toLocaleString()}원</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {stat.balance > 0 ? (
                      <ArrowUp className="mr-1 h-4 w-4 text-green-600" />
                    ) : stat.balance < 0 ? (
                      <ArrowDown className="mr-1 h-4 w-4 text-red-600" />
                    ) : null}
                    <span className={stat.balance > 0 ? 'text-green-600' : stat.balance < 0 ? 'text-red-600' : ''}>
                      {stat.balance.toLocaleString()}원
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
