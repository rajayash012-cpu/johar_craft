import React from 'react';
import { BarChart3, TrendingUp, Eye, MessageSquare, Package } from 'lucide-react';
import { getArtisan, getProductsByArtisan } from '../../utils/storage';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';

// Demo sparkline data
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all"
            style={{ height: `${(val / max) * 56}px`, backgroundColor: color, opacity: 0.8 }}
          />
          <span className="text-xs text-earth-400">{weekDays[i][0]}</span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const artisan = getArtisan();
  const products = artisan ? getProductsByArtisan(artisan.id).filter(p => p.status === 'published') : [];

  // Demo analytics data
  const viewsData = [42, 58, 35, 71, 89, 63, 94];
  const productViewsData = [128, 195, 142, 220, 310, 275, 380];
  const enquiriesData = [2, 4, 1, 6, 3, 5, 8];

  const stats = [
    { label: 'Profile Views (This Week)', value: viewsData.reduce((a, b) => a + b, 0), icon: Eye, color: '#3b82f6', data: viewsData, bg: 'bg-blue-100 text-blue-600' },
    { label: 'Product Views (This Week)', value: productViewsData.reduce((a, b) => a + b, 0), icon: TrendingUp, color: '#c85a26', data: productViewsData, bg: 'bg-brand-100 text-brand-600' },
    { label: 'Buyer Enquiries (This Week)', value: enquiriesData.reduce((a, b) => a + b, 0), icon: MessageSquare, color: '#10b981', data: enquiriesData, bg: 'bg-green-100 text-green-600' },
  ];

  // Top products by views
  const topProducts = products.sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-earth-900">Analytics</h1>
          <p className="text-sm text-earth-500">Demo data – connect a backend for live analytics</p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="card p-4 bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700 font-medium">
          📊 <strong>Prototype Analytics:</strong> The charts below display realistic demo data to illustrate the analytics feature. In production, this would show your real-time artisan insights.
        </p>
      </div>

      {/* Stats Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-earth-900">{stat.value.toLocaleString()}</span>
            </div>
            <MiniBarChart data={stat.data} color={stat.color} />
            <p className="text-xs text-earth-500 mt-3">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-earth-900">Top Products by Views</h3>
          <Package className="w-5 h-5 text-earth-400" />
        </div>
        {topProducts.length === 0 ? (
          <p className="text-earth-500 text-sm text-center py-6">No published products yet. Add products to see analytics.</p>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product, idx) => {
              const maxViews = topProducts[0]?.views || 1;
              const percent = Math.round((product.views / maxViews) * 100);
              return (
                <div key={product.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-earth-400 w-5">#{idx + 1}</span>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <PhotoPlaceholder type="product" compact className="w-8 h-8 rounded-lg" />
                      )}
                      <span className="text-sm font-medium text-earth-900 truncate max-w-xs">{product.name}</span>
                    </div>
                    <span className="text-sm font-bold text-earth-900">{product.views} views</span>
                  </div>
                  <div className="w-full bg-earth-100 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Published', value: products.length, icon: '📦' },
          { label: 'Total Views', value: products.reduce((sum, p) => sum + p.views, 0), icon: '👁️' },
          { label: 'Avg Views / Product', value: products.length ? Math.round(products.reduce((sum, p) => sum + p.views, 0) / products.length) : 0, icon: '📊' },
          { label: 'Districts Reached', value: 24, icon: '📍' },
        ].map(item => (
          <div key={item.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-2xl font-bold text-earth-900">{item.value.toLocaleString()}</div>
            <div className="text-xs text-earth-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
