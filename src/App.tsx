
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { UserProfileDialog } from "./components/user/UserProfileDialog";
import { useState } from "react";

const queryClient = new QueryClient();

// 인증된 사용자만 접근할 수 있는 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// 이미 인증된 사용자가 로그인 페이지에 접근할 경우 대시보드로 리디렉션
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// 레이아웃에 사용자 프로필 클릭 기능 추가
const LayoutWithAuth = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, openProfileDialog } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const handleProfileClick = () => {
    openProfileDialog();
  };
  
  return (
    <>
      <Layout onProfileClick={handleProfileClick}>
        {children}
      </Layout>
    </>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><LayoutWithAuth><Dashboard /></LayoutWithAuth></ProtectedRoute>} />
    <Route path="/members" element={<ProtectedRoute><LayoutWithAuth><Members /></LayoutWithAuth></ProtectedRoute>} />
    <Route path="/income" element={<ProtectedRoute><LayoutWithAuth><Income /></LayoutWithAuth></ProtectedRoute>} />
    <Route path="/expenses" element={<ProtectedRoute><LayoutWithAuth><Expenses /></LayoutWithAuth></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><LayoutWithAuth><Settings /></LayoutWithAuth></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
