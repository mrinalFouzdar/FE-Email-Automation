import { ReactNode, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { NotificationBell } from './NotificationBell';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar userName={user?.name} userRole={user?.role} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden flex flex-col">
        {/* Top Header Bar with Notification Bell */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3 flex justify-end items-center shadow-sm">
          <NotificationBell />
        </header>
        <main className="p-6 md:p-8 flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
