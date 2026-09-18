import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Package, PlusCircle, Calculator,
  QrCode, BarChart3, Settings, Bell, Search, Menu, X, ChevronRight, LogOut,
  ShieldCheck, Sparkles, MoreHorizontal
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { getArtisan } from '../utils/storage';
import { AccountSwitcher } from '../components/AccountSwitcher';

const navItems = [
  { to: '/artisan', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/artisan/profile', label: 'My Profile', icon: User },
  { to: '/artisan/products', label: 'My Products', icon: Package },
  { to: '/artisan/smart-catalog', label: 'Smart Catalog', icon: Sparkles },
  { to: '/artisan/products/add', label: 'Add Product', icon: PlusCircle },
  { to: '/artisan/pricing', label: 'Fair Price Assistant', icon: Calculator },
  { to: '/artisan/verification', label: 'Trust & Verification', icon: ShieldCheck },
  { to: '/artisan/qr', label: 'My QR Identity', icon: QrCode },
  { to: '/artisan/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/artisan/settings', label: 'Settings', icon: Settings },
];

// Mobile bottom nav: 4 quick shortcuts + "More" to open full drawer
const bottomNavItems = [
  { to: '/artisan', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/artisan/products', label: 'Products', icon: Package },
  { to: '/artisan/smart-catalog', label: 'Catalog', icon: Sparkles },
  { to: '/artisan/qr', label: 'QR ID', icon: QrCode },
];

interface ArtisanLayoutProps {
  children: React.ReactNode;
}

export function ArtisanLayout({ children }: ArtisanLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const artisan = getArtisan();

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || (to !== '/artisan' && location.pathname.startsWith(to));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF5EC]">
      <div className="p-5 border-b border-earth-200/80 flex-shrink-0">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-none">
        {navItems.map(item => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                active
                  ? 'bg-brand-600 text-white shadow-xs font-semibold'
                  : 'text-earth-700 hover:bg-earth-200/60 hover:text-earth-950'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-80" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-earth-200/80 flex-shrink-0" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-earth-700 hover:bg-earth-200/60 hover:text-earth-950 transition-all w-full cursor-pointer min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit to Home</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F7F0E3] text-earth-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#FAF5EC] border-r border-earth-300/80 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-earth-950/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col bg-[#FAF5EC] h-full shadow-2xl border-r border-earth-300"
            style={{ width: 'min(288px, 85vw)' }}>
            <button
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-earth-200/60 text-earth-700 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="bg-[#FAF5EC] border-b border-earth-200/80 px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center gap-3 flex-shrink-0 shadow-2xs">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-earth-200/60 text-earth-700 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search — hidden on very small mobile, shown from sm: up */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" />
              <input
                type="text"
                placeholder="Search catalog, orders or tools..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-earth-300 rounded-xl bg-[#FAF4EB] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all text-earth-900 placeholder-earth-500"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button className="relative p-2 rounded-xl hover:bg-earth-200/60 text-earth-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full" />
            </button>
            <AccountSwitcher />
          </div>
        </header>

        {/* Scrollable Page Content */}
        {/* On mobile: extra bottom padding so content isn't hidden behind bottom nav */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-[#F7F0E3] lg:pb-6"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="lg:pb-0" style={{}}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      {/* Only shown on <lg screens */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF5EC] border-t border-earth-300/80 flex items-stretch shadow-[0_-2px_12px_rgba(74,44,32,0.10)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {bottomNavItems.map(item => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors duration-150 min-h-[56px] ${
                active
                  ? 'text-brand-600'
                  : 'text-earth-500 active:text-earth-800'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-b-full" />
              )}
              <item.icon className={`w-[22px] h-[22px] ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* "More" opens the full drawer */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors duration-150 min-h-[56px] text-earth-500 active:text-earth-800"
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-[22px] h-[22px] stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </nav>
    </div>
  );
}

