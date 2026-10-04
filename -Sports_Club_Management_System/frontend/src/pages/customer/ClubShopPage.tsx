import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronRight,
  Info,
  ArrowRight,
  Search,
  Check
} from 'lucide-react';
import { getClubBySlug, DetailedClub } from '@/lib/clubsData';
import { addToCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ClubProduct {
  id: string;
  name: string;
  category: 'racket' | 'gear' | 'canteen';
  categoryLabel: string;
  price: number;
  stock: number;
  isRental: boolean;
  image: string;
  description: string;
}

const PRODUCTS: ClubProduct[] = [
  {
    id: 'prod-001',
    name: 'Head Padel Racket Pro Tour',
    category: 'racket',
    categoryLabel: 'Rackets',
    price: 8500,
    stock: 4,
    isRental: false,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    description: 'Carbon composite frame with teardrop head shape for maximum power and spin control.',
  },
  {
    id: 'prod-002',
    name: 'Wilson Pro Padel Balls (3-Can)',
    category: 'gear',
    categoryLabel: 'Balls & Accessories',
    price: 650,
    stock: 24,
    isRental: false,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    description: 'High-density pressurized felt balls optimized for glass and mesh courts.',
  },
  {
    id: 'prod-003',
    name: 'Pro Racket Rental (Hourly Session)',
    category: 'racket',
    categoryLabel: 'Rentals',
    price: 150,
    stock: 12,
    isRental: true,
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly gripped test racket for match play. Return to reception after your session.',
  },
  {
    id: 'prod-004',
    name: 'Hydration Electrolyte Sports Drink',
    category: 'canteen',
    categoryLabel: 'Canteen & Drinks',
    price: 120,
    stock: 45,
    isRental: false,
    image: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80',
    description: 'Chilled isotonic recovery drink packed with sodium, magnesium and potassium.',
  },
  {
    id: 'prod-005',
    name: 'Whey Protein Recovery Shake',
    category: 'canteen',
    categoryLabel: 'Canteen & Drinks',
    price: 220,
    stock: 30,
    isRental: false,
    image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80',
    description: 'Blended with almond milk, banana and 25g premium whey protein isolate.',
  },
  {
    id: 'prod-006',
    name: 'Grilled Whole Wheat Fitness Wrap',
    category: 'canteen',
    categoryLabel: 'Canteen & Drinks',
    price: 280,
    stock: 0, // Out of stock to test disabled state
    isRental: false,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly grilled paneer / chicken wrap with herbs, hummus and salad.',
  },
];

export default function ClubShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const club = slug ? getClubBySlug(slug) : undefined;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [detailProduct, setDetailProduct] = useState<ClubProduct | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [clubConflictWarning, setClubConflictWarning] = useState<{
    pendingItem: ClubProduct;
    qty: number;
    currentClub: string;
  } | null>(null);

  if (!club) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#f8f9ff]">
        <EmptyState
          icon={<Info className="w-8 h-8 text-slate-400" />}
          title="Club not found"
          description="The club shop you are looking for does not exist."
          actionLabel="Browse Clubs"
          onAction={() => navigate('/clubs')}
        />
      </div>
    );
  }

  const filteredProducts = PRODUCTS.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const handleAddToCartClick = (product: ClubProduct, qty: number = 1) => {
    if (product.stock === 0) return;

    const res = addToCart(
      {
        id: product.id,
        clubId: club.id,
        clubSlug: club.slug,
        clubName: club.name,
        name: product.name,
        category: product.categoryLabel,
        price: product.price,
        stock: product.stock,
        isRental: product.isRental,
        image: product.image,
      },
      qty,
      false
    );

    if (res.requiresClubSwitch) {
      setClubConflictWarning({
        pendingItem: product,
        qty,
        currentClub: res.currentClubName || 'another club',
      });
      return;
    }

    setAddedNotice(`Added "${product.name}" to cart`);
    setTimeout(() => setAddedNotice(null), 3000);
    setDetailProduct(null);
  };

  const handleConfirmClubSwitch = () => {
    if (!clubConflictWarning) return;
    const { pendingItem, qty } = clubConflictWarning;

    addToCart(
      {
        id: pendingItem.id,
        clubId: club.id,
        clubSlug: club.slug,
        clubName: club.name,
        name: pendingItem.name,
        category: pendingItem.categoryLabel,
        price: pendingItem.price,
        stock: pendingItem.stock,
        isRental: pendingItem.isRental,
        image: pendingItem.image,
      },
      qty,
      true
    );

    setClubConflictWarning(null);
    setAddedNotice(`Cart switched to ${club.name} and item added`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 selection:bg-[#006c49] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#006c49]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/clubs" className="hover:text-[#006c49]">Clubs</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to={`/club/${club.slug}`} className="hover:text-[#006c49]">{club.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#0b1c30] font-medium">Club Shop</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="emerald" icon={<ShoppingBag className="w-3.5 h-3.5" />}>
                On-Site Store
              </Badge>
              <span className="text-xs text-slate-500 font-medium">• Pickup at Front Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight mt-1">
              {club.name} Pro Shop &amp; Canteen
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Order fresh equipment, balls, rental gear, and nutrition for pickup at the club.
            </p>
          </div>

          <Link to="/cart">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Cart &amp; Checkout
            </Button>
          </Link>
        </div>

        {/* Add notification toast */}
        {addedNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#006c49]" />
              <span>{addedNotice}</span>
            </div>
            <Link to="/cart" className="text-xs font-bold text-[#006c49] hover:underline">
              Go to Cart →
            </Link>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'racket', label: 'Rackets & Rentals' },
            { id: 'gear', label: 'Balls & Accessories' },
            { id: 'canteen', label: 'Canteen & Nutrition' },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock === 0;
            const isLowStock = p.stock > 0 && p.stock <= 5;

            return (
              <Card
                key={p.id}
                padded={false}
                className="overflow-hidden flex flex-col justify-between sports-card-hover group"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {p.isRental && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase shadow-xs">
                          Rental Item
                        </span>
                      )}
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold uppercase shadow-xs">
                          Only {p.stock} left
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/95 text-[#006c49] text-[10px] font-bold uppercase shadow-xs">
                          In Stock ({p.stock})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      {p.categoryLabel}
                    </span>
                    <h3 className="text-base font-bold text-[#0b1c30] group-hover:text-[#006c49] transition-colors leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                    <div className="text-lg font-black text-[#0b1c30]">₹{p.price}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailProduct(p);
                        setModalQty(1);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCartClick(p, 1)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Product Detail Modal */}
        {detailProduct && (
          <Modal
            isOpen={!!detailProduct}
            onClose={() => setDetailProduct(null)}
            title={detailProduct.name}
            description={detailProduct.categoryLabel}
          >
            <div className="space-y-4 py-2">
              <div className="h-52 w-full rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={detailProduct.image}
                  alt={detailProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-black text-[#0b1c30]">₹{detailProduct.price}</div>
                  <span className="text-xs font-semibold text-[#006c49]">
                    {detailProduct.stock > 0
                      ? `${detailProduct.stock} units available`
                      : 'Out of Stock'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {detailProduct.description}
                </p>
              </div>

              {detailProduct.stock > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={modalQty <= 1}
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono">
                      {modalQty}
                    </span>
                    <button
                      type="button"
                      disabled={modalQty >= detailProduct.stock}
                      onClick={() => setModalQty(Math.min(detailProduct.stock, modalQty + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDetailProduct(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={detailProduct.stock === 0}
                  onClick={() => handleAddToCartClick(detailProduct, modalQty)}
                >
                  Add {modalQty} to Cart (₹{detailProduct.price * modalQty})
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Cross-Club Cart Conflict Modal */}
        {clubConflictWarning && (
          <Modal
            isOpen={!!clubConflictWarning}
            onClose={() => setClubConflictWarning(null)}
            title="Replace Cart Items?"
          >
            <div className="space-y-4 py-2 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                Your cart currently contains items from <strong>{clubConflictWarning.currentClub}</strong>. Since orders are prepared on-site, a cart can only contain items from one club at a time.
              </div>

              <p className="text-slate-600">
                Would you like to clear your current items and start a new order for <strong>{club.name}</strong>?
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setClubConflictWarning(null)}>
                  Keep Existing Cart
                </Button>
                <Button variant="primary" size="md" onClick={handleConfirmClubSwitch}>
                  Replace Cart with {club.name}
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
