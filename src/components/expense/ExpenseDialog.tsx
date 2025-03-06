
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense, ExpenseType } from '@/utils/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense;
  isCreating: boolean;
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseDialog = ({
  open,
  onOpenChange,
  expense,
  isCreating,
  onSave,
  onDelete
}: ExpenseDialogProps) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Expense>(expense);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseInt(value, 10) || 0 : value
    }));
  };
  
  const handleTypeChange = (value: ExpenseType) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    const [year, month] = date.split('-').map(Number);
    
    setFormData(prev => ({
      ...prev,
      date,
      year,
      month
    }));
  };
  
  const handleSave = () => {
    // 새 항목 생성 시 ID 생성
    const expenseToSave: Expense = isCreating
      ? { ...formData, id: uuidv4(), userId: currentUser?.id || '' }
      : formData;
    
    onSave(expenseToSave);
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    onDelete(expense.id);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isCreating ? '지출 등록' : '지출 수정'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              날짜
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              내용
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              항목
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: ExpenseType) => handleTypeChange(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="항목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="식대">식대</SelectItem>
                <SelectItem value="경조사비">경조사비</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              금액(원)
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              설명
            </Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          {!isCreating && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">삭제</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>지출 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 지출 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
