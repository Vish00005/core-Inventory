import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div>
        {/* Can put breadcrumbs or search here */}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-foreground bg-secondary px-3 py-1.5 rounded-full">
          <User size={16} className="text-muted-foreground" />
          <span className="font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground px-1 bg-background rounded">
            {user?.role.replace('_', ' ')}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors flex items-center gap-2"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium pr-1">Out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
