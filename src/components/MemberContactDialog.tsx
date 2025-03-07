
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MemberContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  contact?: string;
}

export const MemberContactDialog = ({
  open,
  onOpenChange,
  memberName,
  contact
}: MemberContactDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{memberName} 회원 정보</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">이름</p>
            <p>{memberName}</p>
          </div>
          <div className="space-y-2 mt-3">
            <p className="text-sm font-medium">연락처</p>
            <p>{contact || '등록된 연락처 정보가 없습니다.'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
