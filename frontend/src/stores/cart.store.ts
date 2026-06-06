import { create } from 'zustand';

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  minOrderQty: number;
  stockQty: number;
  supplierId: string;
  supplierName: string;
}

interface CartStore {
  items: CartItem[];
  supplierId: string | null;
  supplierName: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  supplierId: null,
  supplierName: null,

  addItem: (item) => {
    const { items, supplierId } = get();
    // Cart is per-supplier — warn if adding from different supplier
    if (supplierId && supplierId !== item.supplierId) {
      if (!confirm(`Your cart has items from ${get().supplierName}. Start a new cart from ${item.supplierName}?`)) return;
      set({ items: [], supplierId: null, supplierName: null });
    }
    const existing = get().items.find(i => i.productId === item.productId);
    if (existing) {
      set({ items: get().items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.minOrderQty } : i) });
    } else {
      set({
        items: [...get().items, { ...item, quantity: item.minOrderQty }],
        supplierId: item.supplierId,
        supplierName: item.supplierName,
      });
    }
  },

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity } : i) });
  },

  removeItem: (productId) => {
    const items = get().items.filter(i => i.productId !== productId);
    set({ items, supplierId: items.length ? get().supplierId : null, supplierName: items.length ? get().supplierName : null });
  },

  clear: () => set({ items: [], supplierId: null, supplierName: null }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
