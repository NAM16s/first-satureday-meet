
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Save, Download, Upload, Trash2, Edit, User, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { User as UserType, Role } from '@/utils/types';
import { exportAsImage } from '@/utils/exportUtils';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '@/services/databaseService';

const Settings = () => {
  const settingsRef = useRef<HTMLDivElement>(null);
  const { users, setUsers, canEdit } = useAuth();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'member' as Role,
  });

  const [backups, setBackups] = useState<any[]>([]);

  useEffect(() => {
    // Load backups from localStorage
    const loadedBackups = databaseService.getBackups();
    setBackups(loadedBackups);
  }, []);

  const handleExportImage = () => {
    exportAsImage(settingsRef.current!.id, '설정');
    toast.success('이미지가 다운로드되었습니다.');
  };

  const handleInputChange = (field: string, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    if (editingUser) {
      setEditingUser(prev => ({ ...prev!, [field]: value }));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.id || !newUser.name || !newUser.password || !newUser.role) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    // 중복 ID 확인
    if (users.some(user => user.id === newUser.id)) {
      toast.error('이미 존재하는 아이디입니다.');
      return;
    }

    const userToAdd = {
      ...newUser,
      id: newUser.id.trim(),
      name: newUser.name.trim(),
      password: newUser.password.trim(),
    };

    // Add to users list
    setUsers(prev => [...prev, userToAdd]);
    
    // Sync to members list
    await databaseService.syncUserToMembers(userToAdd);
    
    setNewUserOpen(false);
    setNewUser({
      id: '',
      name: '',
      password: '',
      role: 'member',
    });
    
    toast.success('새 사용자가 추가되었습니다.');
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    setUsers(prev => 
      prev.map(user => user.id === editingUser.id ? editingUser : user)
    );
    
    // Update in members list if name changed
    await databaseService.syncUserToMembers(editingUser);
    
    setEditUserOpen(false);
    setEditingUser(null);
    toast.success('사용자 정보가 수정되었습니다.');
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success('사용자가 삭제되었습니다.');
  };

  const handleStartEditUser = (user: UserType) => {
    setEditingUser({ ...user });
    setEditUserOpen(true);
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await databaseService.createBackup();
      if (backup) {
        setBackups(prev => [backup, ...prev]);
        toast.success('백업이 생성되었습니다.');
      } else {
        toast.error('백업 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('백업 생성 중 오류가 발생했습니다.');
    }
  };

  const handleRestoreBackup = async (id: string) => {
    try {
      const success = await databaseService.restoreBackup(id);
      if (success) {
        toast.success('백업이 복원되었습니다.');
        // Reload the page to reflect changes
        window.location.reload();
      } else {
        toast.error('백업 복원 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('백업 복원 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteBackup = (id: string) => {
    try {
      databaseService.deleteBackup(id);
      setBackups(prev => prev.filter(backup => backup.id !== id));
      toast.success('백업이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('백업 삭제 중 오류가 발생했습니다.');
    }
  };

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">설정 접근 제한</h2>
        <p className="text-muted-foreground">
          설정 페이지는 관리자 또는 회계 권한이 있는 사용자만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">설정</h2>
        <Button variant="outline" onClick={handleExportImage}>
          <Download className="mr-2 h-4 w-4" />
          이미지로 내보내기
        </Button>
      </div>

      <div id="settings-content" ref={settingsRef} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>사용자 계정 관리</span>
              <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    새 사용자 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 사용자 추가</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">아이디</Label>
                      <Input
                        id="id"
                        value={newUser.id}
                        onChange={(e) => handleInputChange('id', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">역할</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: Role) => handleInputChange('role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="역할 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">관리자</SelectItem>
                          <SelectItem value="treasurer">회계</SelectItem>
                          <SelectItem value="member">회원</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setNewUserOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit">추가</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">아이디</th>
                    <th className="p-2 text-left">이름</th>
                    <th className="p-2 text-left">역할</th>
                    <th className="p-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">{user.id}</td>
                      <td className="p-2">{user.name}</td>
                      <td className="p-2">
                        {user.role === 'admin' ? '관리자' : user.role === 'treasurer' ? '회계' : '회원'}
                      </td>
                      <td className="p-2 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleStartEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">수정</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">삭제</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                정말로 {user.name} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 편집 다이얼로그 */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 정보 수정</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-id">아이디</Label>
                  <Input
                    id="edit-id"
                    value={editingUser.id}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">이름</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.name}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">비밀번호</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editingUser.password}
                    onChange={(e) => handleEditInputChange('password', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">역할</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value: Role) => handleEditInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="treasurer">회계</SelectItem>
                      <SelectItem value="member">회원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditUserOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleEditUser}>저장</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>백업 및 복구</span>
              <Button size="sm" onClick={handleCreateBackup}>
                <Download className="mr-2 h-4 w-4" />
                새 백업 생성
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">백업 날짜</th>
                    <th className="p-2 text-left">파일명</th>
                    <th className="p-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length > 0 ? (
                    backups.map((backup) => (
                      <tr key={backup.id} className="border-b">
                        <td className="p-2">{backup.date}</td>
                        <td className="p-2">{backup.name}</td>
                        <td className="p-2 text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Upload className="h-4 w-4" />
                                <span className="sr-only">복원</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>백업 복원</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {backup.date} 시점의 백업으로 복원하시겠습니까? 현재 데이터는 모두 사라집니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestoreBackup(backup.id)}>복원</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">삭제</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>백업 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 이 백업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBackup(backup.id)}>삭제</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        백업 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
