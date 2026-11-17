import React, { createContext, useContext, useEffect, useState } from 'react';
import { calculateShopPrice } from '../lib/clubPricing';
import { API_BASE_URL, getAuthHeaders } from '../lib/firebase';
import { useAppData } from './AppDataContext';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ToastProvider';
import type { ShopOrder, ShopOrderItem, ShopProduct } from '../types/domain';

export interface CartEntry {
  product: ShopProduct;
  size: string;
  colorName?: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'camblu.shop_cart.v1';
const FAVS_STORAGE_KEY = 'camblu.shop_favs.v1';

interface ShopCartContextValue {
  cart: CartEntry[];
  favorites: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  paymentMethod: 'stripe_pix' | 'stripe_card';
  setPaymentMethod: (method: 'stripe_pix' | 'stripe_card') => void;
  submitting: boolean;
  totalItemsCount: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  addToCart: (product: ShopProduct, size: string, colorName?: string) => boolean;
  updateQuantity: (productId: string, size: string, colorName: string | undefined, delta: number) => void;
  removeFromCart: (productId: string, size: string, colorName?: string) => void;
  toggleFavorite: (product: ShopProduct) => void;
  isFavorite: (productId: string) => boolean;
  checkout: (onRequireProfile: () => void) => Promise<void>;
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const { addOrder } = useAppData();
  const { profile, signInWithGoogle, isDemoMode } = useAuth();
  const { notify } = useToast();

  const [cart, setCart] = useState<CartEntry[]>(() => loadJson<CartEntry[]>(CART_STORAGE_KEY, []));
  const [favorites, setFavorites] = useState<string[]>(() => loadJson<string[]>(FAVS_STORAGE_KEY, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe_pix' | 'stripe_card'>('stripe_pix');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVS_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore storage quota errors
    }
  }, [favorites]);

  const subtotalCents = cart.reduce((acc, item) => acc + item.product.priceCents * item.quantity, 0);
  const { totalCents, discountCents } = calculateShopPrice(
    subtotalCents,
    profile?.membershipTier || 'none',
    Boolean(profile?.membershipActive),
  );
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: ShopProduct, size: string, colorName?: string): boolean => {
    const sizeInfo = product.sizes.find((s) => s.size === size);
    if (!sizeInfo || sizeInfo.stock <= 0) {
      notify('Tamanho sem estoque no momento.', 'error');
      return false;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size && (i.colorName || '') === (colorName || ''),
      );
      if (idx >= 0) {
        const copy = [...prev];
        const nextQty = Math.min(sizeInfo.stock, copy[idx].quantity + 1);
        copy[idx] = { ...copy[idx], quantity: nextQty };
        return copy;
      }
      return [...prev, { product, size, colorName, quantity: 1 }];
    });

    const variantLabel = colorName ? `${size} · ${colorName}` : size;
    notify(`${product.name} (${variantLabel}) adicionado à sacola!`);
    return true;
  };

  const updateQuantity = (productId: string, size: string, colorName: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.product.id !== productId ||
            item.size !== size ||
            (item.colorName || '') !== (colorName || '')
          ) {
            return item;
          }
          const maxStock = item.product.sizes.find((s) => s.size === size)?.stock ?? 99;
          const nextQty = Math.min(maxStock, item.quantity + delta);
          return nextQty <= 0 ? null : { ...item, quantity: nextQty };
        })
        .filter((x): x is CartEntry => Boolean(x)),
    );
  };

  const removeFromCart = (productId: string, size: string, colorName?: string) => {
    setCart((prev) =>
      prev.filter(
        (x) =>
          !(
            x.product.id === productId &&
            x.size === size &&
            (x.colorName || '') === (colorName || '')
          ),
      ),
    );
  };

  const toggleFavorite = (product: ShopProduct) => {
    setFavorites((prev) => {
      const exists = prev.includes(product.id);
      const next = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      notify(exists ? `${product.name} removido dos favoritos.` : `${product.name} salvo nos favoritos!`, 'info');
      return next;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const checkout = async (onRequireProfile: () => void) => {
    if (cart.length === 0) return;
    if (!profile) {
      await signInWithGoogle(isDemoMode ? 'student' : undefined);
      return;
    }
    if (!profile.profileCompleted) {
      notify('Complete seu WhatsApp e CPF no Perfil antes de finalizar a compra.', 'info');
      setCartOpen(false);
      onRequireProfile();
      return;
    }

    setSubmitting(true);
    try {
      const orderItems: ShopOrderItem[] = cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        size: c.size,
        quantity: c.quantity,
        unitPriceCents: c.product.priceCents,
      }));

      const selectedColorNotes = cart
        .filter((c) => c.colorName)
        .map((c) => `${c.product.name} (${c.size}): ${c.colorName}`)
        .join(' | ');

      if (!isDemoMode) {
        const res = await fetch(`${API_BASE_URL}/checkout/shop`, {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            items: orderItems,
            paymentMethod,
          }),
        });
        if (!res.ok) throw new Error('Falha ao criar sessão de checkout.');
        const data = (await res.json()) as { checkoutUrl?: string };
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      const newOrder: ShopOrder = {
        id: `ord-${Date.now().toString(36)}`,
        buyerUid: profile.uid,
        buyerName: profile.name,
        buyerEmail: profile.email,
        buyerPhone: profile.phone,
        items: orderItems,
        subtotalCents,
        discountCents,
        totalCents,
        paymentMethod,
        paymentStatus: 'paid',
        delivered: false,
        notes: selectedColorNotes || undefined,
        createdAt: new Date().toISOString(),
      };
      await addOrder(newOrder);
      setCart([]);
      setCartOpen(false);
      notify('Pedido confirmado! A equipe do CAMBLU combinará a entrega pelo WhatsApp.');
    } catch {
      notify('Erro ao processar pedido da Lojinha.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShopCartContext.Provider
      value={{
        cart,
        favorites,
        cartOpen,
        setCartOpen,
        paymentMethod,
        setPaymentMethod,
        submitting,
        totalItemsCount,
        subtotalCents,
        discountCents,
        totalCents,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleFavorite,
        isFavorite,
        checkout,
      }}
    >
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart(): ShopCartContextValue {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used inside ShopCartProvider');
  return ctx;
}
