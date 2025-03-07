
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { YearSelector } from '@/components/dashboard/YearSelector';
import { ExpenseDialog } from '@/components/expense/ExpenseDialog';
import { Expense } from '@/utils/types';

interface ExpensesCardHeaderProps {
  selectedYear: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  onAddNewExpense: () => void;
  onSaveExpense: (expenseData: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  canEdit: boolean;
}

export const ExpensesCardHeader = ({
  selectedYear,
  onPreviousYear,
  onNextYear,
  dialogOpen,
  setDialogOpen,
  editingExpense,
  onAddNewExpense,
  onSaveExpense,
  onDeleteExpense,
  canEdit
}: ExpensesCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle>지출 내역</CardTitle>
      <div className="flex-grow flex justify-center">
        <YearSelector
          selectedYear={selectedYear}
          onPreviousYear={onPreviousYear}
          onNextYear={onNextYear}
        />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            onClick={onAddNewExpense} 
            disabled={!canEdit}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            새로운 지출
          </Button>
        </DialogTrigger>
        <ExpenseDialog
          expense={editingExpense}
          onSave={onSaveExpense}
          onDelete={onDeleteExpense}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isCreating={!editingExpense}
        />
      </Dialog>
    </CardHeader>
  );
};
