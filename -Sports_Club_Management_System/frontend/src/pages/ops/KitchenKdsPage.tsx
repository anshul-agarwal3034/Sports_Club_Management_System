import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, ChefHat, Loader2, AlertCircle, Coffee, Sparkles } from 'lucide-react';
import { Order, Product } from '@/types';
import { api } from '@/services/api';

const DEFAULT_KITCHEN_MENU_ITEMS: Product[] = [
  // Beverages & Hydration
  {
    id: 'prod-k1',
    club_id: 'club-1',
    name: 'Gatorade Isotonic Energy Drink (500ml)',
    category: 'canteen_beverage',
    price: 90,
    stock: 45,
    is_rental: false,
    low_stock_threshold: 10,
  },
  {
    id: 'prod-k2',
    club_id: 'club-1',
    name: 'Fresh Tender Coconut Water',
    category: 'canteen_beverage',
    price: 80,
    stock: 30,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k3',
    club_id: 'club-1',
    name: 'Whey Protein Recovery Shake',
    category: 'canteen_beverage',
    price: 180,
    stock: 25,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k4',
    club_id: 'club-1',
    name: 'Cold Pressed Watermelon Mint Juice',
    category: 'canteen_beverage',
    price: 120,
    stock: 20,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k5',
    club_id: 'club-1',
    name: 'Red Bull Energy Drink (250ml)',
    category: 'canteen_beverage',
    price: 160,
    stock: 35,
    is_rental: false,
    low_stock_threshold: 10,
  },
  {
    id: 'prod-k6',
    club_id: 'club-1',
    name: 'Iced Hazelnut Espresso',
    category: 'canteen_beverage',
    price: 110,
    stock: 40,
    is_rental: false,
    low_stock_threshold: 8,
  },

  // Snacks & Wraps
  {
    id: 'prod-k7',
    club_id: 'club-1',
    name: 'Grilled Chicken Club Sandwich',
    category: 'canteen_food',
    price: 220,
    stock: 30,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k8',
    club_id: 'club-1',
    name: 'Paneer Tikka Sprouted Wrap',
    category: 'canteen_food',
    price: 190,
    stock: 25,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k9',
    club_id: 'club-1',
    name: 'High Protein Peanut Butter Bar',
    category: 'canteen_food',
    price: 110,
    stock: 50,
    is_rental: false,
    low_stock_threshold: 10,
  },
  {
    id: 'prod-k10',
    club_id: 'club-1',
    name: 'Roasted Salted Almonds & Cashews',
    category: 'canteen_food',
    price: 150,
    stock: 35,
    is_rental: false,
    low_stock_threshold: 8,
  },
  {
    id: 'prod-k15',
    club_id: 'club-1',
    name: 'Loaded Cheese Peri-Peri Fries',
    category: 'canteen_food',
    price: 140,
    stock: 40,
    is_rental: false,
    low_stock_threshold: 10,
  },

  // Hot Meals & Combos
  {
    id: 'prod-k11',
    club_id: 'club-1',
    name: 'Sports Hub Burger & Fries Combo',
    category: 'canteen_food',
    price: 260,
    stock: 20,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k12',
    club_id: 'club-1',
    name: 'Wok Tossed Chicken Fried Rice & Gravy',
    category: 'canteen_food',
    price: 280,
    stock: 15,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k13',
    club_id: 'club-1',
    name: 'Creamy Penne Alfredo Pasta',
    category: 'canteen_food',
    price: 250,
    stock: 18,
    is_rental: false,
    low_stock_threshold: 5,
  },
  {
    id: 'prod-k14',
    club_id: 'club-1',
    name: 'Double Egg Cheese Omelette & Toast',
    category: 'canteen_food',
    price: 160,
    stock: 35,
    is_rental: false,
    low_stock_threshold: 8,
  },
  {
    id: 'prod-k16',
    club_id: 'club-1',
    name: 'Steamed Chicken Dimsums (6 pcs)',
    category: 'canteen_food',
    price: 190,
    stock: 22,
    is_rental: false,
    low_stock_threshold: 5,
  },
];

const DEFAULT_KITCHEN_ORDERS: Order[] = [
  {
    id: 'ORD-9012',
    club_id: 'club-1',
    table_number: 'Table 1 (Courtside)',
    status: 'NEW',
    total_amount: 530,
    discount_amount: 0,
    net_amount: 530,
    payment_mode: 'UPI',
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
    items: [
      { product_id: 'prod-k7', product_name: 'Grilled Chicken Club Sandwich', quantity: 2, unit_price: 220 },
      { product_id: 'prod-k1', product_name: 'Gatorade Isotonic Energy Drink', quantity: 1, unit_price: 90 },
    ],
  },
  {
    id: 'ORD-9011',
    club_id: 'club-1',
    table_number: 'Table 3',
    status: 'PREPARING',
    total_amount: 440,
    discount_amount: 0,
    net_amount: 440,
    payment_mode: 'CASH',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { product_id: 'prod-k11', product_name: 'Sports Hub Burger & Fries Combo', quantity: 1, unit_price: 260 },
      { product_id: 'prod-k3', product_name: 'Whey Protein Recovery Shake', quantity: 1, unit_price: 180 },
    ],
  },
  {
    id: 'ORD-9010',
    club_id: 'club-1',
    table_number: 'Court 2 Delivery',
    status: 'READY',
    total_amount: 310,
    discount_amount: 0,
    net_amount: 310,
    payment_mode: 'PAY_LATER',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    items: [
      { product_id: 'prod-k4', product_name: 'Cold Pressed Watermelon Mint Juice', quantity: 1, unit_price: 120 },
      { product_id: 'prod-k8', product_name: 'Paneer Tikka Sprouted Wrap', quantity: 1, unit_price: 190 },
    ],
  },
];

export default function KitchenKdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BEVERAGES' | 'SNACKS' | 'MEALS'>('ALL');
  const [shiftCashCount] = useState(1250);

  const [cartItems, setCartItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);

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

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const clubId = getClubId();
    try {
      const [ordersData, prodsData] = await Promise.all([
        api.getOrders(clubId).catch(() => []),
        api.getProducts(clubId).catch(() => []),
      ]);
      setOrders(ordersData && ordersData.length > 0 ? ordersData : DEFAULT_KITCHEN_ORDERS);
      setProducts(prodsData && prodsData.length > 0 ? prodsData : DEFAULT_KITCHEN_MENU_ITEMS);
    } catch {
      setOrders(DEFAULT_KITCHEN_ORDERS);
      setProducts(DEFAULT_KITCHEN_MENU_ITEMS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };

  const handleAddToCart = (product: Product) => {
    const existing = cartItems.find((ci) => ci.id === product.id);
    if (existing) {
      setCartItems(
        cartItems.map((ci) => (ci.id === product.id ? { ...ci, qty: ci.qty + 1 } : ci))
      );
    } else {
      setCartItems([...cartItems, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }]);
    }
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  };

  const handlePlaceOrder = async (paymentMode: Order['payment_mode']) => {
    if (cartItems.length === 0) return;
    const clubId = getClubId();

    const payload = {
      clubId,
      tableNumber: selectedTable,
      items: cartItems.map((ci) => ({
        productId: ci.id,
        quantity: ci.qty,
      })),
      paymentMode: paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : paymentMode,
    };

    try {
      const createdOrder = await api.createOrder(payload);
      setOrders([createdOrder, ...orders]);
      setCartItems([]);
    } catch {
      // Local fallback for smooth UI demo
      const newDummyOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        club_id: clubId,
        table_number: selectedTable,
        status: 'NEW',
        total_amount: calculateCartTotal(),
        discount_amount: 0,
        net_amount: calculateCartTotal(),
        payment_mode: paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : paymentMode,
        created_at: new Date().toISOString(),
        items: cartItems.map((ci) => ({
          product_id: ci.id,
          product_name: ci.name,
          quantity: ci.qty,
          unit_price: ci.price,
        })),
      };
      setOrders([newDummyOrder, ...orders]);
      setCartItems([]);
    }
  };

  const handleIncreaseCartQty = (id: string) => {
    setCartItems(cartItems.map((ci) => (ci.id === id ? { ...ci, qty: ci.qty + 1 } : ci)));
  };

  const handleDecreaseCartQty = (id: string) => {
    setCartItems(
      cartItems
        .map((ci) => (ci.id === id ? { ...ci, qty: ci.qty - 1 } : ci))
        .filter((ci) => ci.qty > 0)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((ci) => ci.id !== id));
  };

  const activeProducts = products.length > 0 ? products : DEFAULT_KITCHEN_MENU_ITEMS;
  const filteredCategoryProducts = activeProducts.filter((p) => {
    if (selectedCategory === 'BEVERAGES') return p.category?.toLowerCase().includes('beverage') || p.name.toLowerCase().includes('drink') || p.name.toLowerCase().includes('juice') || p.name.toLowerCase().includes('shake') || p.name.toLowerCase().includes('water') || p.name.toLowerCase().includes('espresso');
    if (selectedCategory === 'SNACKS') return p.name.toLowerCase().includes('sandwich') || p.name.toLowerCase().includes('wrap') || p.name.toLowerCase().includes('bar') || p.name.toLowerCase().includes('nuts') || p.name.toLowerCase().includes('fries');
    if (selectedCategory === 'MEALS') return p.name.toLowerCase().includes('burger') || p.name.toLowerCase().includes('rice') || p.name.toLowerCase().includes('pasta') || p.name.toLowerCase().includes('omelette') || p.name.toLowerCase().includes('dimsums');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <UtensilsCrossed className="w-4 h-4" /> Canteen & Kitchen Operations
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Kitchen Display System (KDS) & Bar POS
          </h1>
          <p className="text-sm text-slate-500">
            Real-time ticket display for kitchen preparation, table billing, and court takeaway orders.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
          <ChefHat className="w-4 h-4 text-[#006c49]" />
          <span className="text-slate-500">Shift Cash Drawer:</span>
          <span className="font-bold text-[#0b1c30]">₹{shiftCashCount}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Kitchen KDS Live Tickets */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006c49]" /> Active Kitchen Orders ({orders.filter(o => o.status !== 'SERVED').length})
            </h2>
            <span className="text-xs text-slate-500">Live order queue</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading tickets...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No active kitchen orders. New orders from POS or canteen takeaway will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-[#0b1c30] text-sm">{order.table_number || 'Takeaway'}</span>
                      <div className="text-[11px] text-slate-500">Order #{order.id}</div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      order.status === 'NEW'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : order.status === 'PREPARING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : order.status === 'READY'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span><strong>{item.quantity}x</strong> {item.product_name}</span>
                        <span className="text-slate-500 font-medium">₹{item.unit_price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 text-xs font-semibold">
                    <span className="text-slate-600">Total: <strong className="text-[#0b1c30]">₹{order.net_amount || order.total_amount}</strong> ({order.payment_mode})</span>

                    {order.status === 'NEW' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'PREPARING')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Start Prep
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'READY')}
                        className="px-2.5 py-1 bg-[#006c49] hover:bg-[#005237] text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'SERVED')}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Counter POS & Menu Section */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-[#0b1c30]">
              Table Order Entry &amp; Canteen POS
            </h2>
            <span className="text-[11px] font-semibold text-[#006c49] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Canteen Menu
            </span>
          </div>

          {/* Table Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Select Active Table / Location</label>
            <div className="grid grid-cols-4 gap-2">
              {['Table 1', 'Table 2', 'Table 3', 'Court 2 Delivery'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    selectedTable === t
                      ? 'bg-[#006c49] border-[#006c49] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Category Filter & Dummy Menu Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                Canteen Menu ({filteredCategoryProducts.length} Items)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Instant POS</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'BEVERAGES', label: '🥤 Beverages' },
                { id: 'SNACKS', label: '🥪 Snacks' },
                { id: 'MEALS', label: '🍔 Combos & Meals' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#006c49] text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Menu Items List */}
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredCategoryProducts.map((prod) => (
                <div key={prod.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-[#006c49]/40 transition-colors">
                  <div className="pr-2">
                    <span className="font-semibold text-[#0b1c30] block">{prod.name}</span>
                    <span className="text-slate-500 font-medium">₹{prod.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(prod)}
                    className="p-1 px-3 bg-[#006c49] hover:bg-[#005237] text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Order Summary & Checkout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#0b1c30] border-b border-slate-200 pb-2 flex justify-between items-center">
              <span>Active Order Ticket ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 font-medium">
                No items in active order yet. Click + Add on menu items above.
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <span className="font-semibold text-[#0b1c30]">{item.name}</span>
                    <div className="text-[11px] text-slate-500">₹{item.price} x {item.qty} = ₹{item.price * item.qty}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDecreaseCartQty(item.id)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Decrease Quantity"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleIncreaseCartQty(item.id)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title="Increase Quantity"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="ml-1 p-1 text-rose-600 hover:bg-rose-50 rounded-md text-[11px] font-bold cursor-pointer"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-between items-baseline border-t border-slate-200 pt-2">
              <span className="text-xs text-slate-500">Order Subtotal:</span>
              <span className="text-xl font-bold text-[#006c49]">₹{calculateCartTotal()}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePlaceOrder('CASH')}
                className="py-2 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => handlePlaceOrder('UPI')}
                className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => handlePlaceOrder('MEMBER_TAB')}
                className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Member Tab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
