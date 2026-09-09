import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "mbp_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        typeof i?.product_id === "string" &&
        typeof i?.name === "string" &&
        Number.isFinite(Number(i?.unit_price)) &&
        Number.isFinite(Number(i?.quantity)),
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so SSR and the first client render match.
  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — cart stays in memory */
    }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, ...item, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product_id !== productId)
        : prev.map((i) =>
            i.product_id === productId ? { ...i, quantity: Math.floor(quantity) } : i,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = Number(
      items.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2),
    );
    return { items, count, subtotal, hydrated, add, setQuantity, remove, clear };
  }, [items, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/**
 * Currency symbol used by `formatPrice`. Kept as module state so the many
 * existing `formatPrice(value)` call sites keep working; it is set from the
 * admin-configured currency by `SettingsProvider`.
 */
let currency = "£";

export function setCurrencySymbol(symbol: string) {
  if (symbol) currency = symbol;
}

export function formatPrice(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return null;
  return `${currency}${n.toFixed(2)}`;
}


export function unitPriceOf(p: { price: string | number; sale_price: string | number | null }) {
  const sale = p.sale_price === null || p.sale_price === "" ? null : Number(p.sale_price);
  const base = Number(p.price);
  return sale !== null && !Number.isNaN(sale) && sale > 0 ? sale : base;
}
