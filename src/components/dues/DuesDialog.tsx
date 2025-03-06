
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { databaseService } from '@/services/databaseService';

interface DuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  memberName: string;
  month: number;
  year: number;
  currentStatus: string;
  defaultDues: number;
  onSave: (result: {
    status: 'unpaid' | 'paid' | 'prepaid';
    amount: number;
    color?: string;
    isDefaultDues?: boolean;
  }) => void;
  color?: string;
  unpaidAmount: number;
}

export const DuesDialog = ({
  open,
  onOpenChange,
  userId,
  memberName,
  month,
  year,
  currentStatus,
  defaultDues,
  onSave,
  color,
  unpaidAmount
}: DuesDialogProps) => {
  const [duesAmount, setDuesAmount] = useState<number>(defaultDues);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'prepaid'>(
    currentStatus as 'unpaid' | 'paid' | 'prepaid' || 'unpaid'
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(color || 'bg-white');
  const [confirmUnpaid, setConfirmUnpaid] = useState<boolean>(false);
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number>(defaultDues);
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);
  const [calculatedUnpaidAmount, setCalculatedUnpaidAmount] = useState<number>(unpaidAmount);

  // Load member's default dues amount
  useEffect(() => {
    const loadMemberDefaults = async () => {
      try {
        const memberSettings = await databaseService.getMemberSettings(userId);
        if (memberSettings?.defaultDues) {
          setDuesAmount(memberSettings.defaultDues);
        }
      } catch (error) {
        console.error('Error loading member defaults:', error);
      }
    };
    
    if (open) {
      loadMemberDefaults();
    }
  }, [open, userId]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentStatus(currentStatus as 'unpaid' | 'paid' | 'prepaid' || 'unpaid');
      setBackgroundColor(color || 'bg-white');
      setConfirmUnpaid(false);
      setIsPaidDialogOpen(false);
      setSaveAsDefault(false);
      setCalculatedUnpaidAmount(unpaidAmount);
    }
  }, [open, currentStatus, color, unpaidAmount]);

  const toggleBackgroundColor = () => {
    setBackgroundColor(prev => 
      prev === 'bg-sky-100' ? 'bg-pink-100' : 
      prev === 'bg-pink-100' ? 'bg-white' : 'bg-sky-100'
    );
  };

  const handlePaymentStatusChange = (value: 'unpaid' | 'paid' | 'prepaid') => {
    if (value === 'unpaid') {
      // Calculate what unpaid amount would be if changed to unpaid
      const newUnpaidAmount = unpaidAmount + duesAmount;
      setCalculatedUnpaidAmount(newUnpaidAmount);
      setConfirmUnpaid(true);
    } else if (value === 'paid') {
      setIsPaidDialogOpen(true);
      setPaidAmount(duesAmount);
    } else {
      // For prepaid, don't change unpaid amount
      setPaymentStatus(value);
      setCalculatedUnpaidAmount(unpaidAmount);
    }
  };

  const handleConfirmUnpaid = () => {
    setPaymentStatus('unpaid');
    setConfirmUnpaid(false);
  };

  const handleCancelUnpaid = () => {
    setConfirmUnpaid(false);
  };

  const handlePaidConfirm = () => {
    // Calculate what unpaid amount would be if dues are partially paid
    const difference = duesAmount - paidAmount;
    let newUnpaidAmount = unpaidAmount;
    
    if (difference > 0) {
      // If paying less than dues amount, add the difference to unpaid
      newUnpaidAmount += difference;
    }
    
    setCalculatedUnpaidAmount(newUnpaidAmount);
    setPaymentStatus('paid');
    setIsPaidDialogOpen(false);
  };

  const handlePaidCancel = () => {
    setIsPaidDialogOpen(false);
  };

  const handleSave = async () => {
    // Save member's default dues if requested
    if (saveAsDefault) {
      try {
        await databaseService.saveMemberSettings(userId, {
          defaultDues: duesAmount
        });
        toast.success('기본 회비가 저장되었습니다.');
      } catch (error) {
        console.error('Error saving member defaults:', error);
        toast.error('기본 회비 저장 중 오류가 발생했습니다.');
      }
    }

    onSave({
      status: paymentStatus,
      amount: paymentStatus === 'paid' ? paidAmount : duesAmount,
      color: backgroundColor,
      isDefaultDues: saveAsDefault
    });
    
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {memberName} - {year}년 {month}월 회비
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* 이달의 회비 */}
            <div className="space-y-2">
              <Label>이달의 회비</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={duesAmount}
                  onChange={(e) => setDuesAmount(Number(e.target.value))}
                  className="text-right"
                  min={0}
                  step={1000}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSaveAsDefault(!saveAsDefault)}
                  className={saveAsDefault ? "bg-blue-100" : ""}
                >
                  기본회비로
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {saveAsDefault ? '이 금액을 기본 회비로 저장합니다.' : '일시적으로 이번 달만 적용됩니다.'}
              </p>
            </div>
            
            {/* 회원명 배경색 */}
            <div className="space-y-2">
              <Label>회원명 배경색</Label>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-full h-10 border rounded-md flex items-center justify-center cursor-pointer ${backgroundColor}`}
                  onClick={toggleBackgroundColor}
                >
                  {memberName}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">클릭하여 배경색을 변경할 수 있습니다.</p>
            </div>
            
            {/* 회비 납부 상태 */}
            <div className="space-y-2">
              <Label>회비 납부 상태</Label>
              <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="납부 상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">미납</SelectItem>
                  <SelectItem value="paid">납부</SelectItem>
                  <SelectItem value="prepaid">선납</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 미납액 정보 표시 */}
            <div className="space-y-2">
              <Label>현재 미납액</Label>
              <div className="text-lg font-semibold">
                {unpaidAmount ? unpaidAmount.toLocaleString() + '원' : '0원'}
              </div>
              {calculatedUnpaidAmount !== unpaidAmount && (
                <div className="text-md text-orange-600">
                  변경 후 미납액: {calculatedUnpaidAmount.toLocaleString()}원
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 미납 확인 다이얼로그 */}
      <Dialog open={confirmUnpaid} onOpenChange={setConfirmUnpaid}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>미납 처리 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              미납으로 처리하면 미납액에 {duesAmount.toLocaleString()}원이 추가됩니다.<br />
              계속하시겠습니까?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUnpaid}>취소</Button>
            <Button onClick={handleConfirmUnpaid}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 납부 금액 다이얼로그 */}
      <Dialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>납부 금액 입력</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidAmount">납부 금액</Label>
              <Input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="text-right"
                min={0}
                step={1000}
              />
              <p className="text-sm text-muted-foreground">
                이달의 회비 {duesAmount.toLocaleString()}원보다 적게 납부하면 미납액이 증가합니다.
              </p>
              {paidAmount < duesAmount && (
                <div className="text-orange-600">
                  미납액에 {(duesAmount - paidAmount).toLocaleString()}원이 추가됩니다.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePaidCancel}>취소</Button>
            <Button onClick={handlePaidConfirm}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
