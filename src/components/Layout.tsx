
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  Settings 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useFinance } from '@/context/FinanceContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { getCurrentYearData } = useFinance();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const yearData = getCurrentYearData();
  
  // If not authenticated, redirect to login
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExport = () => {
    try {
      // Create a canvas element to capture the page
      const element = document.getElementById('content-area');
      if (!element) return;
      
      // Use html2canvas to capture the element (would need to be installed as a dependency)
      // This is a placeholder - in a real app, you'd need to import and use html2canvas or a similar library
      toast.info('이미지 내보내기 기능은 실제 구현 시 html2canvas 라이브러리가 필요합니다.');
    } catch (error) {
      toast.error('페이지 내보내기에 실패했습니다.');
    }
  };

  const menuItems = [
    { title: '대시보드', icon: <AreaChart className="h-5 w-5" />, path: '/' },
    { title: '회원관리', icon: <Users className="h-5 w-5" />, path: '/members' },
    { title: '수입내역', icon: <TrendingUp className="h-5 w-5" />, path: '/income' },
    { title: '지출내역', icon: <TrendingDown className="h-5 w-5" />, path: '/expenses' },
  ];

  // Only admin can access settings
  if (currentUser?.role === 'admin') {
    menuItems.push({ 
      title: '설정', 
      icon: <Settings className="h-5 w-5" />, 
      path: '/settings' 
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b shadow-sm bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">모임회원 및 회비 관리</span>
          </div>
          
          <div className="flex items-center">
            {/* User info and logout */}
            <div className="flex items-center space-x-4">
              {!isMobile && (
                <div className="text-right mr-2">
                  <p className="text-sm font-medium">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.role === 'admin' ? '관리자' : 
                     currentUser?.role === 'treasurer' ? '재무담당' : '회원'}
                  </p>
                </div>
              )}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                title="로그아웃"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-accent py-2 shadow-sm sticky top-16 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-2 rounded-md transition-colors hover:bg-primary/10 min-w-[80px] justify-center
                  ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
              >
                {item.icon}
                {!isMobile && <span className="ml-2">{item.title}</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6" id="content-area">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            <Button variant="outline" size="sm" onClick={handleExport}>
              이미지로 내보내기
            </Button>
          </div>
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} 모임회원 및 회비 관리
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
