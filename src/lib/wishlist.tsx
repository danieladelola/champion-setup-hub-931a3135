import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type WishlistItem = {
  product_id: string;
  slug: string;
  name: string;
  image_url: string | null;
  unit_price: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  hydrated: boolean;
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "mbp_wishlist_v1";
const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStorage(): WishlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is WishlistItem =>
        typeof i?.product_id === "string" &&
        typeof i?.slug === "string" &&
        typeof i?.name === "string",
    );
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — wishlist stays in memory */
    }
  }, [items, hydrated]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items],
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      const exists = items.some((i) => i.product_id === item.product_id);
      setItems((prev) =>
        prev.some((i) => i.product_id === item.product_id)
          ? prev.filter((i) => i.product_id !== item.product_id)
          : [...prev, item],
      );
      return !exists;
    },
    [items],
  );

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WishlistContextValue>(
    () => ({ items, count: items.length, hydrated, has, toggle, remove, clear }),
    [items, hydrated, has, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
