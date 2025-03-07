
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Expense } from '@/utils/types';

interface ExpensesTableProps {
  expenses: Expense[];
  canEdit: boolean;
  total: number;
  onEditExpense: (expense: Expense) => void;
}

export const ExpensesTable = ({ 
  expenses, 
  canEdit, 
  total, 
  onEditExpense 
}: ExpensesTableProps) => {
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>분류</TableHead>
          <TableHead>세부내용</TableHead>
          <TableHead className="text-right">금액</TableHead>
          {canEdit && <TableHead className="text-center">작업</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map((expense) => (
            <TableRow 
              key={expense.id} 
              className={canEdit ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={canEdit ? () => onEditExpense(expense) : undefined}
            >
              <TableCell>{expense.date}</TableCell>
              <TableCell>{expense.name}</TableCell>
              <TableCell>{expense.type}</TableCell>
              <TableCell>{expense.description || '-'}</TableCell>
              <TableCell className="text-right font-medium">{expense.amount.toLocaleString()}원</TableCell>
              {canEdit && (
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditExpense(expense);
                    }}
                  >
                    수정
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={canEdit ? 6 : 5} className="h-24 text-center">
              지출 내역이 없습니다.
            </TableCell>
          </TableRow>
        )}
        <TableRow className="bg-muted font-medium">
          <TableCell colSpan={4} className="text-right">총계</TableCell>
          <TableCell className="text-right">{total.toLocaleString()}원</TableCell>
          {canEdit && <TableCell></TableCell>}
        </TableRow>
      </TableBody>
    </Table>
  );
};
