import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Product } from '@/types';
import { api } from '@/services/api';

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const getClubId = (): string => {
    try {
      const stored = localStorage.getItem('sportshub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.club_id || parsed.clubId) return parsed.club_id || parsed.clubId;
      }
    } catch {
      // ignore
    }
    return '11111111-1111-1111-1111-111111111111';
  };

  const loadProducts = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const data = await api.getProducts(clubId);
      setProducts(data || []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRestock = async (id: string) => {
    setRestockingId(id);
    try {
      const updated = await api.restockProduct(id, 10);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: Number(p.stock) + 10 } : p))
      );
    } finally {
      setRestockingId(null);
    }
  };

  const filtered = products.filter(
    (p) => filter === 'all' || p.category?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" /> Inventory & Stock Management
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Consolidated Stock Control
          </h1>
          <p className="text-sm text-slate-500">
            Single inventory shelf shared between online eCommerce shop and front-desk reception counter sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-300 text-xs p-2 rounded-xl text-[#0b1c30] outline-none"
          >
            <option value="all">All Product Categories</option>
            <option value="racket">Rackets</option>
            <option value="gear">Gear & Accessories</option>
            <option value="canteen">Canteen Food & Drinks</option>
          </select>

          <button
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading inventory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No products found for this club category. Add items in inventory to track stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const isLow = Number(prod.stock) <= Number(prod.low_stock_threshold || 5);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-[#0b1c30]">{prod.name}</td>
                      <td className="p-3 uppercase text-[11px] text-slate-500 font-medium">{prod.category}</td>
                      <td className="p-3 font-bold text-[#006c49]">₹{prod.price}</td>
                      <td className="p-3 font-mono text-sm font-bold text-[#0b1c30]">{prod.stock}</td>
                      <td className="p-3">
                        {prod.is_rental ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">Rental Item</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">Sale Item</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px] bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-[#006c49]" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRestock(prod.id)}
                          disabled={restockingId === prod.id}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          {restockingId === prod.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#006c49]" />
                          ) : (
                            <Plus className="w-3 h-3 text-[#006c49]" />
                          )}
                          Restock +10
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
