import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Search, Filter, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InventoryPage = () => {
  const { token } = useAuthStore();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInventory(res.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const isLowStock = item.product && item.quantity <= item.product.reorderLevel;
    const matchesLowStock = filterLowStock ? isLowStock : true;

    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground mt-1">Current stock levels across all locations</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product, SKU, warehouse..."
              className="pl-9 pr-4 py-2 border border-input rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${filterLowStock ? 'bg-destructive/10 border-destructive text-destructive' : 'hover:bg-muted text-muted-foreground'}`}
          >
            <Filter size={16} /> {filterLowStock ? 'Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Warehouse</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading stock levels...</td></tr>
              ) : filteredInventory.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No inventory records found.</td></tr>
              ) : (
                filteredInventory.map(item => {
                  const isLowStock = item.product && item.quantity <= item.product.reorderLevel;
                  return (
                    <tr key={item._id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium text-foreground">{item.product?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{item.product?.sku || 'N/A'}</td>
                      <td className="px-6 py-4">{item.warehouse?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{item.room || 'Main Area'}</td>
                      <td className="px-6 py-4 font-semibold">{item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.product?.unit}</span></td>
                      <td className="px-6 py-4">
                        {isLowStock ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium w-fit">
                            <AlertTriangle size={12} /> Low Stock (Limit: {item.product?.reorderLevel})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-xs font-medium">
                            Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
