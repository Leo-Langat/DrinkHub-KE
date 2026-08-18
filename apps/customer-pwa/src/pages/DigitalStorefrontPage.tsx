import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Minus, X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  Clock, AlertCircle, ShoppingCart, MapPin, Wifi, WifiOff,
  Smartphone, Banknote, CreditCard, ArrowLeft, Star, Loader2,
  User, Check, RefreshCw, Flame, Gift, Tag, Copy, Zap, Timer,
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
  logoUrl: string | null;
  bannerUrl: string | null;
  primary: string;
  primaryDark: string;
  accent: string;
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

type CartMap = Record<string, number>;

const DEFAULT_BRAND: BrandingConfig = {
  name: 'DrinkHub Venue',
  tagline: 'Nairobi, Kenya',
  logoUrl: null,
  bannerUrl: null,
  primary: '#DC2626',
  primaryDark: '#991B1B',
  accent: '#F59E0B',
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

  const [cat, setCat] = useState<string>('All');
  const [cart, setCart] = useState<CartMap>({});
  const [screen, setScreen] = useState<'menu' | 'cart' | 'checkout' | 'success'>('menu');
  const [ageOk, setAgeOk] = useState(false);
  const [payment, setPayment] = useState<'mpesa' | 'card' | 'cash'>('mpesa');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroOpacity, setHeroOpacity] = useState(1);

  // Offers Banner Carousel
  const [activeOfferIdx, setActiveOfferIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-rotate offers every 5 seconds if multiple offers exist
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

          // Auto-dismiss and return user to menu 5 seconds after delivery confirmation
          if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
            setTimeout(() => {
              if (isMounted) {
                setActiveOrder(null);
                setActiveOrderUuid(null);
                localStorage.removeItem('drinkhub_active_order_uuid');
                setScreen('menu');
              }
            }, 5000);
          }
        }
      } catch {
        /* keep previous order state */
      }
    };

    pollOrderStatus();
    const interval = setInterval(pollOrderStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeOrderUuid]);

  /* ── Fetch venue & menu on mount ─────────── */
  useEffect(() => {
    if (!venueSlug) {
      setLoadError('No venue specified. Please scan your table QR code again.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // 1. Fetch venue branding
        const tenantRes = await fetch(getApiUrl(`/tenants/${venueSlug}`));
        if (!tenantRes.ok) {
          const err = await tenantRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Venue "${venueSlug}" not found.`);
        }
        const tenantData = await tenantRes.json();
        const club = tenantData.data?.club ?? tenantData.data ?? tenantData;
        const resolvedClubUuid = club.clubUuid ?? club.uuid ?? club.id ?? null;
        setClubUuid(resolvedClubUuid);

        setBrand({
          name: club.name ?? 'DrinkHub Venue',
          tagline: club.tagline ?? club.county ?? 'Kenya',
          logoUrl: club.logoUrl ?? null,
          bannerUrl: club.bannerUrl ?? null,
          primary: club.brandColor ?? club.themeColor ?? '#DC2626',
          primaryDark: adjustColor(club.brandColor ?? club.themeColor ?? '#DC2626', -20),
          accent: '#F59E0B',
        });

        // Resolve table UUID from venueTables/tables array
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

        rawCategories.forEach((cat: any) => {
          if (cat.name && !cats.includes(cat.name)) cats.push(cat.name);
          (cat.products ?? []).forEach((p: any) => {
            items.push({
              id: p.productUuid ?? p.uuid ?? p.id,
              name: p.name,
              category: cat.name,
              price: Number(p.price),
              desc: p.description ?? '',
              img: p.imageUrl ?? null,
              badge: p.badge ?? undefined,
              isAvailable: p.isAvailable !== false,
            });
          });
        });

        rawOfferList.forEach((o: any) => {
          if (o.isActive !== false) {
            let cleanDesc = o.description ?? '';
            let img: string | null = null;
            let badgeText: string | null = null;
            let origPrice: number | null = null;
            let dealPrice: number | null = null;
            let prodId: string | null = null;

            if (o.description && typeof o.description === 'string' && o.description.startsWith('{') && o.description.endsWith('}')) {
              try {
                const parsed = JSON.parse(o.description);
                cleanDesc = parsed.desc ?? '';
                img = parsed.imageUrl ?? null;
                badgeText = parsed.badge ?? null;
                origPrice = parsed.originalPrice ? Number(parsed.originalPrice) : null;
                dealPrice = parsed.dealPrice ? Number(parsed.dealPrice) : null;
                prodId = parsed.productId ?? null;
              } catch {}
            }

            // Fallback: match offer title with menu items to auto-attach item photo & price!
            if (!img || !origPrice) {
              const match = items.find(item =>
                o.title.toLowerCase().includes(item.name.toLowerCase()) ||
                item.name.toLowerCase().includes(o.title.toLowerCase())
              );
              if (match) {
                if (!img) img = match.img;
                if (!origPrice) origPrice = match.price;
                if (!prodId) prodId = match.id;
              }
            }

            // Fallback visuals if no custom image was set
            if (!img) {
              const t = o.title.toLowerCase();
              if (t.includes('whisky') || t.includes('whiskey') || t.includes('scotch') || t.includes('bourbon')) {
                img = 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&auto=format&fit=crop&q=80';
              } else if (t.includes('cocktail') || t.includes('sour') || t.includes('mojito') || t.includes('margarita')) {
                img = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
              } else if (t.includes('beer') || t.includes('cider') || t.includes('lager') || t.includes('draught')) {
                img = 'https://images.unsplash.com/photo-1608270190989-c5c8297b83d8?w=600&auto=format&fit=crop&q=80';
              } else if (t.includes('wine') || t.includes('champagne') || t.includes('prosecco')) {
                img = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80';
              } else if (t.includes('grill') || t.includes('rib') || t.includes('burger') || t.includes('meat') || t.includes('wings')) {
                img = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
              } else {
                img = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80';
              }
            }

            const isBogo = o.offerType === 'BUY_ONE_GET_ONE';
            const isFixed = o.offerType === 'FIXED_AMOUNT_DISCOUNT';
            const discVal = Number(o.discountValue ?? 0);
            const badge = badgeText || (isBogo
              ? '🎁 BUY 1 GET 1'
              : isFixed && discVal > 0
                ? `💰 KES ${discVal.toLocaleString()} OFF`
                : discVal > 0
                  ? `⚡ ${discVal}% OFF`
                  : '🔥 TODAY\'S SPECIAL');

            // Calculate deal price if originalPrice exists
            if (origPrice && !dealPrice) {
              if (isFixed) dealPrice = Math.max(0, origPrice - discVal);
              else if (discVal > 0 && !isBogo) dealPrice = Math.round(origPrice * (1 - discVal / 100));
              else if (isBogo) dealPrice = origPrice;
            }

            rawOffers.push({
              id: o.offerUuid ?? o.uuid ?? o.id,
              title: o.title,
              description: cleanDesc || null,
              promoCode: o.promoCode ?? null,
              discountValue: discVal,
              offerType: o.offerType,
              badge,
              imageUrl: img,
              originalPrice: origPrice,
              dealPrice: dealPrice,
              productId: prodId,
              isActive: o.isActive !== false,
            });
          }
        });

        setCategories(cats);
        setMenuItems(items);
        setOffers(rawOffers);
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueSlug, table]);

  /* ── Inject brand CSS vars ────────────────── */
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--primary', brand.primary);
    r.style.setProperty('--primary-dark', brand.primaryDark);
    r.style.setProperty('--accent', brand.accent);
  }, [brand]);

  /* ── Offer Matcher & Item Pricing Helper ──── */
  const getOfferForItem = useCallback((item: MenuItem): Offer | null => {
    if (!offers || offers.length === 0) return null;
    // 1. Direct productId match
    const directMatch = offers.find(o => o.productId === item.id);
    if (directMatch) return directMatch;

    // 2. Name / title match
    const itName = item.name.toLowerCase().trim();
    const nameMatch = offers.find(o => {
      const offTitle = o.title.toLowerCase().trim();
      return offTitle.includes(itName) || itName.includes(offTitle);
    });
    if (nameMatch) return nameMatch;

    return null;
  }, [offers]);

  const getItemPricing = useCallback((item: MenuItem, quantity: number = 1) => {
    const offer = getOfferForItem(item);
    if (!offer) {
      return {
        originalPrice: item.price,
        unitPrice: item.price,
        totalPrice: item.price * quantity,
        discountAmount: 0,
        offer: null,
        isBogo: false,
      };
    }

    const isBogo = offer.offerType === 'BUY_ONE_GET_ONE';
    const isFixed = offer.offerType === 'FIXED_AMOUNT_DISCOUNT';
    const discVal = Number(offer.discountValue || 0);

    let unitPrice = item.price;
    let totalPrice = item.price * quantity;
    let discountAmount = 0;

    if (isBogo) {
      // Buy 1 Get 1 Free: customer pays for ceil(quantity / 2)
      const billableQty = Math.ceil(quantity / 2);
      totalPrice = item.price * billableQty;
      discountAmount = (item.price * quantity) - totalPrice;
      unitPrice = quantity > 1 ? Math.round(totalPrice / quantity) : item.price;
    } else if (isFixed && discVal > 0) {
      unitPrice = Math.max(0, item.price - discVal);
      totalPrice = unitPrice * quantity;
      discountAmount = (item.price - unitPrice) * quantity;
    } else if (discVal > 0) {
      unitPrice = Math.round(item.price * (1 - discVal / 100));
      totalPrice = unitPrice * quantity;
      discountAmount = (item.price - unitPrice) * quantity;
    }

    return {
      originalPrice: item.price,
      unitPrice,
      totalPrice,
      discountAmount,
      offer,
      isBogo,
    };
  }, [getOfferForItem]);

  /* ── Cart helpers ─────────────────────────── */
  const filtered = cat === 'All' ? menuItems : menuItems.filter((m) => m.category === cat);
  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);

  const cartCalculations = Object.entries(cart).map(([id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    if (!item) return null;
    const pricing = getItemPricing(item, qty);
    return {
      item,
      qty,
      ...pricing,
    };
  }).filter(Boolean) as {
    item: MenuItem;
    qty: number;
    originalPrice: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount: number;
    offer: Offer | null;
    isBogo: boolean;
  }[];

  const cartSubtotal = cartCalculations.reduce((s, c) => s + (c.originalPrice * c.qty), 0);
  const cartTotalDiscount = cartCalculations.reduce((s, c) => s + c.discountAmount, 0);
  const cartFinalTotal = Math.max(0, cartSubtotal - cartTotalDiscount);
  const appliedOffer = cartCalculations.find(c => c.offer)?.offer ?? null;

  const add = (id: string) => setCart((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const dec = (id: string) => setCart((p) => {
    if ((p[id] ?? 0) <= 1) { const c = { ...p }; delete c[id]; return c; }
    return { ...p, [id]: p[id] - 1 };
  });

  /* ── Place order (real API) ───────────────── */
  const placeOrder = async () => {
    if (!isOnline) return;
    if (!ageOk) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const items = Object.entries(cart).map(([productUuid, quantity]) => ({ productUuid, quantity }));
      
      let formattedPhone: string | undefined = undefined;
      if (payment === 'mpesa' && phone) {
        const cleanDigits = phone.replace(/\D/g, '');
        formattedPhone = cleanDigits.startsWith('254')
          ? `+${cleanDigits}`
          : cleanDigits.startsWith('0')
            ? `+254${cleanDigits.slice(1)}`
            : `+254${cleanDigits}`;
      }

      const body: Record<string, any> = {
        ...(clubUuid ? { clubUuid } : {}),
        ageVerified: true,
        items,
        paymentMethod: payment.toUpperCase(),
      };
      if (tableUuid) body.tableUuid = tableUuid;
      if (formattedPhone) body.phoneNumber = formattedPhone;
      if (appliedOffer) body.offerUuid = appliedOffer.id;

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
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading menu…</p>
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
                Live Updates Active
              </span>
            </div>
          </div>

          {/* ── 4-STEP TRACKER CARD (Exact Image Design) ── */}
          <div className="card p-6 rounded-2xl border space-y-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            
            {/* Status Pulse Banner */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                {currentStatus === 'PENDING' ? 'Order Placed · Awaiting Waiter' :
                 currentStatus === 'CLAIMED' ? 'Order Claimed by Waiter' :
                 currentStatus === 'PREPARING' ? 'Drinks & Food In Preparation' :
                 currentStatus === 'READY' ? 'Order Ready for Delivery' :
                 'Order Delivered · Cheers! 🥂'}
              </div>
              <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
                {activeOrder?.orderNumber ? `Order #${activeOrder.orderNumber}` : 'Order Status'}
              </h2>
              {displayTable && (
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Table #{displayTable}
                </p>
              )}
            </div>

            {/* ── Exact 4-Step Stepper Component from Uploaded Image ── */}
            <div className="py-4 px-2">
              <div className="flex items-center justify-between relative">
                {/* Background Line */}
                <div className="absolute top-[22px] left-6 right-6 h-0.5 -translate-y-1/2 bg-slate-700/60 -z-0" />
                
                {/* Active Progress Fill Line */}
                <div 
                  className="absolute top-[22px] left-6 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-700 -z-0"
                  style={{
                    width: stepIndex <= 1 ? '0%' : stepIndex === 2 ? '33%' : stepIndex === 3 ? '66%' : 'calc(100% - 48px)',
                  }}
                />

                {[
                  { num: 1, label: 'CLAIMED' },
                  { num: 2, label: 'PREPARING' },
                  { num: 3, label: 'READY' },
                  { num: 4, label: 'DELIVERED' },
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

            {/* Waiter Info if assigned */}
            {activeOrder?.waiter && (
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-blue-500/5 border-blue-500/20 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Assigned Waiter</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{activeOrder.waiter.fullName}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Card ── */}
          <div className="card p-5 text-left space-y-3 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ordered Items</p>

            {/* Applied offer banner on receipt */}
            {activeOrder?.offer && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#F59E0B', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Flame className="w-3.5 h-3.5 flex-shrink-0" />
                Deal Applied: {activeOrder.offer.title}
              </div>
            )}

            {orderItemsList.length > 0 ? (
              orderItemsList.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.quantity}× {item.product?.name ?? item.name ?? 'Drink / Food Item'}
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text)' }}>
                    KES {Number(item.subtotal ?? (item.unitPrice ? item.unitPrice * item.quantity : 0)).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{qty}× {item.name}</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>KES {(item.price * qty).toLocaleString()}</span>
                  </div>
                );
              })
            )}

            {/* Discount row on receipt */}
            {Number(activeOrder?.discountAmount) > 0 && (
              <div className="flex justify-between items-center text-sm border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold text-emerald-400">Discount Applied</span>
                <span className="font-black text-emerald-400">-KES {Number(activeOrder.discountAmount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t font-bold" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total Amount</span>
              <span className="text-base font-black" style={{ color: brand.accent }}>
                KES {Number(activeOrder?.totalAmount ?? cartFinalTotal).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setScreen('menu')}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: brand.primary }}
            >
              <Plus className="w-4 h-4" /> Browse Menu / Order More
            </button>
            {stepIndex === 4 && (
              <button
                onClick={() => {
                  localStorage.removeItem('drinkhub_active_order_uuid');
                  setActiveOrderUuid(null);
                  setActiveOrder(null);
                  setScreen('menu');
                }}
                className="w-full py-3 text-xs font-semibold rounded-xl border text-slate-300 hover:bg-slate-800 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                Start a New Order
              </button>
            )}
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
            {table && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Table #{table}</p>}
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          {/* Payment method */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'mpesa', label: 'M-Pesa', icon: <Smartphone className="w-5 h-5" /> },
                { key: 'card', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
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
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>M-Pesa Number</p>
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
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You'll receive an STK Push prompt on this number.</p>
            </div>
          )}

          {payment === 'card' && (
            <div className="rounded-2xl border p-4 space-y-1" style={{ background: 'var(--surface)', borderColor: 'rgba(251,191,36,0.3)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-400">POS Machine Required</p>
              </div>
              <p className="text-xs pl-6" style={{ color: 'var(--text-secondary)' }}>
                {table ? `Your waiter will bring the POS terminal to Table #${table}.` : 'Your waiter will bring the POS terminal to you.'}
              </p>
            </div>
          )}

          {/* Order summary */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Summary</p>

            {/* Active offer banner in checkout */}
            {appliedOffer && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#F59E0B', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Flame className="w-3.5 h-3.5 flex-shrink-0" />
                {appliedOffer.badge || appliedOffer.title} — Deal Active!
              </div>
            )}

            {cartCalculations.map((c) => (
              <div key={c.item.id} className="space-y-0.5">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{c.qty}× {c.item.name}</span>
                  <div className="text-right">
                    {c.discountAmount > 0 && (
                      <span className="text-xs line-through block" style={{ color: 'var(--text-muted)' }}>KES {(c.originalPrice * c.qty).toLocaleString()}</span>
                    )}
                    <span className="font-bold" style={{ color: c.discountAmount > 0 ? '#F59E0B' : 'var(--text)' }}>KES {c.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                {c.offer && (
                  <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#34D399' }}>
                    <Tag className="w-2.5 h-2.5" />
                    {c.isBogo ? 'Buy 1 Get 1 Free' : c.offer.badge || c.offer.title}
                  </div>
                )}
              </div>
            ))}

            {cartTotalDiscount > 0 && (
              <div className="flex justify-between items-center text-sm border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold text-emerald-400">🎉 You're saving</span>
                <span className="font-black text-emerald-400">-KES {cartTotalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t font-bold" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span style={{ color: brand.accent }}>KES {cartFinalTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* 18+ */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="mt-0.5 flex-shrink-0" />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              I confirm I am <strong style={{ color: 'var(--text)' }}>over 18 years old</strong> and will provide valid identification upon request.
            </span>
          </label>

          {placeError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {placeError}
            </div>
          )}

          <button
            disabled={!ageOk || placing || (payment === 'mpesa' && phone.length < 9)}
            onClick={placeOrder}
            className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2 text-white"
            style={{ background: ageOk ? brand.primary : undefined }}
          >
            {placing ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                </svg>
                Placing Order…
              </span>
            ) : (
              <>Confirm Order · KES {cartFinalTotal.toLocaleString()}</>
            )}
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
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{table ? `Table #${table} · ` : ''}{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-3 pb-40">
          {/* Active offer banner in cart */}
          {appliedOffer && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold" style={{ background: 'rgba(251,191,36,0.12)', color: '#F59E0B', border: '1px solid rgba(251,191,36,0.3)' }}>
              <Flame className="w-4 h-4 flex-shrink-0" />
              <span>{appliedOffer.badge || appliedOffer.title} — Active!</span>
            </div>
          )}

          {cartCalculations.map((c) => (
            <div key={c.item.id} className="card flex items-center gap-4 p-4">
              {c.item.img
                ? <img src={c.item.img} alt={c.item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: 'var(--surface-2)' }}>🍸</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{c.item.name}</p>
                {c.offer && (
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold" style={{ color: '#34D399' }}>
                    <Tag className="w-2.5 h-2.5" />
                    {c.isBogo ? 'Buy 1 Get 1 Free' : c.offer.badge || c.offer.title}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {c.discountAmount > 0 && (
                    <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>KES {(c.originalPrice * c.qty).toLocaleString()}</span>
                  )}
                  <span className="font-black text-sm" style={{ color: c.discountAmount > 0 ? '#F59E0B' : brand.accent }}>KES {c.totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => dec(c.item.id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Minus className="w-4 h-4" style={{ color: 'var(--text)' }} />
                </button>
                <span className="w-5 text-center font-black text-sm" style={{ color: 'var(--text)' }}>{c.qty}</span>
                <button onClick={() => add(c.item.id)} className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: brand.primary }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 inset-x-0 p-4 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-md mx-auto space-y-2">
            {cartTotalDiscount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-emerald-400">🎉 Savings</span>
                <span className="font-black text-emerald-400">-KES {cartTotalDiscount.toLocaleString()}</span>
              </div>
            )}
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
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

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

        {/* Online status chip */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.45)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Open Now
          </div>
        </div>

        {/* Club identity row */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl
              ? <img src={brand.logoUrl} alt={brand.name} className="w-14 h-14 rounded-2xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
              : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2" style={{ background: brand.primary, borderColor: 'rgba(255,255,255,0.15)' }}>🍸</div>
            }
            <div>
              <h1 className="text-xl font-black text-white leading-none">{brand.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3 opacity-50" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.tagline}</span>
              </div>
            </div>
          </div>
          {/* Table badge */}
          {table && (
            <div className="rounded-2xl px-3 py-2 text-center" style={{ background: brand.primary }}>
              <p className="text-[9px] font-bold uppercase opacity-80 text-white leading-none">Table</p>
              <p className="text-lg font-black text-white leading-tight">#{table}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── LIVE ACTIVE ORDER STATUS BANNER ── */}
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
                  {activeOrder.status === 'PENDING' ? 'Waiting for waiter to claim...' :
                   activeOrder.status === 'CLAIMED' ? (activeOrder.waiter ? `Claimed by ${activeOrder.waiter.fullName}` : 'Claimed by waiter') :
                   activeOrder.status === 'PREPARING' ? 'Preparing drinks & food...' :
                   activeOrder.status === 'READY' ? 'Ready for pickup & delivery' :
                   'Delivered to your table ✓'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
              {activeOrder.status !== 'DELIVERED' && (
                <>
                  <span>View Tracker</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FUTURISTIC MOVING SPECIAL DEALS & OFFERS BANNER ─────────────────────── */}
      {offers.length > 0 && (
        <div className="px-4 pt-4 fade-up">
          <div
            className="group relative overflow-hidden rounded-3xl border transition-all duration-500 shadow-2xl"
            style={{
              borderColor: 'rgba(245, 158, 11, 0.45)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.92) 50%, rgba(15, 23, 42, 0.98) 100%)',
              boxShadow: '0 8px 32px -4px rgba(245, 158, 11, 0.25), 0 0 20px 0 rgba(239, 68, 68, 0.15)',
            }}
          >
            {/* Ambient cyber neon glow & particle shimmer backdrop */}
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-40 animate-pulse"
              style={{ background: 'radial-gradient(circle, #F59E0B 0%, #EC4899 50%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-30 animate-pulse"
              style={{ background: 'radial-gradient(circle, #3B82F6 0%, #8B5CF6 50%, transparent 70%)', animationDelay: '1.5s' }}
            />

            {/* Top Animated Cyber Slide Timer Progress Line */}
            {offers.length > 1 && (
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-800/80 overflow-hidden">
                <div
                  key={activeOfferIdx}
                  className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 animate-[progress_5s_linear_infinite]"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div className="relative p-4 sm:p-5 space-y-3.5">
              {/* Header row with Cyber Beacon and slider navigation */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exclusive Deal of the Day</span>
                </div>

                {/* Slider Controls */}
                <div className="flex items-center gap-1.5">
                  {offers.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveOfferIdx((prev) => (prev - 1 + offers.length) % offers.length)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
                        aria-label="Previous deal"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveOfferIdx((prev) => (prev + 1) % offers.length)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
                        aria-label="Next deal"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Current Featured Offer Card */}
              {(() => {
                const current = offers[activeOfferIdx % offers.length];
                if (!current) return null;

                return (
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Offer Details & Actions */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30 uppercase tracking-wide">
                          {current.badge || '🔥 TODAY\'S SPECIAL'}
                        </span>
                      </div>

                      <h3 className="font-black text-base sm:text-lg text-white leading-tight truncate tracking-tight">
                        {current.title}
                      </h3>

                      {current.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed opacity-90">
                          {current.description}
                        </p>
                      )}

                      {/* Pricing Tag */}
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        {current.dealPrice ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-amber-400">
                              KES {current.dealPrice.toLocaleString()}
                            </span>
                            {current.originalPrice && current.originalPrice > current.dealPrice && (
                              <span className="text-xs font-semibold text-slate-400 line-through opacity-75">
                                KES {current.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-amber-400">
                            {current.offerType === 'BUY_ONE_GET_ONE' ? 'Buy 1 Get 1 Free' : `${current.discountValue}% Off`}
                          </span>
                        )}

                        {/* Interactive Promo Code Pill */}
                        {current.promoCode && (
                          <button
                            onClick={() => {
                              if (current.promoCode) {
                                navigator.clipboard?.writeText(current.promoCode);
                                setCopiedCode(current.promoCode);
                                setTimeout(() => setCopiedCode(null), 2500);
                              }
                            }}
                            title="Click to copy promo code"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-400/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-mono font-bold tracking-wide transition-all active:scale-95 shadow-sm"
                          >
                            <Copy className="w-3 h-3 text-amber-400" />
                            <span>{copiedCode === current.promoCode ? 'Copied! 🎉' : current.promoCode}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Floating Product Image with Holographic Glow */}
                    <div className="relative flex-shrink-0">
                      {/* Holographic glowing ambient back-ring */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 blur-md opacity-70 animate-pulse pointer-events-none scale-105" />
                      
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        {current.imageUrl ? (
                          <img
                            src={current.imageUrl}
                            alt={current.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/80 to-purple-950/80 text-3xl">
                            🍸
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-1 right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                          Special
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Pagination Dots */}
              {offers.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {offers.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveOfferIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeOfferIdx === i
                          ? 'w-6 bg-gradient-to-r from-amber-400 to-rose-500 shadow-sm shadow-amber-500/50'
                          : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Deal ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY PILLS ───────────────────── */}
      <div className="px-4 pt-5 pb-1 fade-up-delay-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: cat === c ? brand.primary : 'var(--surface)',
                color: cat === c ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${cat === c ? brand.primary : 'var(--border)'}`,
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
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No items available in this category.</p>
          </div>
        )}

        {filtered.filter((i) => i.isAvailable).map((item) => {
          const itemOffer = getOfferForItem(item);
          const itemPricing = itemOffer ? getItemPricing(item, 1) : null;
          return (
          <div key={item.id} className="card flex items-center gap-4 p-4 transition-all active:scale-[0.98]">
            <div className="relative flex-shrink-0">
              {item.img
                ? <img src={item.img} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                : <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl" style={{ background: 'var(--surface)' }}>🍸</div>
              }
              {itemOffer && (
                <span
                  className="absolute -top-2 -right-2 text-[8px] font-black rounded-full px-1.5 py-0.5 text-white animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                >
                  {itemOffer.badge ? itemOffer.badge.slice(0, 8) : 'DEAL'}
                </span>
              )}
              {!itemOffer && item.badge && (
                <span
                  className="absolute -top-2 -right-2 text-[8px] font-black rounded-full px-1.5 py-0.5 text-white"
                  style={{ background: brand.primary }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
              {item.desc && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>}
              {/* Offer label */}
              {itemOffer && (
                <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#34D399' }}>
                  <Tag className="w-2.5 h-2.5" />
                  {itemOffer.offerType === 'BUY_ONE_GET_ONE' ? 'Buy 1 Get 1 Free' : itemOffer.badge || itemOffer.title}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {itemPricing && itemPricing.discountAmount > 0 && (
                    <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>KES {item.price.toLocaleString()}</span>
                  )}
                  <span className="font-black text-sm" style={{ color: itemPricing && itemPricing.discountAmount > 0 ? '#F59E0B' : brand.accent }}>
                    KES {itemPricing ? itemPricing.unitPrice.toLocaleString() : item.price.toLocaleString()}
                  </span>
                </div>

                {(cart[item.id] ?? 0) > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
                    <button onClick={() => dec(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                      <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text)' }} />
                    </button>
                    <span className="w-4 text-center text-xs font-black" style={{ color: 'var(--text)' }}>{cart[item.id]}</span>
                    <button onClick={() => add(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: brand.primary }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => add(item.id)}
                    className="btn-primary px-4 py-2 flex items-center gap-1.5"
                    style={{ background: brand.primary }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* ── FLOATING CART BAR ────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setScreen('cart')}
            className="w-full flex items-center justify-between p-4 rounded-2xl text-white shadow-2xl font-bold transition-all active:scale-[0.97]"
            style={{
              background: brand.primary,
              boxShadow: `0 8px 32px ${brand.primary}55`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: 'rgba(0,0,0,0.25)' }}>
                {cartCount}
              </div>
              <span className="text-sm font-bold">View Order</span>
            </div>
            <div className="flex items-center gap-2">
              {cartTotalDiscount > 0 && (
                <span className="text-xs font-bold line-through opacity-60">KES {cartSubtotal.toLocaleString()}</span>
              )}
              <span className="text-sm font-black">KES {cartFinalTotal.toLocaleString()}</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Utility: lighten/darken a hex color ── */
function adjustColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
