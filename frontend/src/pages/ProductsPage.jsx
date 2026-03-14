import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProductsPage = () => {
  const { token, user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Basic states for a simple modal or form toggle
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', sku: '', category: '', unit: 'pcs', reorderLevel: 10 });
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (product = null) => {
    if (product) {
      setEditingId(product._id);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        reorderLevel: product.reorderLevel,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', sku: '', category: '', unit: 'pcs', reorderLevel: 10 });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/products`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting product');
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              className="pl-9 pr-4 py-2 border border-input rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {canEdit && (
            <button 
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border p-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input required type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border p-2 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reorder Level</label>
              <input required type="number" min="0" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value)})} className="w-full border p-2 rounded-md" />
            </div>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-1">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded-md hover:bg-muted w-full">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md w-full">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">Reorder Level</th>
                {canEdit && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">No products found.</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product._id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{product.unit}</td>
                    <td className="px-6 py-4">{product.reorderLevel}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenForm(product)} className="text-muted-foreground hover:text-primary mr-3"><Edit2 size={16} /></button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(product._id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
