import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Store,
  Info
} from 'lucide-react';
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
  CartState
} from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CartPage() {
  const [cart, setCart] = useState<CartState>(getCart());
  const navigate = useNavigate();

  const loadCart = () => {
    setCart(getCart());
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('sportshub_cart_updated', loadCart);
    return () => window.removeEventListener('sportshub_cart_updated', loadCart);
  }, []);

  const total = getCartTotal();

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] py-12 selection:bg-[#006c49] selection:text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
            title="Your Cart is Empty"
            description="You haven't added any sports gear, rental equipment, or canteen items yet. Browse a club store to pick up items on your next match day."
            actionLabel="Explore Partner Clubs & Stores"
            onAction={() => navigate('/clubs')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          {cart.clubSlug && (
            <>
              <Link to={`/club/${cart.clubSlug}`} className="hover:text-[#006c49]">
                {cart.clubName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link to={`/club/${cart.clubSlug}/shop`} className="hover:text-[#006c49]">
                Shop
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </>
          )}
          <span className="text-[#0b1c30] font-medium">Cart</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#006c49]" />
              Fulfillment club: <strong className="text-[#0b1c30]">{cart.clubName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer self-start sm:self-auto"
          >
            Clear All Items
          </button>
        </div>

        {/* 2-Column Cart: Left Item List, Right Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Items */}
          <div className="lg:col-span-8 space-y-4">
            <Card padded={false} className="divide-y divide-slate-100 overflow-hidden">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {item.image && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-[#0b1c30]">{item.name}</h4>
                      <div className="text-xs font-semibold text-[#006c49]">
                        ₹{item.price} each
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-lg hover:bg-white text-slate-600 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.stock}
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="text-sm font-black text-[#0b1c30]">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
              <span>Orders are prepared fresh by club reception and canteen staff.</span>
              {cart.clubSlug && (
                <Link to={`/club/${cart.clubSlug}/shop`} className="text-[#006c49] hover:underline font-semibold">
                  + Add more items from store
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card className="p-6 space-y-5 shadow-sm border-slate-200">
              <h3 className="text-base font-bold text-[#0b1c30] border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal ({cart.items.length} unique items)</span>
                  <span className="font-semibold text-[#0b1c30]">₹{total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Club Counter Pickup Fee</span>
                  <span className="font-semibold text-[#006c49]">FREE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST / Tax</span>
                  <span className="text-slate-400">Included in price</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-black text-[#0b1c30]">
                  <span>Total Amount</span>
                  <span className="text-xl text-[#006c49]">₹{total}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/checkout" className="block">
                  <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                Stock is verified again upon checkout submission. Orders can be collected at the front desk or delivered to your court.
              </div>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
