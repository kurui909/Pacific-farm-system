// src/components/layout/Header.jsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  ChevronDown,
  Moon,
  Sun,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/api';

// ----------------------------------------------------------------------
// Improved dropdown hook with better positioning & keyboard handling
// ----------------------------------------------------------------------
function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = dropdownRef.current?.offsetHeight || 0;
    let top = rect.bottom + 8;
    // If not enough space below, show above
    if (top + dropdownHeight > viewportHeight - 16) {
      top = rect.top - dropdownHeight - 8;
    }
    setPosition({
      top,
      right: window.innerWidth - rect.right,
    });
  }, []);

  // Use ResizeObserver to reposition if dropdown content changes
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const resizeObserver = new ResizeObserver(() => updatePosition());
    resizeObserver.observe(dropdownRef.current);
    return () => resizeObserver.disconnect();
  }, [isOpen, updatePosition]);

  const open = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => (isOpen ? close() : open()), [isOpen, open, close]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, close]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return { isOpen, toggle, close, buttonRef, dropdownRef, position };
}

// ----------------------------------------------------------------------
// Dropdown Item component (to avoid re-renders)
// ----------------------------------------------------------------------
const DropdownItem = React.memo(({ to, icon: Icon, label, onClick, isDestructive = false }) => {
  const baseClasses =
    'flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-150';
  const colorClasses = isDestructive
    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700';
  const content = (
    <>
      <Icon size={16} className={`mr-3 ${isDestructive ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
      {label}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${colorClasses}`} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses}`}>
      {content}
    </button>
  );
});

// ----------------------------------------------------------------------
// Main Header Component (memoized)
// ----------------------------------------------------------------------
const Header = React.memo(({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown();
  const menuButtonId = useId();
  const dropdownId = useId();

  // Notifications query with error handling
  const {
    data: unread = 0,
    isLoading: notifLoading,
    error: notifError,
    refetch: refetchNotif,
  } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: notificationService.unreadCount,
    refetchInterval: 30000,
    retry: 2,
  });

  // Memoized user initials and farm name
  const userInitial = useMemo(
    () => user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U',
    [user?.full_name, user?.email]
  );

  const farmName = useMemo(
    () => user?.farm?.name || user?.farm_name || 'SmartPoultry',
    [user?.farm?.name, user?.farm_name]
  );

  const handleLogout = useCallback(() => {
    close();
    logout();
  }, [close, logout]);

  const handleNavClick = useCallback(() => close(), [close]);

  // Keyboard: close dropdown on Tab-out (optional)
  const handleDropdownKeyDown = useCallback(
    (e) => {
      if (e.key === 'Tab' && !dropdownRef.current?.contains(e.target)) {
        close();
      }
    },
    [close, dropdownRef]
  );

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open main menu"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="truncate font-semibold text-gray-800 dark:text-gray-100 text-base sm:text-lg lg:text-xl tracking-tight">
            {farmName}
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications bell */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            {!notifLoading && !notifError && unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center shadow-md animate-pulse">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            {notifError && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                <AlertCircle size={12} />
              </span>
            )}
          </Link>

          {/* User dropdown trigger */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggle}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls={dropdownId}
              id={menuButtonId}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs lg:text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight truncate max-w-[120px] lg:max-w-[160px]">
                  {user?.full_name || user?.email || 'User'}
                </p>
                <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'Guest'}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden sm:block text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown portal with improved accessibility */}
            {isOpen &&
              createPortal(
                <div
                  ref={dropdownRef}
                  id={dropdownId}
                  role="menu"
                  aria-labelledby={menuButtonId}
                  className="fixed bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 w-64 z-[100] animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    top: `${position.top}px`,
                    right: `${position.right}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleDropdownKeyDown}
                >
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {user?.full_name || user?.email || 'User'}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 capitalize">
                        {user?.role || 'Guest'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown items */}
                  <DropdownItem to="/profile" icon={User} label="Profile" onClick={handleNavClick} />
                  <DropdownItem to="/settings" icon={Settings} label="Settings" onClick={handleNavClick} />

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                  <DropdownItem
                    icon={LogOut}
                    label="Sign Out"
                    onClick={handleLogout}
                    isDestructive
                  />
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;