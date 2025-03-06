
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnpaidAmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  currentAmount: number;
  onSave: (amount: number) => void;
}

export const UnpaidAmountDialog = ({
  open,
  onOpenChange,
  memberName,
  currentAmount,
  onSave
}: UnpaidAmountDialogProps) => {
  const [amount, setAmount] = useState<number>(currentAmount);

  const handleSave = () => {
    onSave(amount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (value === false) {
        setAmount(currentAmount); // Reset to current amount if closing
      }
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{memberName} - 미납액 수정</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unpaidAmount">미납액</Label>
            <Input
              id="unpaidAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-right"
              min={0}
              step={1000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
