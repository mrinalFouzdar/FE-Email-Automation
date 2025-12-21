import { ReactNode, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
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
      <div className="flex-1 overflow-x-hidden">
        <main className="p-6 md:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
