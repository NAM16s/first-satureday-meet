
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownToLine, 
  ArrowUpToLine, 
  Settings, 
  LogOut,
  UserCog 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserProfileDialog } from '@/components/user/UserProfileDialog';

interface LayoutProps {
  children: React.ReactNode;
  onProfileClick?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onProfileClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name?.charAt(0) || '';
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      setProfileDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 네비게이션 바 */}
      <header className="bg-primary text-white py-3 px-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">모임회원 및 회비 관리</h1>
          <div className="flex items-center space-x-4">
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative p-0 overflow-hidden h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-foreground text-primary">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-foreground text-primary">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.id}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>내 정보 수정</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* 빠른 접근 네비게이션 */}
      <nav className="bg-card border-b py-2 px-4">
        <div className="container mx-auto flex space-x-4">
          <Link to="/dashboard" className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${location.pathname === '/dashboard' ? 'bg-accent' : ''}`}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            대시보드
          </Link>
          <Link to="/members" className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${location.pathname === '/members' ? 'bg-accent' : ''}`}>
            <Users className="h-4 w-4 mr-2" />
            회원관리
          </Link>
          <Link to="/income" className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${location.pathname === '/income' ? 'bg-accent' : ''}`}>
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            수입내역
          </Link>
          <Link to="/expenses" className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${location.pathname === '/expenses' ? 'bg-accent' : ''}`}>
            <ArrowUpToLine className="h-4 w-4 mr-2" />
            지출내역
          </Link>
          {currentUser && currentUser.role === 'admin' && (
            <Link to="/settings" className={`flex items-center px-3 py-2 rounded-md hover:bg-accent ${location.pathname === '/settings' ? 'bg-accent' : ''}`}>
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Link>
          )}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-grow bg-background">
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-card border-t py-4 px-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          © 2023 모임회원 및 회비 관리 시스템
        </div>
      </footer>

      {/* User Profile Dialog */}
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </div>
  );
};

export default Layout;
