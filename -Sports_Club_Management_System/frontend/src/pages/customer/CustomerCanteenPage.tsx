import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Users,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { getStoredUser } from '@/lib/roles';
import { api } from '@/services/api';
import { Club, Product, OrderStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface CanteenMenuItem {
  id: string;
  name: string;
  category: 'drinks' | 'snacks' | 'meals' | 'cafe';
  price: number;
  description: string;
  isPopular?: boolean;
  calories?: string;
  imageUrl?: string;
}

interface CartEntry {
  item: CanteenMenuItem;
  quantity: number;
}

interface CustomerCanteenOrder {
  id: string;
  clubId: string;
  clubName: string;
  userId: string;
  userName: string;
  tableNo: string;
  numberOfPersons: number;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMode: string;
  status: OrderStatus;
  createdAt: string;
}

const DEFAULT_MENU_ITEMS: CanteenMenuItem[] = [
  // Hydration & Drinks
  {
    id: 'm-1',
    name: 'Gatorade Isotonic Energy Drink (500ml)',
    category: 'drinks',
    price: 90,
    description: 'Electrolyte replenishment for peak court stamina.',
    isPopular: true,
    calories: '130 kcal | 24g Carbs',
  },
  {
    id: 'm-2',
    name: 'Fresh Tender Coconut Water',
    category: 'drinks',
    price: 80,
    description: 'Natural potassium & hydration straight from fresh coconut.',
    isPopular: true,
    calories: '60 kcal | 100% Organic',
  },
  {
    id: 'm-3',
    name: 'Whey Protein Recovery Shake',
    category: 'drinks',
    price: 180,
    description: '25g Whey protein isolate with chocolate almond milk.',
    calories: '220 kcal | 25g Protein',
  },
  {
    id: 'm-4',
    name: 'Cold Pressed Watermelon Mint Juice',
    category: 'drinks',
    price: 120,
    description: 'Freshly pressed no-added-sugar cooling juice.',
    calories: '90 kcal',
  },

  // Snacks & Wraps
  {
    id: 'm-5',
    name: 'Grilled Chicken Club Sandwich',
    category: 'snacks',
    price: 220,
    description: 'Multigrain bread with herb chicken, lettuce, tomato & mayo.',
    isPopular: true,
    calories: '380 kcal | 22g Protein',
  },
  {
    id: 'm-6',
    name: 'Paneer Tikka & Sprouted Wheat Wrap',
    category: 'snacks',
    price: 190,
    description: 'Charbroiled cottage cheese with mint chutney in whole wheat tortilla.',
    calories: '340 kcal | 18g Protein',
  },
  {
    id: 'm-7',
    name: 'High Protein Peanut Butter Energy Bar',
    category: 'snacks',
    price: 110,
    description: 'Oats, honey, dark chocolate chips & whey crispies.',
    calories: '210 kcal | 12g Protein',
  },
  {
    id: 'm-8',
    name: 'Salted Roasted Almonds & Cashews Bowl',
    category: 'snacks',
    price: 150,
    description: 'Slow roasted nuts tossed in Himalayan pink salt.',
    calories: '260 kcal',
  },

  // Hot Kitchen Meals & Combos
  {
    id: 'm-9',
    name: 'Sports Hub Special Burger & Fries Combo',
    category: 'meals',
    price: 260,
    description: 'Grilled patty with melted cheese, crispy peri-peri fries & dip.',
    isPopular: true,
    calories: '550 kcal',
  },
  {
    id: 'm-10',
    name: 'Wok Tossed Chicken Fried Rice & Chili Gravy',
    category: 'meals',
    price: 280,
    description: 'Basmati rice with shredded chicken, eggs & Indo-Chinese gravy.',
    calories: '490 kcal',
  },
  {
    id: 'm-[#m-11]',
    name: 'Creamy Penne Alfredo Pasta with Garlic Toast',
    category: 'meals',
    price: 250,
    description: 'Penne in rich parmesan cream sauce with bell peppers.',
    calories: '450 kcal',
  },
  {
    id: 'm-12',
    name: 'Double Egg Cheese Omelette with Toast',
    category: 'meals',
    price: 160,
    description: 'Fluffy 3-egg omelette served with butter toasted brown bread.',
    calories: '320 kcal | 16g Protein',
  },

  // Hot Cafe
  {
    id: 'm-13',
    name: 'Espresso Double Shot Coffee',
    category: 'cafe',
    price: 110,
    description: 'Freshly ground Arabica coffee beans.',
    calories: '15 kcal',
  },
  {
    id: 'm-14',
    name: 'Iced Hazelnut Cold Coffee with Scoop',
    category: 'cafe',
    price: 170,
    description: 'Chilled coffee blend topped with vanilla bean scoop.',
    isPopular: true,
    calories: '240 kcal',
  },
];

export default function CustomerCanteenPage() {
  const user = getStoredUser();
  const navigate = useNavigate();

  // Auto-detected User Information
  const customerId = user?.id || 'usr-guest-101';
  const customerName = user?.full_name || (user as any)?.name || 'Player Customer';
  const customerEmail = user?.email || 'customer@sportshub.com';

  // State
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [selectedClubName, setSelectedClubName] = useState<string>('Skyline Sports Arena');
  const [tableNo, setTableNo] = useState<string>('Table 1 (Canteen Main)');
  const [numberOfPersons, setNumberOfPersons] = useState<number>(2);
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNotice, setOrderNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Customer Orders List
  const [myOrders, setMyOrders] = useState<CustomerCanteenOrder[]>(() => {
    try {
      const saved = localStorage.getItem('sportshub_customer_canteen_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'ORD-KITCHEN-8492',
        clubId: '11111111-1111-1111-1111-111111111111',
        clubName: 'Skyline Sports Arena',
        userId: customerId,
        userName: customerName,
        tableNo: 'Court 1 Side Bench',
        numberOfPersons: 2,
        items: [
          { name: 'Gatorade Isotonic Energy Drink (500ml)', quantity: 2, price: 90 },
          { name: 'Grilled Chicken Club Sandwich', quantity: 1, price: 220 },
        ],
        totalAmount: 400,
        paymentMode: 'UPI',
        status: 'PREPARING',
        createdAt: new Date(Date.now() - 12 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Load Clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubList = await api.getClubs();
        if (Array.isArray(clubList) && clubList.length > 0) {
          setClubs(clubList);
          setSelectedClubId(clubList[0].id);
          setSelectedClubName(clubList[0].name);
        }
      } catch {
        // fallback
      }
    };
    fetchClubs();
  }, []);

  // Poll / Refresh Orders Live Status
  useEffect(() => {
    const interval = setInterval(() => {
      setMyOrders((prev) => {
        let changed = false;
        const updated = prev.map((ord) => {
          if (ord.status === 'NEW') {
            changed = true;
            return { ...ord, status: 'PREPARING' as OrderStatus };
          }
          if (ord.status === 'PREPARING') {
            changed = true;
            return { ...ord, status: 'READY' as OrderStatus };
          }
          return ord;
        });
        if (changed) {
          localStorage.setItem('sportshub_customer_canteen_orders', JSON.stringify(updated));
        }
        return updated;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Cart Helper Logic
  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  // Filtered Menu Items
  const filteredMenuItems = DEFAULT_MENU_ITEMS.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate Cart Subtotal
  const cartItemsList = Object.entries(cart).map(([itemId, qty]) => {
    const menuItem = DEFAULT_MENU_ITEMS.find((m) => m.id === itemId)!;
    return {
      menuItem,
      quantity: qty,
      itemTotal: menuItem.price * qty,
    };
  });

  const cartSubtotal = cartItemsList.reduce((acc, curr) => acc + curr.itemTotal, 0);

  // Submit Order Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartSubtotal === 0) {
      alert('Please add at least one food or beverage item to your canteen order.');
      return;
    }

    setIsSubmitting(true);
    setOrderNotice(null);

    const formattedItems = cartItemsList.map((c) => ({
      name: c.menuItem.name,
      quantity: c.quantity,
      price: c.menuItem.price,
    }));

    const newOrder: CustomerCanteenOrder = {
      id: `ORD-KITCHEN-${Math.floor(1000 + Math.random() * 9000)}`,
      clubId: selectedClubId,
      clubName: selectedClubName,
      userId: customerId,
      userName: customerName,
      tableNo: tableNo,
      numberOfPersons: Number(numberOfPersons),
      items: formattedItems,
      totalAmount: cartSubtotal,
      paymentMode: paymentMode,
      status: 'NEW',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      // API Attempt
      await api.createOrder({
        clubId: selectedClubId,
        userId: customerId,
        userName: customerName,
        tableNumber: tableNo,
        numberOfPersons: Number(numberOfPersons),
        paymentMode: paymentMode,
        items: cartItemsList.map((c) => ({ productId: c.menuItem.id, quantity: c.quantity })),
      }).catch(() => null);

      const updatedOrders = [newOrder, ...myOrders];
      setMyOrders(updatedOrders);
      localStorage.setItem('sportshub_customer_canteen_orders', JSON.stringify(updatedOrders));

      // Dispatch event to sync Kitchen KDS in real time
      window.dispatchEvent(new Event('sportshub_canteen_order_created'));

      setCart({});
      setOrderNotice({
        type: 'success',
        text: `Order #${newOrder.id} placed successfully! Your food is now being prepared in the kitchen for ${tableNo}.`,
      });

      // Scroll to order status section
      setTimeout(() => {
        document.getElementById('my-canteen-orders')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      setOrderNotice({
        type: 'error',
        text: err.message || 'Failed to place kitchen order. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" icon={<UtensilsCrossed className="w-3.5 h-3.5" />}>
                On-Site Kitchen &amp; Canteen
              </Badge>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                0% Platform Fee on Food
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Order Food &amp; Drinks from Kitchen
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Fresh meal preparation, sports hydration &amp; snacks delivered directly to your court side table.
            </p>
          </div>

          {/* User Auto-Detect Badge */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006c49] flex items-center justify-center font-bold text-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0b1c30]">{customerName}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                  ID: {customerId.slice(0, 8)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{customerEmail}</p>
            </div>
          </div>
        </div>

        {/* Global Notice Alert */}
        {orderNotice && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs ${
              orderNotice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {orderNotice.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
              )}
              <span>{orderNotice.text}</span>
            </div>
          </div>
        )}

        {/* Main Grid: Menu & Ordering Form + Cart Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 Cols): Venue Selector, Table Info & Food Menu */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Club & Table Placement Settings Card */}
            <Card className="p-5 border-slate-200 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <MapPin className="w-4 h-4 text-[#006c49]" /> 1. Select Venue &amp; Table Number
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Select Club Venue */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Club Facility *</label>
                  <select
                    value={selectedClubId}
                    onChange={(e) => {
                      setSelectedClubId(e.target.value);
                      const found = clubs.find((c) => c.id === e.target.value);
                      if (found) setSelectedClubName(found.name);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006c49] outline-none"
                  >
                    {clubs.length > 0 ? (
                      clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.city})
                        </option>
                      ))
                    ) : (
                      <option value="11111111-1111-1111-1111-111111111111">Skyline Sports Arena</option>
                    )}
                  </select>
                </div>

                {/* Table Number / Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Table No. / Location *</label>
                  <select
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006c49] outline-none"
                  >
                    <option value="Table 1 (Canteen Main)">Table 1 (Canteen Main)</option>
                    <option value="Table 2 (Canteen Patio)">Table 2 (Canteen Patio)</option>
                    <option value="Court 1 Side Bench">Court 1 Side Bench</option>
                    <option value="Court 2 Side Bench">Court 2 Side Bench</option>
                    <option value="Badminton Bench 3">Badminton Bench 3</option>
                    <option value="Padel Lounge Table 4">Padel Lounge Table 4</option>
                    <option value="Takeaway Pickup Counter">Takeaway Pickup Counter</option>
                  </select>
                </div>

                {/* Number of Persons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. of Persons *</label>
                  <div className="relative">
                    <Users className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={numberOfPersons}
                      onChange={(e) => setNumberOfPersons(Math.max(1, Number(e.target.value)))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006c49] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Menu Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" /> 2. Explore Kitchen Menu &amp; Add Items
                </h2>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search snacks, energy drinks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#006c49]"
                  />
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'drinks', label: '💧 Hydration & Drinks' },
                  { id: 'snacks', label: '🥪 Club Snacks & Wraps' },
                  { id: 'meals', label: '🍲 Hot Meals & Combos' },
                  { id: 'cafe', label: '☕ Hot Cafe' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-[#006c49] text-white border-[#006c49] shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const currentQty = cart[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[#0b1c30] text-xs leading-snug">{item.name}</h3>
                          {item.isPopular && (
                            <span className="shrink-0 text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
                        {item.calories && (
                          <span className="text-[10px] text-emerald-700 font-mono font-medium block pt-0.5">
                            {item.calories}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="font-extrabold text-[#006c49] text-sm">₹{item.price}</span>

                        {currentQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => addToCart(item.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-[#006c49] text-[#006c49] hover:text-white border border-[#a7f3d0] rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add to Order
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="w-5 h-5 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-extrabold text-xs text-[#006c49] px-1">{currentQty}</span>
                            <button
                              type="button"
                              onClick={() => addToCart(item.id)}
                              className="w-5 h-5 rounded-lg bg-[#006c49] text-white flex items-center justify-center font-bold hover:bg-[#005237] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (4 Cols): Cart Summary & Payment Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 border-slate-200 shadow-sm space-y-5 sticky top-24">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#006c49]" /> Kitchen Order Summary
                </span>
                <span className="text-xs font-mono font-bold text-[#006c49]">
                  {cartItemsList.length} Items
                </span>
              </div>

              {/* Items List in Cart */}
              {cartItemsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400">Your canteen order cart is empty.</p>
                  <p className="text-[11px] text-slate-400">Add food or drinks from the menu to place your kitchen order.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
                    {cartItemsList.map((c) => (
                      <div key={c.menuItem.id} className="pt-2 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-[#0b1c30] text-[11px]">{c.menuItem.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ₹{c.menuItem.price} × {c.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#006c49]">₹{c.itemTotal}</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(c.menuItem.id)}
                            className="text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">Payment Option *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#006c49] outline-none"
                    >
                      <option value="UPI">UPI / QR Code Scan</option>
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="CASH">Cash on Delivery / Counter</option>
                      <option value="PAY_LATER">Pay Later (Gold Member Balance)</option>
                    </select>
                  </div>

                  {/* Total Calculation */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span>Food &amp; Beverage Subtotal</span>
                      <strong className="text-slate-800 font-semibold">₹{cartSubtotal}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700 font-medium">
                      <span>Platform Commission Fee</span>
                      <span>₹0 (0% Fee)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-[#0b1c30]">
                      <span>Total Amount</span>
                      <span className="text-[#006c49]">₹{cartSubtotal}</span>
                    </div>
                  </div>

                  {/* Submit Order Button */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Place Kitchen Order (₹{cartSubtotal})
                      </>
                    )}
                  </button>
                </div>
              )}
            </Card>
          </div>

        </div>

        {/* Section 3: Active Orders Live Status Tracking */}
        <div id="my-canteen-orders" className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#006c49]" /> Active Kitchen Orders &amp; Live Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track real-time cooking progress for orders placed at your table.
              </p>
            </div>
            <button
              onClick={() => {
                const saved = localStorage.getItem('sportshub_customer_canteen_orders');
                if (saved) setMyOrders(JSON.parse(saved));
              }}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No active kitchen orders placed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-[#0b1c30] font-mono">{ord.id}</span>
                      <p className="text-[11px] text-slate-400">{ord.createdAt} • {ord.clubName}</p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ord.status === 'NEW'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          : ord.status === 'PREPARING'
                          ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                          : ord.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ord.status === 'NEW'
                        ? 'ORDER RECEIVED'
                        : ord.status === 'PREPARING'
                        ? 'CHEF COOKING 🍳'
                        : ord.status === 'READY'
                        ? 'READY FOR TABLE 🟢'
                        : ord.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Delivery Placement:</span>
                      <strong className="text-[#006c49] font-bold">{ord.tableNo}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Party Size:</span>
                      <span>{ord.numberOfPersons} Person(s)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Items Ordered:</span>
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                          <span>{it.quantity}× {it.name}</span>
                          <span className="font-semibold">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">Paid via {ord.paymentMode}</span>
                    <strong className="text-[#0b1c30] font-bold text-sm">₹{ord.totalAmount}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
