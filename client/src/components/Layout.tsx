import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { SkeletonCard } from './Skeleton';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  // const { user } = useAuth(); // user not used in this component
  const { addToast } = useToast();
  const { pathname } = useLocation();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

const getPageTitle = () => {
  switch (pathname) {
    case '/dashboard':
      return '대시보드';
    case '/transactions':
      return '거래 내역';
    case '/stats':
      return '통계';
    case '/settings':
      return '설정';
    case '/admin':
      return '관리자';
    default:
      return '페이지';
  }
};

const handleAddTransaction = () => {
  addToast('수입/지출 등록 기능을 개발 중입니다', 'info');
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="flex h-screen">
          <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
            <div className="p-5 border-b border-gray-800">
              <h1 className="text-lg font-bold text-blue-400">💰 가계부</h1>
            </div>
            <nav className="flex-1 py-4">
              <div className="space-y-1">
                <SkeletonCard className="w-full mx-5" />
                <SkeletonCard className="w-full mx-5" />
                <SkeletonCard className="w-full mx-5" />
                <SkeletonCard className="w-full mx-5" />
              </div>
            </nav>
          </div>
          <div className="flex-1 overflow-auto">
<Header onAddTransaction={handleAddTransaction} pageTitle={getPageTitle()} />
            <div className="p-6">
              <SkeletonCard className="w-full mb-6" />
              <SkeletonCard className="w-full mb-6" />
              <SkeletonCard className="w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex h-screen">
{/* Desktop Sidebar */}
<div className="hidden lg:block">
  <Sidebar />
</div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Header onAddTransaction={handleAddTransaction} pageTitle={getPageTitle()} />
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
      
{/* Mobile Bottom Navigation */}
<div className="lg:hidden">
  <MobileNav />
</div>
    </div>
  );
}