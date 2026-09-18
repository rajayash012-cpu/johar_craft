import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Package, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { getArtisan, getProductsByArtisan, deleteProduct } from '../../utils/storage';
import { formatRupees } from '../../utils/pricing';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';

export function MyProductsPage() {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();
  const artisan = getArtisan();
  const [products, setProducts] = useState(() =>
    artisan ? getProductsByArtisan(artisan.id) : []
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setConfirmDelete(null);
    addToast('success', 'Product deleted');
  };

  if (!artisan) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 text-earth-300 mx-auto mb-3" />
        <p className="text-earth-500 mb-4">Please create your artisan profile first.</p>
        <button onClick={() => navigate('/artisan/profile')} className="btn-primary">Create Profile</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-earth-900">My Products</h1>
          <p className="text-earth-600 text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link to="/artisan/products/add" className="btn-primary self-start xs:self-auto">
          <PlusCircle className="w-4 h-4" />
          Add New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-16 h-16 text-earth-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-earth-900 mb-2">No products yet</h3>
          <p className="text-earth-500 mb-6">Start by adding your first product to get discovered by buyers.</p>
          <Link to="/artisan/products/add" className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="card overflow-hidden">
              <div className="relative bg-stone-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <PhotoPlaceholder type="product" className="w-full h-44" />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`badge text-xs ${product.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {product.status === 'published' ? '● Live' : '○ Draft'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-earth-900 mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-brand-600 mb-2">{product.craftCategory}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-brand-700">{formatRupees(product.price || 0)}</span>
                  <span className="text-xs text-earth-500">Stock: {product.stockQuantity}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-earth-400 mb-4">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{product.views} views</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/product/${product.id}`} className="btn-outline !py-1.5 !px-3 !text-xs flex-1 justify-center">
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <Link to={`/artisan/products/add?edit=${product.id}`} className="btn-outline !py-1.5 !px-3 !text-xs flex-1 justify-center">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(product.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-earth-900">Delete Product?</h3>
            </div>
            <p className="text-earth-600 text-sm mb-6">This action cannot be undone. The product will be removed from the marketplace.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 btn-primary !bg-red-600 hover:!bg-red-700 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
