
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export const UserProfileDialog = () => {
  const { currentUser, setUsers, users, profileDialogOpen, setProfileDialogOpen } = useAuth();
  
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // Load current user data
  useEffect(() => {
    if (currentUser && profileDialogOpen) {
      setName(currentUser.name || '');
      setContact(currentUser.contact || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [currentUser, profileDialogOpen]);
  
  const handleSave = () => {
    if (!currentUser) return;
    
    // Validate password change
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        toast.error('현재 비밀번호를 입력해주세요.');
        return;
      }
      
      if (currentPassword !== currentUser.password) {
        toast.error('현재 비밀번호가 일치하지 않습니다.');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      
      if (newPassword.length < 4) {
        toast.error('비밀번호는 4자 이상이어야 합니다.');
        return;
      }
    }
    
    // Update user info in users array
    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          name,
          contact,
          password: newPassword || user.password
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    toast.success('사용자 정보가 업데이트되었습니다.');
    setProfileDialogOpen(false);
  };
  
  return (
    <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>내 정보 수정</DialogTitle>
          <DialogDescription>
            개인정보와 비밀번호를 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user-id">아이디</Label>
            <Input
              id="user-id"
              value={currentUser?.id || ''}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-name">이름</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-contact">연락처</Label>
            <Input
              id="user-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium mb-2">비밀번호 변경</h4>
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
