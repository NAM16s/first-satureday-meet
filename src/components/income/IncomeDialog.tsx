
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Income, IncomeType } from '@/utils/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income: Income;
  isCreating: boolean;
  members: any[];
  onSave: (income: Income) => void;
  onDelete: (id: string) => void;
}

export const IncomeDialog = ({
  open,
  onOpenChange,
  income,
  isCreating,
  members,
  onSave,
  onDelete
}: IncomeDialogProps) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Income>(income);
  
  // 회원 목록이 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    if (isCreating && members.length > 0 && !formData.userId) {
      setFormData(prev => ({
        ...prev,
        userId: members[0].id,
        name: members[0].name
      }));
    }
  }, [members, isCreating, formData.userId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseInt(value, 10) || 0 : value
    }));
  };
  
  const handleTypeChange = (value: IncomeType) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };
  
  const handleMemberChange = (memberId: string) => {
    const selectedMember = members.find(member => member.id === memberId);
    setFormData(prev => ({
      ...prev,
      userId: memberId,
      name: selectedMember ? selectedMember.name : ''
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
    const incomeToSave: Income = isCreating
      ? { ...formData, id: uuidv4() }
      : formData;
    
    onSave(incomeToSave);
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    onDelete(income.id);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isCreating ? '수입 등록' : '수입 수정'}</DialogTitle>
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
            <Label htmlFor="member" className="text-right">
              회원
            </Label>
            <Select
              value={formData.userId || ''}
              onValueChange={handleMemberChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="회원 선택" />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              항목
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: IncomeType) => handleTypeChange(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="항목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="회비">회비</SelectItem>
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
              내용
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
                  <AlertDialogTitle>수입 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 수입 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
