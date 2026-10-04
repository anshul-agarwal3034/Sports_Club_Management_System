export interface CartItem {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  stock: number;
  isRental?: boolean;
  image?: string;
}

export interface CartState {
  clubId: string | null;
  clubSlug: string | null;
  clubName: string | null;
  items: CartItem[];
}

const STORAGE_KEY = 'sportshub_cart';

export function getCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clubId: null, clubSlug: null, clubName: null, items: [] };
    return JSON.parse(raw);
  } catch {
    return { clubId: null, clubSlug: null, clubName: null, items: [] };
  }
}

export function saveCart(state: CartState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('sportshub_cart_updated'));
  } catch {
    // Ignore storage issues
  }
}

export function addToCart(
  item: Omit<CartItem, 'quantity'>,
  qty: number = 1,
  replaceClubIfDifferent: boolean = false
): { success: boolean; requiresClubSwitch?: boolean; currentClubName?: string } {
  const current = getCart();

  // If cart has items from another club and user hasn't confirmed replacement
  if (current.items.length > 0 && current.clubId && current.clubId !== item.clubId) {
    if (!replaceClubIfDifferent) {
      return {
        success: false,
        requiresClubSwitch: true,
        currentClubName: current.clubName || 'another club',
      };
    }
    // Replace with new club
    const newItem: CartItem = { ...item, quantity: Math.min(qty, item.stock) };
    saveCart({
      clubId: item.clubId,
      clubSlug: item.clubSlug,
      clubName: item.clubName,
      items: [newItem],
    });
    return { success: true };
  }

  // Same club or empty cart
  const existingIdx = current.items.findIndex((i) => i.id === item.id);
  let updatedItems: CartItem[];

  if (existingIdx > -1) {
    updatedItems = [...current.items];
    const newQty = Math.min(updatedItems[existingIdx].quantity + qty, item.stock);
    updatedItems[existingIdx] = {
      ...updatedItems[existingIdx],
      quantity: newQty,
    };
  } else {
    updatedItems = [...current.items, { ...item, quantity: Math.min(qty, item.stock) }];
  }

  saveCart({
    clubId: item.clubId,
    clubSlug: item.clubSlug,
    clubName: item.clubName,
    items: updatedItems,
  });

  return { success: true };
}

export function updateCartQuantity(itemId: string, newQty: number): void {
  const current = getCart();
  if (newQty <= 0) {
    removeFromCart(itemId);
    return;
  }

  const updatedItems = current.items.map((i) => {
    if (i.id === itemId) {
      return { ...i, quantity: Math.min(newQty, i.stock) };
    }
    return i;
  });

  saveCart({
    ...current,
    items: updatedItems,
  });
}

export function removeFromCart(itemId: string): void {
  const current = getCart();
  const filtered = current.items.filter((i) => i.id !== itemId);
  saveCart({
    clubId: filtered.length === 0 ? null : current.clubId,
    clubSlug: filtered.length === 0 ? null : current.clubSlug,
    clubName: filtered.length === 0 ? null : current.clubName,
    items: filtered,
  });
}

export function clearCart(): void {
  saveCart({ clubId: null, clubSlug: null, clubName: null, items: [] });
}

export function getCartTotal(): number {
  const current = getCart();
  return current.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

export function getCartCount(): number {
  const current = getCart();
  return current.items.reduce((acc, item) => acc + item.quantity, 0);
}
