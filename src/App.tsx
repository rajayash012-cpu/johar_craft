import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { seedDemoDataIfNeeded } from './utils/storage';
import { LanguageProvider } from './i18n';
import { AccountProvider, useAccount } from './context/AccountContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { ViewModeContainer } from './components/ViewModeContainer';
import { FloatingLanguageSelector } from './components/FloatingLanguageSelector';

// Layouts
import { ArtisanLayout } from './layouts/ArtisanLayout';
import { MarketplaceLayout } from './layouts/MarketplaceLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AccountSelectPage } from './pages/AccountSelectPage';
import { DashboardPage } from './pages/artisan/DashboardPage';
import { ProfilePage } from './pages/artisan/ProfilePage';
import { MyProductsPage } from './pages/artisan/MyProductsPage';
import { AddProductPage } from './pages/artisan/AddProductPage';
import { SmartCatalogPage } from './pages/artisan/SmartCatalogPage';
import { PricingPage } from './pages/artisan/PricingPage';
import { QRPage } from './pages/artisan/QRPage';
import { AnalyticsPage } from './pages/artisan/AnalyticsPage';
import { SettingsPage } from './pages/artisan/SettingsPage';
import { VerificationPage } from './pages/artisan/VerificationPage';
import { MarketplacePage } from './pages/marketplace/MarketplacePage';
import { ProductDetailPage } from './pages/marketplace/ProductDetailPage';
import { PublicArtisanProfilePage } from './pages/marketplace/PublicArtisanProfilePage';
import { ReferencesPage } from './pages/ReferencesPage';
import { BuyerVerificationPage } from './pages/buyer/BuyerVerificationPage';

function ArtisanRoute({ children }: { children: React.ReactNode }) {
  const { activeAccount } = useAccount();
  if (!activeAccount) {
    return <Navigate to="/account/select" replace />;
  }
  return <ArtisanLayout>{children}</ArtisanLayout>;
}

export default function App() {
  useEffect(() => {
    seedDemoDataIfNeeded();
  }, []);

  return (
    <AccountProvider>
      <LanguageProvider>
        <ViewModeProvider>
          <ViewModeContainer>
            <BrowserRouter>
              <Routes>
                {/* Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Account Selector */}
                <Route path="/account/select" element={<AccountSelectPage />} />

                {/* Artisan Portal */}
                <Route path="/artisan" element={<ArtisanRoute><DashboardPage /></ArtisanRoute>} />
                <Route path="/artisan/profile" element={<ArtisanRoute><ProfilePage /></ArtisanRoute>} />
                <Route path="/artisan/products" element={<ArtisanRoute><MyProductsPage /></ArtisanRoute>} />
                <Route path="/artisan/smart-catalog" element={<ArtisanRoute><SmartCatalogPage /></ArtisanRoute>} />
                <Route path="/artisan/products/add" element={<ArtisanRoute><AddProductPage /></ArtisanRoute>} />
                <Route path="/artisan/pricing" element={<ArtisanRoute><PricingPage /></ArtisanRoute>} />
                <Route path="/artisan/verification" element={<ArtisanRoute><VerificationPage /></ArtisanRoute>} />
                <Route path="/artisan/settings/verification" element={<ArtisanRoute><VerificationPage /></ArtisanRoute>} />
                <Route path="/artisan/qr" element={<ArtisanRoute><QRPage /></ArtisanRoute>} />
                <Route path="/artisan/analytics" element={<ArtisanRoute><AnalyticsPage /></ArtisanRoute>} />
                <Route path="/artisan/settings" element={<ArtisanRoute><SettingsPage /></ArtisanRoute>} />

                {/* Buyer Portal / Verification */}
                <Route path="/buyer/verification" element={<BuyerVerificationPage />} />

                {/* Marketplace / Public */}
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/artisan/:id" element={<PublicArtisanProfilePage />} />
                <Route path="/artisan/:id/qr" element={<MarketplaceLayout><div className="py-8 px-4"><QRPage /></div></MarketplaceLayout>} />
                <Route path="/references" element={<ReferencesPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Global Persistent Floating Language Selector */}
              <FloatingLanguageSelector />
            </BrowserRouter>
          </ViewModeContainer>
        </ViewModeProvider>
      </LanguageProvider>
    </AccountProvider>
  );
}
