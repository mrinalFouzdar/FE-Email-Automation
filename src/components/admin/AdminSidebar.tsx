import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProps {
  userName?: string;
  userRole?: string;
}

const AdminSidebar = ({ userName, userRole }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/admin',
      exact: true,
    },
    {
      title: 'Users',
      icon: '👥',
      path: '/admin/users',
    },
    {
      title: 'Create User',
      icon: '➕',
      path: '/admin/users/create',
    },
    {
      title: 'Label Approvals',
      icon: '🏷️',
      path: '/admin/labels',
    },
    {
      title: 'System Stats',
      icon: '📈',
      path: '/admin/stats',
    },
    {
      title: 'Token Analytics',
      icon: '💰',
      path: '/admin/analytics',
    },
  ].filter(item => {
    // Hide User Management links for 'admin' role (if that is the requirement)
    // The user requested: "no need to show ... for user role type admin"
    if (userRole === 'admin' && (item.title === 'Users' || item.title === 'Create User')) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="text-3xl">🎯</div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-pink-200">
                  Admin Portal
                </h1>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-white/20 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-lg font-bold">
              {userName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{userName || 'Admin'}</p>
              <p className="text-xs text-blue-200 truncate">{userRole || 'Administrator'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            title={isCollapsed ? item.title : ''}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-white/20 text-white shadow-lg scale-105'
                : 'hover:bg-white/10 text-white/80 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/20 space-y-2">
        <button
          onClick={() => navigate('/')}
          title={isCollapsed ? 'User Dashboard' : ''}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/80 hover:text-white ${isCollapsed ? 'justify-center' : ''
            }`}
        >
          <span className="text-2xl">🏠</span>
          {!isCollapsed && <span className="font-medium text-sm">User Dashboard</span>}
        </button>

        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-all duration-200 text-white/80 hover:text-white ${isCollapsed ? 'justify-center' : ''
            }`}
        >
          <span className="text-2xl">🚪</span>
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
