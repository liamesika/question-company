'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Menu,
  ChevronRight,
  FileText,
  UserCircle,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: UserCircle },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-64 bg-dark-800 border-r border-white/5',
          'transform transition-transform duration-300 ease-in-out',
          'lg:transform-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-white/50">Diagnostic Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-accent-primary">E</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">Effinity Admin</p>
                <p className="text-xs text-white/50">Public Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-dark-800/80 backdrop-blur-xl border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-white">Admin Panel</span>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
