
import { Button } from '@/components/ui/button';
import { YearSelector } from '@/components/dashboard/YearSelector';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Download } from 'lucide-react';
import { ExpenseDialog } from '@/components/expense/ExpenseDialog';
import { Expense } from '@/utils/types';

interface ExpensesHeaderProps {
  selectedYear: number;
  onPreviousYear: () => void;
  onNextYear: () => void;
  onExportImage: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  onAddNewExpense: () => void;
  onSaveExpense: (expenseData: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  canEdit: boolean;
}

export const ExpensesHeader = ({
  selectedYear,
  onPreviousYear,
  onNextYear,
  onExportImage,
  dialogOpen,
  setDialogOpen,
  editingExpense,
  onAddNewExpense,
  onSaveExpense,
  onDeleteExpense,
  canEdit
}: ExpensesHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold">지출내역</h2>
      <Button variant="outline" onClick={onExportImage}>
        <Download className="mr-2 h-4 w-4" />
        이미지로 내보내기
      </Button>
    </div>
  );
};
