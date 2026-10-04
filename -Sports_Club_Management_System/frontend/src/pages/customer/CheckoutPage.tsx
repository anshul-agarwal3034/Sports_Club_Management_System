import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Zap,
  User,
  ArrowRight,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { getCart, clearCart, getCartTotal, CartState } from '@/lib/cart';
import { getStoredUser } from '@/lib/roles';
import { getActiveMembership } from '@/lib/membershipsState';
import { addCustomerBooking } from '@/lib/bookingsState';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartState>(getCart());
  const user = getStoredUser();
  const membership = getActiveMembership();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.full_name || 'Aarav Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 11111');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'aarav@example.com');
  const [fulfillmentType, setFulfillmentType] = useState<'COUNTER_PICKUP' | 'COURT_DELIVERY'>('COUNTER_PICKUP');
  const [courtDeliveryDetails, setCourtDeliveryDetails] = useState('');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'COUNTER' | 'MEMBER_TAB'>('UPI');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const total = getCartTotal();

  if (cart.items.length === 0 && !confirmedOrderId) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] py-12 selection:bg-[#006c49] selection:text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
            title="No Items in Cart"
            description="Your cart is currently empty. Please add items before checking out."
            actionLabel="Explore Club Stores"
            onAction={() => navigate('/clubs')}
          />
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name and phone number for pickup verification.');
      return;
    }

    if (fulfillmentType === 'COURT_DELIVERY' && !courtDeliveryDetails.trim()) {
      setErrorMessage('Please specify your court number for on-court delivery.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate real order processing
      await new Promise((resolve) => setTimeout(resolve, 600));

      const randomOrderId = `ORD-${Date.now().toString().slice(-6)}`;

      // Sync any court bookings in cart to backend database
      for (const item of cart.items) {
        if (item.category === 'court_booking') {
          try {
            const dateStr = new Date().toISOString().split('T')[0];
            const startIso = `${dateStr}T10:00:00Z`;
            const endIso = `${dateStr}T11:00:00Z`;
            await api.createBooking({
              courtId: item.id.replace('booking-', '').split('-')[0] || '0fec767b-afc1-4301-914c-92295c9cd5a4',
              startTime: startIso,
              endTime: endIso,
              paymentMode: paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : (paymentMode as any),
            });
          } catch (apiErr) {
            console.warn('Backend sync in checkout warning:', apiErr);
          }
        }
      }

      // Record gear / pro shop order into user's booking & order history
      const itemSummary = cart.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
      addCustomerBooking({
        clubId: cart.clubSlug || 'club-1',
        clubSlug: cart.clubSlug || 'skyline-sports',
        clubName: cart.clubName || 'Sports Venue Pro Shop',
        courtId: 'gear-order',
        courtName: `Gear Order: ${itemSummary}`,
        sport: 'PRO_SHOP_GEAR',
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        endTime: 'Pickup Ready',
        durationHours: 1,
        basePrice: total,
        priceCharged: total,
        isPeak: false,
        memberDiscountPct: 0,
        status: 'CONFIRMED',
        paymentMode: (paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : paymentMode) as any,
        paymentStatus: paymentMode === 'MEMBER_TAB' ? 'PAY_LATER' : 'PAID',
      });

      setConfirmedOrderId(randomOrderId);
      clearCart();
    } catch {
      setErrorMessage('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/cart" className="hover:text-[#006c49]">Cart</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Checkout</span>
        </nav>

        {confirmedOrderId ? (
          /* Confirmation Screen */
          <div className="max-w-xl mx-auto py-10">
            <Card className="text-center p-8 space-y-5 border-emerald-200 shadow-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#006c49]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <Badge variant="emerald">Order Placed</Badge>
                <h1 className="text-2xl font-black text-[#0b1c30] mt-2">
                  Order Confirmed!
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Your order has been sent to the club reception &amp; kitchen team.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Order Identifier
                </span>
                <div className="text-2xl font-black font-mono tracking-wider text-[#006c49]">
                  {confirmedOrderId}
                </div>
                <div className="text-xs text-slate-600 pt-1">
                  Fulfillment: {fulfillmentType === 'COURT_DELIVERY' ? `Delivery to ${courtDeliveryDetails}` : 'Counter Pickup at Reception'}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto"
                >
                  Go to Customer Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/clubs')}
                  className="w-full sm:w-auto"
                >
                  Browse More Clubs
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          /* Checkout Form */
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Order Checkout
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Fulfilling at <strong className="text-[#0b1c30]">{cart.clubName}</strong>. All prices in ₹ INR.
              </p>
            </div>

            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Details */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Customer Verification */}
                <Card padded="sm" className="space-y-4">
                  <h3 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider">
                    1. Customer Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      required
                    />
                    <Input
                      label="Phone Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Email Address"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="aarav@gmail.com"
                        required
                      />
                    </div>
                  </div>
                </Card>

                {/* 2. Fulfillment Mode */}
                <Card padded="sm" className="space-y-4">
                  <h3 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider">
                    2. Pickup or Court Delivery
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFulfillmentType('COUNTER_PICKUP')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        fulfillmentType === 'COUNTER_PICKUP'
                          ? 'bg-[#ecfdf5] border-[#006c49] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-[#0b1c30]">Reception Counter Pickup</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Collect your items at the club front desk when you arrive.
                      </p>
                    </div>

                    <div
                      onClick={() => setFulfillmentType('COURT_DELIVERY')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        fulfillmentType === 'COURT_DELIVERY'
                          ? 'bg-[#ecfdf5] border-[#006c49] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-[#0b1c30]">Direct to Court / Table</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Staff delivers refreshments or rental rackets right to your court.
                      </p>
                    </div>
                  </div>

                  {fulfillmentType === 'COURT_DELIVERY' && (
                    <div className="pt-2">
                      <Input
                        label="Court or Table Designation"
                        value={courtDeliveryDetails}
                        onChange={(e) => setCourtDeliveryDetails(e.target.value)}
                        placeholder="e.g. Court 1 (Padel) or Canteen Table 4"
                        required
                      />
                    </div>
                  )}
                </Card>

                {/* 3. Payment Method */}
                <Card padded="sm" className="space-y-4">
                  <h3 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider">
                    3. Payment Selection
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'UPI', label: 'UPI / QR', icon: Zap },
                      { id: 'CARD', label: 'Debit / Card', icon: CreditCard },
                      { id: 'COUNTER', label: 'Cash at Desk', icon: Building },
                      ...(membership && membership.payLaterCreditLimit > 0
                        ? [{ id: 'MEMBER_TAB', label: 'Member Tab', icon: User }]
                        : []),
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id as any)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                          paymentMode === mode.id
                            ? 'bg-[#ecfdf5] border-[#006c49] text-[#006c49] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <mode.icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMode === 'MEMBER_TAB' && (
                    <p className="text-xs text-[#006c49] bg-[#ecfdf5] p-2.5 rounded-xl border border-[#a7f3d0]">
                      Your order will be billed to your Gold Member credit account (Limit: ₹2,000).
                    </p>
                  )}
                </Card>

              </div>

              {/* Right Column: Order Review */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                <Card className="p-6 space-y-4 shadow-sm border-slate-200">
                  <h3 className="text-base font-bold text-[#0b1c30] border-b border-slate-100 pb-3">
                    Order Details ({cart.items.length})
                  </h3>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <div className="font-bold text-[#0b1c30] truncate">{item.name}</div>
                          <span className="text-slate-500 font-mono">
                            Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                        <span className="font-bold text-[#0b1c30]">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{total}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Fulfillment</span>
                      <span className="text-[#006c49] font-medium">FREE</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-black text-[#0b1c30]">
                      <span>Total Amount</span>
                      <span className="text-xl text-[#006c49]">₹{total}</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Place Order (₹{total})
                  </Button>
                </Card>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
