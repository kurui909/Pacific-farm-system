// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (desktop + mobile drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with menu button for mobile */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Modern footer with copyright */}
        <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400 lg:px-8">
            © 2026 SmartPoultry – All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}