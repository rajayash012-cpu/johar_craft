import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Users, ShoppingBag } from 'lucide-react';
import { Logo } from '../components/Logo';
import { AccountSwitcher } from '../components/AccountSwitcher';


interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 text-earth-950 flex flex-col justify-between">
      <header className="bg-[#FAF5EC]/95 backdrop-blur-md border-b border-earth-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link to="/" className="px-3.5 py-2 text-sm font-medium text-earth-700 hover:text-brand-700 hover:bg-earth-100 rounded-lg transition-colors">Home</Link>
              <Link to="/marketplace" className="px-3.5 py-2 text-sm font-medium text-earth-700 hover:text-brand-700 hover:bg-earth-100 rounded-lg transition-colors">Explore Crafts</Link>
              <Link to="/marketplace?tab=artisans" className="px-3.5 py-2 text-sm font-medium text-earth-700 hover:text-brand-700 hover:bg-earth-100 rounded-lg transition-colors">Artisans</Link>
              <Link to="/references" className="px-3.5 py-2 text-sm font-medium text-earth-700 hover:text-brand-700 hover:bg-earth-100 rounded-lg transition-colors">Documentation & GI</Link>
              <Link to="/marketplace?tab=about" className="px-3.5 py-2 text-sm font-medium text-earth-700 hover:text-brand-700 hover:bg-earth-100 rounded-lg transition-colors">About</Link>
            </nav>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search crafts, products or artisans..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-earth-300 rounded-xl bg-[#FAF4EB] focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white transition-all text-earth-900 placeholder-earth-500"
                />
              </div>
            </form>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <Link to="/artisan" className="btn-primary !px-4 !py-2 !text-xs hidden md:flex">
                <Users className="w-3.5 h-3.5" />
                Artisan Portal
              </Link>
              <AccountSwitcher />
              <button
                className="md:hidden p-2 rounded-lg hover:bg-earth-100 text-earth-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setMenuOpen(v => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-earth-200 py-2 space-y-0.5">
              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm text-earth-800 hover:bg-earth-100 rounded-lg min-h-[44px]">Home</Link>
              <Link to="/marketplace" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm text-earth-800 hover:bg-earth-100 rounded-lg min-h-[44px]">Explore Crafts</Link>
              <Link to="/marketplace?tab=artisans" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm text-earth-800 hover:bg-earth-100 rounded-lg min-h-[44px]">Artisans</Link>
              <Link to="/references" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm text-earth-800 hover:bg-earth-100 rounded-lg min-h-[44px]">Documentation & GI</Link>
              <Link to="/artisan" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm text-brand-700 font-semibold hover:bg-brand-50 rounded-lg min-h-[44px]">Artisan Portal</Link>
              <form onSubmit={handleSearch} className="px-4 pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-earth-300 rounded-xl bg-[#FAF4EB] focus:outline-none text-earth-900 min-h-[44px]"
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Cultural Footer */}
      <footer className="bg-[#29231F] text-earth-200 mt-20 border-t-4 border-[#B85C38] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Subtle Top Cultural Divider */}
          <div className="flex items-center justify-center gap-3 text-[#B85C38] text-xs mb-8 select-none">
            <span>❖</span>
            <span className="w-12 h-px bg-[#4A2C20]" />
            <span>❖</span>
            <span className="w-12 h-px bg-[#4A2C20]" />
            <span>❖</span>
            <span className="w-12 h-px bg-[#4A2C20]" />
            <span>❖</span>
            <span className="w-12 h-px bg-[#4A2C20]" />
            <span>❖</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Logo size="md" variant="light" />
              <p className="mt-3 text-sm text-earth-300 max-w-sm leading-relaxed">
                Digital Identity & Market Access for Jharkhand's Tribal Artisans. 
                Preserving living heritage through technology, fair wages, and verified provenance.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-bold text-white mb-3 text-sm tracking-wide">For Artisans</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/artisan" className="hover:text-brand-300 transition-colors">Join as Artisan</Link></li>
                <li><Link to="/artisan/pricing" className="hover:text-brand-300 transition-colors">Fair Price Tool</Link></li>
                <li><Link to="/artisan/smart-catalog" className="hover:text-brand-300 transition-colors">Smart Catalog</Link></li>
                <li><Link to="/artisan/qr" className="hover:text-brand-300 transition-colors">QR Identity</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-bold text-white mb-3 text-sm tracking-wide">Authenticity & Evidence</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/references" className="hover:text-brand-300 transition-colors">GI Registries & Sources</Link></li>
                <li><Link to="/marketplace" className="hover:text-brand-300 transition-colors">Explore Crafts</Link></li>
                <li><Link to="/marketplace?tab=artisans" className="hover:text-brand-300 transition-colors">Meet Artisans</Link></li>
                <li><Link to="/buyer/verification" className="hover:text-brand-300 transition-colors">Buyer Verification</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#4A2C20] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-earth-400 gap-2">
            <span>© 2026 Johar Craft. Built for Jharkhand's Tribal Artisan Community.</span>
            <span className="font-serif italic text-earth-300">100% Verifiable Living Heritage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
