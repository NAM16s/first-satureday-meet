
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MemberContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  contact: string;
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
          <DialogTitle>{memberName} 연락처</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="text-lg font-medium">{contact || '연락처 정보가 없습니다.'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
