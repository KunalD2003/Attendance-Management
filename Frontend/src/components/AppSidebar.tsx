import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Clock,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  TrendingUp,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { useState } from 'react';
import type { UserRole } from '@/store/types';
import { api } from '@/store/api';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
  { label: 'Punch In/Out', to: '/punch', icon: Fingerprint, roles: ['employee', 'manager', 'admin'] },
  { label: 'Overtime', to: '/overtime', icon: TrendingUp, roles: ['employee', 'manager', 'admin'] },
  { label: 'Reports', to: '/reports', icon: FileText, roles: ['employee', 'manager', 'admin'] },
  { label: 'Manage Users', to: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['employee', 'manager', 'admin'] },
];

export function AppSidebar() {
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));
  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
  };

  return (
    <aside
      className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="font-display text-xl font-bold text-gradient tracking-tight">
            SYNAPSE
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {filteredItems.map(item => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary glow-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {user?.name?.charAt(0) ?? '?'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}