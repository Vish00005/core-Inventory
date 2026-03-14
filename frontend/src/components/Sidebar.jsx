import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Archive, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  Settings2,
  ListOrdered,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar = () => {
  const { user } = useAuthStore();
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Warehouses', path: '/warehouses', icon: <Warehouse size={20} />, roles: ['admin', 'manager'] },
    { name: 'Inventory', path: '/inventory', icon: <Archive size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Receipts', path: '/receipts', icon: <ArrowDownToLine size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Deliveries', path: '/deliveries', icon: <ArrowUpFromLine size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Transfers', path: '/transfers', icon: <ArrowRightLeft size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Adjustments', path: '/adjustments', icon: <Settings2 size={20} />, roles: ['admin', 'manager'] },
    { name: 'Transactions', path: '/transactions', icon: <ListOrdered size={20} />, roles: ['admin', 'manager', 'staff'] },
    { name: 'Users', path: '/users', icon: <Users size={20} />, roles: ['admin'] },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Archive /> CoreInventory
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navLinks
            .filter(link => link.roles.includes(user?.role || 'staff'))
            .map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
