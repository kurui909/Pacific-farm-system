// src/components/layout/Sidebar.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Egg,
  Home,
  Store,
  Wheat,
  BarChart3,
  FileText,
  Bell,
  AlertTriangle,
  Users,
  CreditCard,
  Settings,
  FlaskRound,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navConfig = {
  admin: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/production', icon: Egg, label: 'Production' },
    { path: '/pens', icon: Home, label: 'Pens' },
    { path: '/inventory/eggs', icon: Store, label: 'Eggs & Trays' },
    { path: '/inventory/feed', icon: Wheat, label: 'Feed' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ],
  manager: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/production', icon: Egg, label: 'Production' },
    { path: '/pens', icon: Home, label: 'Pens' },
    { path: '/inventory/eggs', icon: Store, label: 'Eggs & Trays' },
    { path: '/inventory/feed', icon: Wheat, label: 'Feed' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  ],
  supervisor: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/production', icon: Egg, label: 'Production' },
    { path: '/pens', icon: Home, label: 'Pens' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
  ],
  egg_keeper: [{ path: '/inventory/eggs', icon: Store, label: 'Eggs & Trays' }],
  feed_keeper: [
    { path: '/inventory/feed', icon: Wheat, label: 'Feed' },
    { path: '/feed/mixes', icon: FlaskRound, label: 'Feed Mixes' },
  ],
  customer: [{ path: '/customer', icon: Store, label: 'Available Eggs' }],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = useMemo(() => navConfig[user?.role] || [], [user?.role]);
  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const getLinkClass = ({ isActive }) =>
    `group relative flex items-center rounded-2xl transition-all duration-300 ${
      collapsed ? 'justify-center px-2' : 'px-4'
    } py-3 my-1 ${
      isActive
        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm ring-1 ring-white/30'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col h-full min-h-0 bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95 text-white shadow-2xl transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
            <button
              onClick={handleDashboard}
              className={`flex items-center gap-3 rounded-2xl transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                collapsed ? 'justify-center w-full p-2' : ''
              }`}
              aria-label="Go to dashboard"
            >
              <span className="text-3xl">🐔</span>
              {!collapsed && <span className="text-lg font-semibold tracking-tight">SmartPoultry</span>}
            </button>

            <button
              onClick={toggleCollapse}
              className="rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-5">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={getLinkClass}
                  title={collapsed ? item.label : ''}
                >
                  <item.icon size={22} className="flex-shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full rounded-2xl transition-all duration-200 ${
                collapsed ? 'justify-center px-2' : 'px-4'
              } py-3 text-white/70 hover:text-white hover:bg-white/10`}
              title={collapsed ? 'Logout' : ''}
            >
              <LogOut size={22} />
              {!collapsed && <span className="ml-3 font-medium">Logout</span>}
            </button>

            {!collapsed && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                <p className="font-semibold">v2.0.0</p>
                <p className="mt-1">© 2026 SmartPoultry</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-gradient-to-br from-slate-800/95 to-slate-950/95 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={handleDashboard}
              className="flex items-center gap-3 rounded-2xl focus:outline-none"
              aria-label="Go to dashboard"
            >
              <span className="text-2xl">🐔</span>
              <span className="font-bold text-xl">SmartPoultry</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center rounded-2xl px-4 py-3 transition-colors ${
                      isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon size={22} />
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex items-center w-full rounded-2xl px-4 py-3 text-white/70 transition hover:text-white hover:bg-white/10"
            >
              <LogOut size={22} />
              <span className="ml-3">Logout</span>
            </button>

            <div className="mt-4 space-y-1 text-xs text-slate-400">
              <p>© 2026 SmartPoultry</p>
              <p>v2.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
    </>
  );
}