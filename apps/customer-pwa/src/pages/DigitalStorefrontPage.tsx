import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Minus, X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  Clock, AlertCircle, ShoppingCart, MapPin, Wifi, WifiOff,
  Smartphone, Banknote, CreditCard, ArrowLeft, Star, Loader2,
  User, Check, RefreshCw, Flame, Gift, Tag, Copy, Zap, Timer,
  Wine, Coffee, Utensils, Store, ShieldCheck,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   API CONFIG
───────────────────────────────────────────── */
const getApiUrl = (path: string): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  let base = envUrl ? envUrl.trim() : 'http://localhost:5000/api/v1';
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.includes('/api/v1')) base = `${base}/api/v1`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface BrandingConfig {
  name: string;
  tagline: string;
  venueType: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  primary: string;
  primaryDark: string;
  accent: string;
  openingHours: string;
  closingHours: string;
  allowTakeaway: boolean;
  allowDineIn: boolean;
}

interface ModifierOption {
  modifierOptionUuid?: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
  isAvailable?: boolean;
}

interface ModifierGroup {
  modifierGroupUuid?: string;
  name: string;
  description?: string;
  selectionType?: 'SINGLE' | 'MULTIPLE';
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  desc: string;
  img: string | null;
  badge?: string;
  isAvailable: boolean;
  prepStation?: string;
  dietaryTags?: string[];
  modifierGroups?: ModifierGroup[];
}

interface SelectedModifier {
  groupName: string;
  optionName: string;
  priceDelta: number;
  modifierOptionUuid?: string;
}

interface CartItem {
  cartItemId: string; // unique key: itemId + serialized modifiers
  item: MenuItem;
  qty: number;
  selectedModifiers: SelectedModifier[];
  unitEffectivePrice: number;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  promoCode: string | null;
  discountValue?: number;
  offerType?: string;
  badge?: string;
  imageUrl?: string | null;
  originalPrice?: number | null;
  dealPrice?: number | null;
  productId?: string | null;
  isActive?: boolean;
}

const DEFAULT_BRAND: BrandingConfig = {
  name: 'DrinkHub Venue',
  tagline: 'Nairobi, Kenya',
  venueType: 'BAR_LOUNGE',
  logoUrl: null,
  bannerUrl: null,
  primary: '#DC2626',
  primaryDark: '#991B1B',
  accent: '#F59E0B',
  openingHours: '08:00',
  closingHours: '23:00',
  allowTakeaway: true,
  allowDineIn: true,
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export const DigitalStorefrontPage: React.FC = () => {
  const { venueSlug, tableNum } = useParams<{ venueSlug?: string; tableNum?: string }>();
  const table = tableNum ?? '';

  /* ── State ────────────────────────────────── */
  const [brand, setBrand] = useState<BrandingConfig>(DEFAULT_BRAND);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [tableUuid, setTableUuid] = useState<string | null>(null);
  const [clubUuid, setClubUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Order fulfillment mode: Dine-In vs Takeaway / Counter Pickup
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>(table ? 'DINE_IN' : 'TAKEAWAY');
  const [customerName, setCustomerName] = useState('');

  const [cat, setCat] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<string>('All');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [screen, setScreen] = useState<'menu' | 'cart' | 'checkout' | 'success'>('menu');
  const [ageOk, setAgeOk] = useState(false);
  const [payment, setPayment] = useState<'mpesa' | 'card' | 'cash'>('mpesa');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const heroRef = useRef<HTMLDivElement>(null);
  const menuSectionRef = useRef<HTMLDivElement>(null);
  const [heroOpacity, setHeroOpacity] = useState(1);

  // Customizer Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [customizerSelections, setCustomizerSelections] = useState<Record<string, string[]>>({});

  // Offers Banner Carousel
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-rotate offers
  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setActiveOfferIdx((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [offers.length]);

  // Active Order Live Tracking
  const [activeOrderUuid, setActiveOrderUuid] = useState<string | null>(() => {
    return localStorage.getItem('drinkhub_active_order_uuid') || null;
  });
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  /* ── Live Poll Order Status (every 3s) ── */
  useEffect(() => {
    if (!activeOrderUuid) return;

    let isMounted = true;
    const pollOrderStatus = async () => {
      try {
        const res = await fetch(getApiUrl(`/orders/${activeOrderUuid}`));
        if (!res.ok) return;
        const data = await res.json();
        const order = data.data?.order ?? data.data;
        if (isMounted && order) {
          setActiveOrder(order);

          if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
            setTimeout(() => {
              if (isMounted && screen === 'success') {
                setScreen('menu');
              }
            }, 6000);
          }
        }
      } catch (_e) {}
    };

    pollOrderStatus();
    const interval = setInterval(pollOrderStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrderUuid, screen]);

  // Online / offline listeners
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Parallax hero scroll effect
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setHeroOpacity(Math.max(0, 1 - top / 200));
  }, []);

  /* ── Check if venue is currently open ── */
  const isVenueOpen = useCallback((): boolean => {
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [openH, openM] = brand.openingHours.split(':').map(Number);
      const [closeH, closeM] = brand.closingHours.split(':').map(Number);

      const openMinutes = openH * 60 + (openM || 0);
      let closeMinutes = closeH * 60 + (closeM || 0);

      // Nightclub / late lounge rollover past midnight (e.g. 16:00 -> 04:00)
      if (closeMinutes < openMinutes) {
        if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
          return true;
        }
        return false;
      }

      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } catch {
      return true;
    }
  }, [brand.openingHours, brand.closingHours]);

  const venueOpen = isVenueOpen();

  /* ── Fetch Venue Data & Menu ─────────────── */
  useEffect(() => {
    if (!venueSlug) return;
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // 1. Fetch Venue Details
        const tenantRes = await fetch(getApiUrl(`/tenants/slug/${venueSlug}`));
        if (!tenantRes.ok) {
          const err = await tenantRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Venue "${venueSlug}" not found.`);
        }
        const tenantData = await tenantRes.json();
        const club = tenantData.data?.club ?? tenantData.data ?? tenantData;
        const resolvedClubUuid = club.clubUuid ?? club.uuid ?? club.id ?? null;
        setClubUuid(resolvedClubUuid);

        const fallbackLogo =
          venueSlug.toLowerCase().includes('java')
            ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200'
            : venueSlug.toLowerCase().includes('artcaffe')
            ? 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200'
            : venueSlug.toLowerCase().includes('carnivore')
            ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'
            : null;

        setBrand({
          name: club.name ?? 'DrinkHub Venue',
          tagline: club.tagline ?? club.county ?? 'Kenya',
          venueType: club.venueType ?? 'BAR_LOUNGE',
          logoUrl: club.logoUrl || fallbackLogo,
          bannerUrl: club.bannerUrl ?? null,
          primary: club.brandColor ?? club.themeColor ?? '#DC2626',
          primaryDark: adjustColor(club.brandColor ?? club.themeColor ?? '#DC2626', -20),
          accent: '#F59E0B',
          openingHours: club.openingHours ?? '08:00',
          closingHours: club.closingHours ?? '23:00',
          allowTakeaway: club.allowTakeaway !== false,
          allowDineIn: club.allowDineIn !== false,
        });

        // Resolve table UUID from venueTables array
        const tablesList: any[] = club.venueTables ?? club.tables ?? [];
        if (table && tablesList.length > 0) {
          const match = tablesList.find(
            (t: any) => String(t.tableNumber) === String(table)
          );
          if (match) setTableUuid(match.tableUuid ?? match.uuid ?? match.id ?? null);
        }

        // 2. Fetch menu with X-Tenant-Id header
        const menuRes = await fetch(getApiUrl('/menu'), {
          headers: {
            ...(resolvedClubUuid ? { 'X-Tenant-Id': resolvedClubUuid } : {}),
          },
        });
        if (!menuRes.ok) throw new Error('Failed to load the menu. Please try again.');
        const menuData = await menuRes.json();

        // Flatten categories + products
        const cats: string[] = ['All'];
        const items: MenuItem[] = [];
        const rawOffers: Offer[] = [];

        const menuPayload = menuData.data ?? menuData;
        const rawCategories: any[] = menuPayload.categories ?? [];
        const rawOfferList: any[] = menuPayload.offers ?? [];

        rawCategories.forEach((catObj: any) => {
          if (catObj.name && !cats.includes(catObj.name)) cats.push(catObj.name);
          (catObj.products ?? []).forEach((p: any) => {
            items.push({
              id: p.productUuid ?? p.uuid ?? p.id,
              name: p.name,
              category: catObj.name,
              price: Number(p.price),
              desc: p.description ?? '',
              img: p.imageUrl ?? null,
              badge: p.badge ?? undefined,
              isAvailable: p.isAvailable !== false,
              prepStation: p.prepStation || 'GENERAL',
              dietaryTags: p.dietaryTags || [],
              modifierGroups: (p.modifierGroups || []).map((mg: any) => ({
                modifierGroupUuid: mg.modifierGroupUuid,
                name: mg.name,
                description: mg.description,
                selectionType: mg.selectionType,
                isRequired: mg.isRequired,
                minSelections: mg.minSelections,
                maxSelections: mg.maxSelections,
                options: (mg.options || []).map((opt: any) => ({
                  modifierOptionUuid: opt.modifierOptionUuid,
                  name: opt.name,
                  priceDelta: Number(opt.priceDelta || 0),
                  isDefault: opt.isDefault,
                  isAvailable: opt.isAvailable !== false,
                })),
              })),
            });
          });
        });

        rawOfferList.forEach((o: any) => {
          if (o.isActive !== false) {
            rawOffers.push({
              id: o.offerUuid ?? o.uuid ?? o.id,
              title: o.title,
              description: o.description,
              promoCode: o.promoCode,
              discountValue: Number(o.discountValue || 0),
              offerType: o.offerType,
              imageUrl: o.imageUrl,
              originalPrice: o.originalPrice ? Number(o.originalPrice) : null,
              dealPrice: o.dealPrice ? Number(o.dealPrice) : null,
              productId: o.productId,
            });
          }
        });

        if (rawOffers.length > 0) {
          cats.splice(1, 0, '🔥 Deals');
        }

        if (isMounted) {
          setCategories(cats);
          setMenuItems(items);
          setOffers(rawOffers);
        }
      } catch (err: any) {
        if (isMounted) setLoadError(err.message || 'Failed to connect to DrinkHub.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [venueSlug, table]);

  /* ── Get Match Offer For Item ─────────────── */
  const getOfferForItem = useCallback((item: MenuItem): Offer | null => {
    return offers.find((o) => {
      if (o.productId && o.productId === item.id) return true;
      if (o.title.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(o.title.toLowerCase())) {
        return true;
      }
      return false;
    }) ?? null;
  }, [offers]);

  /* ── Customizer / Modifiers Helpers ───────── */
  const openCustomizer = (item: MenuItem) => {
    const initialSelections: Record<string, string[]> = {};
    (item.modifierGroups || []).forEach((group) => {
      const defaultOpt = group.options.find((opt) => opt.isDefault) || (group.isRequired && group.options[0]);
      if (defaultOpt) {
        initialSelections[group.name] = [defaultOpt.name];
      } else {
        initialSelections[group.name] = [];
      }
    });
    setCustomizerSelections(initialSelections);
    setCustomizingItem(item);
  };

  const toggleOption = (group: ModifierGroup, optName: string) => {
    setCustomizerSelections((prev) => {
      const current = prev[group.name] || [];
      if (group.selectionType === 'SINGLE') {
        return { ...prev, [group.name]: [optName] };
      }
      // MULTIPLE
      const exists = current.includes(optName);
      const next = exists ? current.filter((n) => n !== optName) : [...current, optName];
      return { ...prev, [group.name]: next };
    });
  };

  const getCustomizedPrice = (): number => {
    if (!customizingItem) return 0;
    let total = customizingItem.price;
    (customizingItem.modifierGroups || []).forEach((group) => {
      const selected = customizerSelections[group.name] || [];
      group.options.forEach((opt) => {
        if (selected.includes(opt.name)) {
          total += opt.priceDelta;
        }
      });
    });
    return total;
  };

  const saveCustomizedItemToCart = () => {
    if (!customizingItem) return;

    const selectedMods: SelectedModifier[] = [];
    (customizingItem.modifierGroups || []).forEach((group) => {
      const selected = customizerSelections[group.name] || [];
      group.options.forEach((opt) => {
        if (selected.includes(opt.name)) {
          selectedMods.push({
            groupName: group.name,
            optionName: opt.name,
            priceDelta: opt.priceDelta,
            modifierOptionUuid: opt.modifierOptionUuid,
          });
        }
      });
    });

    const key = `${customizingItem.id}-${JSON.stringify(selectedMods.map((m) => m.optionName).sort())}`;
    const unitPrice = getCustomizedPrice();

    setCart((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: {
          cartItemId: key,
          item: customizingItem,
          qty: (existing?.qty || 0) + 1,
          selectedModifiers: selectedMods,
          unitEffectivePrice: unitPrice,
        },
      };
    });

    setCustomizingItem(null);
  };

  /* ── Quick Add / Dec / Cart helpers ───────── */
  const handleQuickAdd = (item: MenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      openCustomizer(item);
      return;
    }
    const key = item.id;
    setCart((prev) => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: {
          cartItemId: key,
          item,
          qty: (existing?.qty || 0) + 1,
          selectedModifiers: [],
          unitEffectivePrice: item.price,
        },
      };
    });
  };

  const decCartItem = (key: string) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: { ...existing, qty: existing.qty - 1 },
      };
    });
  };

  const addCartItem = (key: string) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: { ...existing, qty: existing.qty + 1 },
      };
    });
  };

  /* ── Filtered items ───────────────────────── */
  const filtered = menuItems.filter((item) => {
    // 1. Category check
    const matchCat =
      cat === 'All'
        ? true
        : cat === '🔥 Deals' || cat === 'Offers' || cat === 'Deals'
        ? getOfferForItem(item) !== null || item.category === '🔥 Deals'
        : item.category === cat;

    // 2. Dietary filter check
    const matchDietary =
      dietaryFilter === 'All'
        ? true
        : (item.dietaryTags || []).includes(dietaryFilter);

    return matchCat && matchDietary;
  });

  const cartCount = Object.values(cart).reduce((sum, c) => sum + c.qty, 0);
  const cartSubtotal = Object.values(cart).reduce((sum, c) => sum + (c.unitEffectivePrice * c.qty), 0);
  const cartFinalTotal = cartSubtotal;

  /* ── Place order ──────────────────────────── */
  const placeOrder = async () => {
    if (!isOnline) return;
    if (!ageOk && brand.venueType === 'NIGHTCLUB') return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const items = Object.values(cart).map((c) => ({
        productUuid: c.item.id,
        quantity: c.qty,
        modifiers: c.selectedModifiers,
      }));

      let formattedPhone: string | undefined = undefined;
      if (phone) {
        const cleanDigits = phone.replace(/\D/g, '');
        formattedPhone = cleanDigits.startsWith('254')
          ? `+${cleanDigits}`
          : cleanDigits.startsWith('0')
            ? `+254${cleanDigits.slice(1)}`
            : `+254${cleanDigits}`;
      }

      const body: Record<string, any> = {
        ...(clubUuid ? { clubUuid } : {}),
        orderType,
        customerName: customerName || undefined,
        ageVerified: true,
        items,
        paymentMethod: payment.toUpperCase(),
      };
      if (orderType === 'DINE_IN' && tableUuid) body.tableUuid = tableUuid;
      if (formattedPhone) body.phoneNumber = formattedPhone;

      const res = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clubUuid ? { 'X-Tenant-Id': clubUuid } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed to place order.');

      const placedOrder = data.data?.order ?? data.data;
      const resolvedUuid = placedOrder.orderUuid ?? placedOrder.uuid ?? placedOrder.id;
      setActiveOrderUuid(resolvedUuid);
      setActiveOrder(placedOrder);
      localStorage.setItem('drinkhub_active_order_uuid', resolvedUuid);
      setCart({});
      setScreen('success');
    } catch (err: any) {
      setPlaceError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  /* ────── OFFLINE GUARD ────── */
  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center" style={{ background: 'var(--bg)' }}>
        <WifiOff className="w-14 h-14 opacity-40" />
        <div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>No Internet Connection</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Please connect to Wi-Fi or mobile data to browse the menu and place orders.</p>
        </div>
      </div>
    );
  }

  /* ────── LOADING STATE ────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading live menu…</p>
      </div>
    );
  }

  /* ────── LOAD ERROR STATE ────── */
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center" style={{ background: 'var(--bg)' }}>
        <AlertCircle className="w-14 h-14 text-red-400" />
        <div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Unable to Load Menu</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{loadError}</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary px-6 py-3 text-sm font-bold" style={{ background: 'var(--primary)' }}>
          Try Again
        </button>
      </div>
    );
  }

  /* ────── SUCCESS / LIVE ORDER STATUS SCREEN ────── */
  if (screen === 'success') {
    const currentStatus = activeOrder?.status || 'PENDING';
    const isTakeaway = activeOrder?.orderType === 'TAKEAWAY' || activeOrder?.orderType === 'COUNTER_PICKUP';
    const pickupNumber = activeOrder?.pickupNumber || '#A101';
    const stepIndex =
      currentStatus === 'CLAIMED' ? 1 :
      currentStatus === 'PREPARING' ? 2 :
      currentStatus === 'READY' ? 3 :
      (currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED') ? 4 : 0;

    const orderItemsList = activeOrder?.orderItems ?? [];
    const displayTable = activeOrder?.table?.tableNumber ?? table;

    return (
      <div className="min-h-screen flex flex-col justify-between py-6 px-4 fade-up" style={{ background: 'var(--bg)' }}>
        <div className="max-w-md mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setScreen('menu')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
            </button>
            <div className="text-right">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Live Kitchen/Barista Stream
              </span>
            </div>
          </div>

          {/* ── TRACKER CARD ── */}
          <div className="card p-6 rounded-2xl border space-y-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-center space-y-2">
              {isTakeaway && (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="text-xs font-bold uppercase tracking-wider">Pickup Ticket</span>
                  <strong className="text-lg font-black text-amber-400">{pickupNumber}</strong>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                {currentStatus === 'PENDING' ? 'Order Received · Queued' :
                 currentStatus === 'CLAIMED' ? 'Claimed by Server / Barista' :
                 currentStatus === 'PREPARING' ? 'Preparing Your Items' :
                 currentStatus === 'READY' ? (isTakeaway ? 'Ready for Pickup at Counter!' : 'Ready for Table Delivery') :
                 'Order Complete · Enjoy! 🎉'}
              </div>

              <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
                {activeOrder?.orderNumber ? `Order #${activeOrder.orderNumber}` : 'Order Status'}
              </h2>

              {!isTakeaway && displayTable && (
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Table #{displayTable}
                </p>
              )}
            </div>

            {/* Stepper Component */}
            <div className="py-4 px-2">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-[22px] left-6 right-6 h-0.5 -translate-y-1/2 bg-slate-700/60 -z-0" />
                <div
                  className="absolute top-[22px] left-6 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-700 -z-0"
                  style={{
                    width: stepIndex <= 1 ? '0%' : stepIndex === 2 ? '33%' : stepIndex === 3 ? '66%' : 'calc(100% - 48px)',
                  }}
                />

                {[
                  { num: 1, label: 'QUEUED' },
                  { num: 2, label: 'PREPARING' },
                  { num: 3, label: 'READY' },
                  { num: 4, label: isTakeaway ? 'PICKED UP' : 'SERVED' },
                ].map(({ num, label }) => {
                  const isReached = stepIndex >= num;
                  const isCurrent = stepIndex === num;
                  return (
                    <div key={num} className="flex flex-col items-center gap-2 z-10">
                      <div
                        className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isReached
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-slate-800 border-2 border-slate-700 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-blue-500/30 scale-105' : ''}`}
                      >
                        {num}
                      </div>
                      <span
                        className={`text-[10px] font-black tracking-wider transition-colors uppercase ${
                          isReached ? 'text-blue-500' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Order Summary Card ── */}
          <div className="card p-5 text-left space-y-3 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ordered Items</p>
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {orderItemsList.map((item: any, idx: number) => (
                <div key={idx} className="space-y-0.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.quantity}× {item.product?.name ?? item.name ?? 'Item'}
                    </span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>
                      KES {Number(item.subtotal ?? (item.unitPrice ? item.unitPrice * item.quantity : 0)).toLocaleString()}
                    </span>
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-[11px] text-amber-400/90 pl-3">
                      ↳ {item.modifiers.map((m: any) => `${m.optionName}`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3 border-t font-bold" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total Amount</span>
              <span className="text-base font-black" style={{ color: brand.accent }}>
                KES {Number(activeOrder?.totalAmount ?? cartFinalTotal).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setScreen('menu')}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: brand.primary }}
            >
              <Plus className="w-4 h-4" /> Browse Menu / Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────── CHECKOUT SCREEN ────── */
  if (screen === 'checkout') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 border-b" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <button onClick={() => setScreen('cart')} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text)' }} />
          </button>
          <div>
            <h2 className="font-black text-base leading-none" style={{ color: 'var(--text)' }}>Checkout</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {orderType === 'DINE_IN' ? (table ? `Table #${table}` : 'Dine-In Table') : 'Takeaway / Counter Pickup'}
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          {/* Order Mode Pill Selector */}
          {brand.allowTakeaway && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Type</p>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    orderType === 'DINE_IN'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Dine-In Table {table ? `#${table}` : ''}</span>
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Takeaway / Pickup</span>
                </button>
              </div>
            </div>
          )}

          {/* Customer Name for Takeaway */}
          {orderType === 'TAKEAWAY' && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Customer Name (For Pickup Call)</p>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <User className="w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="e.g. Sarah K."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            </div>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'mpesa', label: 'M-Pesa STK', icon: <Smartphone className="w-5 h-5" /> },
                { key: 'card', label: 'Card POS', icon: <CreditCard className="w-5 h-5" /> },
                { key: 'cash', label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setPayment(key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all"
                  style={{
                    background: payment === key ? `${brand.primary}15` : 'var(--surface)',
                    borderColor: payment === key ? brand.primary : 'var(--border)',
                    color: payment === key ? brand.primary : 'var(--text-secondary)',
                  }}
                >
                  {icon}
                  <span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* M-Pesa phone */}
          {payment === 'mpesa' && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>M-Pesa Mobile Number</p>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>+254</span>
                <input
                  type="tel"
                  placeholder="7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: 'var(--text)' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You will receive an instant Safaricom PIN prompt on your phone.</p>
            </div>
          )}

          {/* Order summary */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Items</p>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
              {Object.values(cart).map((c) => (
                <div key={c.cartItemId} className="space-y-0.5">
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{c.qty}× {c.item.name}</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>KES {(c.unitEffectivePrice * c.qty).toLocaleString()}</span>
                  </div>
                  {c.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-amber-400 pl-3">
                      ↳ {c.selectedModifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-3 border-t font-bold" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total Payable</span>
              <span style={{ color: brand.accent }}>KES {cartFinalTotal.toLocaleString()}</span>
            </div>
          </div>

          {brand.venueType === 'NIGHTCLUB' && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                I confirm I am <strong style={{ color: 'var(--text)' }}>over 18 years old</strong>.
              </span>
            </label>
          )}

          {placeError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {placeError}
            </div>
          )}

          <button
            disabled={placing || !venueOpen || (payment === 'mpesa' && phone.length < 9)}
            onClick={placeOrder}
            className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2 text-white"
            style={{ background: brand.primary }}
          >
            {placing ? 'Placing Order…' : `Confirm Order · KES ${cartFinalTotal.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  }

  /* ────── CART SCREEN ────── */
  if (screen === 'cart') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 border-b" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <button onClick={() => setScreen('menu')} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text)' }} />
          </button>
          <div>
            <h2 className="font-black text-base leading-none" style={{ color: 'var(--text)' }}>Your Order</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-3 pb-40">
          <div className="max-h-[58vh] overflow-y-auto space-y-3 pr-1 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
            {Object.values(cart).map((c) => (
              <div key={c.cartItemId} className="card flex items-center gap-4 p-4">
                {c.item.img
                  ? <img src={c.item.img} alt={c.item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: 'var(--surface-2)' }}>☕</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{c.item.name}</p>
                  {c.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-amber-400 truncate">
                      {c.selectedModifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}
                  <span className="font-black text-sm block mt-1" style={{ color: brand.accent }}>
                    KES {(c.unitEffectivePrice * c.qty).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => decCartItem(c.cartItemId)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <Minus className="w-4 h-4" style={{ color: 'var(--text)' }} />
                  </button>
                  <span className="w-5 text-center font-black text-sm" style={{ color: 'var(--text)' }}>{c.qty}</span>
                  <button onClick={() => addCartItem(c.cartItemId)} className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: brand.primary }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 p-4 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Total</span>
              <span className="text-xl font-black" style={{ color: brand.accent }}>KES {cartFinalTotal.toLocaleString()}</span>
            </div>
            <button onClick={() => setScreen('checkout')} className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2 text-white" style={{ background: brand.primary }}>
              Continue to Checkout <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ────── MENU SCREEN (MAIN) ────── */
  return (
    <div className="h-screen overflow-y-auto pb-28" onScroll={handleScroll} style={{ background: 'var(--bg)', scrollbarWidth: 'none' }}>

      {/* ── HERO BANNER ─────────────────────── */}
      <div ref={heroRef} className="relative h-56 overflow-hidden">
        {brand.bannerUrl
          ? <img
              src={brand.bannerUrl}
              alt={brand.name}
              className="w-full h-full object-cover"
              style={{ opacity: heroOpacity, transform: `scale(${1 + (1 - heroOpacity) * 0.08})`, transition: 'transform 0.05s linear' }}
            />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${brand.primary}CC 0%, ${brand.primaryDark} 100%)` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.85) 70%, rgba(10,10,15,1) 100%)' }} />

        {/* Top bar with DrinkHub Emblem & Venue Type */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5 backdrop-blur-md border shadow-lg" style={{ background: 'rgba(10,10,15,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
              {brand.venueType === 'COFFEE_SHOP' || brand.venueType === 'CAFE' ? (
                <Coffee className="w-3.5 h-3.5 text-white" />
              ) : brand.venueType === 'RESTAURANT' ? (
                <Utensils className="w-3.5 h-3.5 text-white" />
              ) : (
                <Wine className="w-3.5 h-3.5 text-white" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs tracking-wider text-white">Drink<span className="text-amber-400">Hub</span></span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {brand.venueType.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Open/closed indicator */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase backdrop-blur-md shadow-lg" style={{ background: 'rgba(10,10,15,0.7)', color: venueOpen ? '#34D399' : '#F87171', border: `1px solid ${venueOpen ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
            <span className={`w-1.5 h-1.5 rounded-full ${venueOpen ? 'bg-emerald-400 animate-ping' : 'bg-red-400'} inline-block`} />
            {venueOpen ? 'Open Now' : 'Closed'}
          </div>
        </div>

        {/* Venue Identity Row */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 shadow-xl flex-shrink-0 bg-slate-900" style={{ borderColor: 'rgba(255,255,255,0.25)' }}>
                <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white border-2 shadow-xl flex-shrink-0 bg-gradient-to-tr from-amber-600 to-rose-600">
                {brand.name.charAt(0) || 'D'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-white leading-none">{brand.name}</h1>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-2.5 h-2.5" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3 h-3 opacity-60 text-amber-400" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{brand.tagline}</span>
              </div>
            </div>
          </div>

          {table && (
            <div className="rounded-2xl px-3.5 py-2 text-center shadow-lg border border-white/10" style={{ background: brand.primary }}>
              <p className="text-[9px] font-black uppercase opacity-80 text-white leading-none tracking-wider">Table</p>
              <p className="text-lg font-black text-white leading-tight">#{table}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE ORDER BANNER ── */}
      {activeOrder && activeOrder.status !== 'CANCELLED' && (
        <div className="px-4 pt-3 fade-up">
          <div
            onClick={() => setScreen('success')}
            className="rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] shadow-lg border"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.1) 100%)',
              borderColor: 'rgba(37,99,235,0.4)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-600/30 text-blue-400">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {activeOrder.status}
                  </span>
                  <p className="text-xs font-bold text-white">
                    {activeOrder.orderNumber ? `Order #${activeOrder.orderNumber}` : 'Active Order'}
                  </p>
                </div>
                <p className="text-[11px] mt-0.5 text-blue-200">
                  {activeOrder.status === 'PENDING' ? 'Kitchen / Barista preparing your order...' :
                   activeOrder.status === 'READY' ? 'Order ready for pickup!' : 'Order in progress'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
              <span>Track Live</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* ── DIETARY FILTER PILLS ── */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: 'All', label: 'All Diets' },
            { key: 'VEGETARIAN', label: '🥗 Vegetarian' },
            { key: 'VEGAN', label: '🌱 100% Vegan' },
            { key: 'GLUTEN_FREE', label: '🌾 Gluten-Free' },
            { key: 'HALAL', label: '✨ Halal' },
            { key: 'SPICY', label: '🌶️ Spicy' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDietaryFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                dietaryFilter === key
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CATEGORY PILLS ───────────────────── */}
      <div ref={menuSectionRef} className="px-4 pt-2 pb-1 fade-up-delay-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: cat === c ? brand.primary : 'var(--surface)',
                color: cat === c ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${cat === c ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU ITEMS ───────────────────────── */}
      <div className="px-4 pt-3 space-y-3 fade-up-delay-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </p>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No items found in this category or dietary filter.</p>
          </div>
        )}

        {filtered.filter((i) => i.isAvailable).map((item) => {
          const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;
          return (
            <div key={item.id} className="card flex items-center gap-4 p-4 transition-all active:scale-[0.98]">
              <div className="relative flex-shrink-0">
                {item.img
                  ? <img src={item.img} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                  : <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl" style={{ background: 'var(--surface)' }}>
                      {item.prepStation === 'BARISTA' ? '☕' : item.prepStation === 'KITCHEN' ? '🍳' : '🍸'}
                    </div>
                }
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                </div>
                {item.desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>}
                
                {/* Modifiers & Station Badge */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {item.prepStation && item.prepStation !== 'GENERAL' && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.prepStation}
                    </span>
                  )}
                  {hasModifiers && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Customizable
                    </span>
                  )}
                  {(item.dietaryTags || []).map((tag) => (
                    <span key={tag} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-black text-sm" style={{ color: brand.accent }}>
                    KES {item.price.toLocaleString()}
                  </span>

                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-xl shadow-md"
                    style={{ background: brand.primary }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {hasModifiers ? 'Customize' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODIFIER CUSTOMIZER MODAL ────────── */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">{customizingItem.name}</h3>
                <p className="text-xs text-slate-400">Customize size, milk, and options</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Groups */}
            <div className="space-y-4">
              {(customizingItem.modifierGroups || []).map((group) => {
                const selected = customizerSelections[group.name] || [];
                return (
                  <div key={group.name} className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-amber-400 uppercase tracking-wider">{group.name}</p>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {group.selectionType === 'SINGLE' ? 'Choose 1' : 'Optional Multi'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {group.options.map((opt) => {
                        const isChosen = selected.includes(opt.name);
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => toggleOption(group, opt.name)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                              isChosen
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span>{opt.name}</span>
                            <span className="text-amber-400 font-black">
                              {opt.priceDelta > 0 ? `+KES ${opt.priceDelta}` : 'Included'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Item Total</p>
                <p className="text-lg font-black text-amber-400">KES {getCustomizedPrice().toLocaleString()}</p>
              </div>
              <button
                onClick={saveCustomizedItemToCart}
                className="btn-primary px-6 py-3 text-sm font-black rounded-2xl text-white shadow-lg"
                style={{ background: brand.primary }}
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART BAR ────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setScreen('cart')}
            className="w-full flex items-center justify-between p-4 rounded-2xl text-white shadow-2xl font-bold transition-all active:scale-[0.97]"
            style={{ background: brand.primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: 'rgba(0,0,0,0.25)' }}>
                {cartCount}
              </div>
              <span className="text-sm font-bold block leading-tight">View Order</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">KES {cartFinalTotal.toLocaleString()}</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
};

function adjustColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
