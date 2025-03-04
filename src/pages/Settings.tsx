
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Save, Download, Upload, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
  const { users, setUsers } = useAuth();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [backups, setBackups] = useState([
    { id: '1', date: '2023-12-25 14:30:00', name: '백업_20231225_143000' },
    { id: '2', date: '2023-12-20 09:15:22', name: '백업_20231220_091522' },
  ]);

  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'member' as 'admin' | 'treasurer' | 'member',
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    // 사용자 추가 로직
    setNewUserOpen(false);
    toast.success('새 사용자가 추가되었습니다.');
  };

  const handleCreateBackup = () => {
    // 백업 생성 로직
    toast.success('백업이 생성되었습니다.');
  };

  const handleRestoreBackup = (id: string) => {
    // 백업 복원 로직
    toast.success('백업이 복원되었습니다.');
  };

  const handleDeleteBackup = (id: string) => {
    // 백업 삭제 로직
    toast.success('백업이 삭제되었습니다.');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">설정</h2>

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
                      onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">역할</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Save className="h-4 w-4" />
                        <span className="sr-only">수정</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b">
                    <td className="p-2">{backup.date}</td>
                    <td className="p-2">{backup.name}</td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRestoreBackup(backup.id)}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">복원</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteBackup(backup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
