'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UploadCloud, Search, Images, LogOut, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

const NAV_ITEMS = [
  { href: '/upload', label: 'Upload', icon: UploadCloud },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/images', label: 'My Images', icon: Images },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-md">
      {/* Logo */}
      <Link href="/upload" className="flex items-center gap-2 mr-8">
        <Cpu className="h-5 w-5 text-indigo-400" />
        <span className="text-sm font-bold text-zinc-100 tracking-tight">FaceSearch</span>
      </Link>

      {/* Nav links */}
      {isAuthenticated && (
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* User */}
      {isAuthenticated && (
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-zinc-500 sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      )}
    </header>
  );
}
