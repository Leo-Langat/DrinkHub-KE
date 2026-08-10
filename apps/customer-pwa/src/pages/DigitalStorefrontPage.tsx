import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Minus, X, ChevronRight, Sparkles, CheckCircle2,
  Clock, AlertCircle, ShoppingCart, MapPin, Wifi, WifiOff,
  Smartphone, Banknote, CreditCard, ArrowLeft, Star,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   BRANDING ENGINE
───────────────────────────────────────────── */
interface BrandingConfig {
  name: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  primary: string;
  primaryDark: string;
  accent: string;
}

const VENUES: Record<string, BrandingConfig> = {
  'quiver-kilimani': {
    name: 'Quiver Lounge',
    tagline: 'Kilimani · Nairobi',
    logoUrl: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=120&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&q=80',
    primary: '#DC2626',
    primaryDark: '#991B1B',
    accent: '#F59E0B',
  },
  'sky-lounge': {
    name: 'Sky Lounge',
    tagline: 'Westlands · Nairobi',
    logoUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=120&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80',
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    accent: '#38BDF8',
  },
  '1824-club': {
    name: '1824 Club',
    tagline: 'Langata · Nairobi',
    logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
    primary: '#059669',
    primaryDark: '#047857',
    accent: '#34D399',
  },
};

const DEFAULT_VENUE = VENUES['quiver-kilimani'];

/* ─────────────────────────────────────────────
   MENU DATA
───────────────────────────────────────────── */
type Category = 'All' | 'Beers' | 'Cocktails' | 'Spirits' | 'Food';

interface MenuItem {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  price: number;
  desc: string;
  img: string;
  badge?: string;
  rating: number;
}

const MENU: MenuItem[] = [
  {
    id: '1', name: 'Tusker Lager 500ml', category: 'Beers', price: 350,
    desc: "Kenya's iconic ice-cold lager since 1922.",
    img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80',
    badge: '2+1 FREE', rating: 4.8,
  },
  {
    id: '2', name: 'White Cap Crisp 500ml', category: 'Beers', price: 380,
    desc: 'Sugar-free premium lager. Crisp & refreshing.',
    img: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&q=80',
    rating: 4.6,
  },
  {
    id: '3', name: 'Nairobi Dawa', category: 'Cocktails', price: 750,
    desc: 'Vodka, honey, fresh lime & crushed ginger.',
    img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80',
    badge: 'BESTSELLER', rating: 4.9,
  },
  {
    id: '4', name: 'Passion Mojito', category: 'Cocktails', price: 700,
    desc: 'Passion fruit, mint, rum & sparkling water.',
    img: 'https://images.unsplash.com/photo-1582696785168-4c21c4c2a2e1?w=300&q=80',
    rating: 4.7,
  },
  {
    id: '5', name: 'Captain Morgan 750ml', category: 'Spirits', price: 3800,
    desc: 'Caribbean spiced rum. Includes 4 mixers.',
    img: 'https://images.unsplash.com/photo-1584947897558-b3c0a76e4e91?w=300&q=80',
    badge: 'BOTTLE SERVICE', rating: 4.8,
  },
  {
    id: '6', name: 'Nyama Choma Platter 1kg', category: 'Food', price: 1800,
    desc: 'Slow-grilled goat. Served with Kachumbari & Ugali.',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
    rating: 4.9,
  },
];

const CATEGORIES: Category[] = ['All', 'Beers', 'Cocktails', 'Spirits', 'Food'];

/* ─────────────────────────────────────────────
   CART TYPES
───────────────────────────────────────────── */
type CartMap = Record<string, number>;

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export const DigitalStorefrontPage: React.FC = () => {
  const { venueSlug, tableNum } = useParams<{ venueSlug?: string; tableNum?: string }>();
  const brand = VENUES[venueSlug ?? ''] ?? DEFAULT_VENUE;
  const table = tableNum ?? '12';

  /* Inject brand CSS vars */
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--primary', brand.primary);
    r.style.setProperty('--primary-dark', brand.primaryDark);
    r.style.setProperty('--accent', brand.accent);
  }, [brand]);

  const [cat, setCat] = useState<Category>('All');
  const [cart, setCart] = useState<CartMap>({});
  const [screen, setScreen] = useState<'menu' | 'cart' | 'checkout' | 'success'>('menu');
  const [ageOk, setAgeOk] = useState(false);
  const [payment, setPayment] = useState<'mpesa' | 'card' | 'cash'>('mpesa');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroOpacity, setHeroOpacity] = useState(1);

  /* Live offline / online detection — ordering is disabled when offline (§34) */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* Parallax on hero */
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setHeroOpacity(Math.max(0, 1 - scrollY / 220));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = cat === 'All' ? MENU : MENU.filter((m) => m.category === cat);
  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0);
  const cartTotal = Object.entries(cart).reduce((s, [id, n]) => {
    const item = MENU.find((m) => m.id === id);
    return s + (item ? item.price * n : 0);
  }, 0);

  const add = (id: string) => setCart((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const dec = (id: string) => setCart((p) => {
    if ((p[id] ?? 0) <= 1) { const c = { ...p }; delete c[id]; return c; }
    return { ...p, [id]: p[id] - 1 };
  });

  const placeOrder = async () => {
    // Hard gate: never submit an order while offline (§34 — no offline ordering)
    if (!isOnline) return;
    if (!ageOk) return; // Belt-and-suspenders: schema also validates server-side
    setPlacing(true);
    // TODO: Replace this mock with the real API call to POST /api/v1/orders
    // The request body must include { ageVerified: true, items, tableUuid, paymentMethod }
    // Example (uncomment when backend URL is configured):
    // await fetch('/api/v1/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ageVerified: true, items: Object.entries(cart).map(([productUuid, quantity]) => ({ productUuid, quantity })), tableUuid: undefined }),
    // });
    await new Promise((r) => setTimeout(r, 1600));
    setPlacing(false);
    setScreen('success');
  };

  /* ────── OFFLINE GUARD ────── */
  if (!isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center" style={{ background: 'var(--bg)' }}>
        <WifiOff className="w-14 h-14 opacity-40" />
        <div>
          <h2 className="text-xl font-black text-white">No Internet Connection</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Please connect to Wi-Fi or mobile data to browse the menu and place orders.</p>
        </div>
      </div>
    );
  }

  /* ────── SUCCESS SCREEN ────── */
  if (screen === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center fade-up" style={{ background: 'var(--bg)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${brand.primary}20` }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: brand.primary }} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Order Placed!</h2>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Your order has been sent to the bar.<br />Your waiter will bring it to <strong className="text-white">Table #{table}</strong>.
          </p>
        </div>
        <div className="w-full max-w-sm card p-5 text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Summary</p>
          {Object.entries(cart).map(([id, qty]) => {
            const item = MENU.find((m) => m.id === id);
            if (!item) return null;
            return (
              <div key={id} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{qty}× {item.name}</span>
                <span className="font-bold text-white">KES {(item.price * qty).toLocaleString()}</span>
              </div>
            );
          })}
          <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="font-bold text-white">Total</span>
            <span className="font-black" style={{ color: brand.accent }}>KES {cartTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          Estimated wait: 8–12 minutes
        </div>
      </div>
    );
  }

  /* ────── CHECKOUT SCREEN ────── */
  if (screen === 'checkout') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 border-b" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <button onClick={() => setScreen('cart')} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="font-black text-white text-base leading-none">Checkout</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Table #{table}</p>
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
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
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
              <p className="text-xs pl-6" style={{ color: 'var(--text-secondary)' }}>Your waiter will bring the POS terminal to Table #{table}.</p>
            </div>
          )}

          {/* Order summary */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Summary</p>
            {Object.entries(cart).map(([id, qty]) => {
              const item = MENU.find((m) => m.id === id);
              if (!item) return null;
              return (
                <div key={id} className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{qty}× {item.name}</span>
                  <span className="font-bold text-white">KES {(item.price * qty).toLocaleString()}</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-3 border-t font-bold" style={{ borderColor: 'var(--border)' }}>
              <span className="text-white">Total</span>
              <span style={{ color: brand.accent }}>KES {cartTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* 18+ */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} className="mt-0.5 flex-shrink-0" />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              I confirm I am <strong className="text-white">over 18 years old</strong> and will provide valid identification upon request.
            </span>
          </label>

          <button
            disabled={!ageOk || placing || (payment === 'mpesa' && phone.length < 9)}
            onClick={placeOrder}
            className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2"
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
              <>Confirm Order · KES {cartTotal.toLocaleString()}</>
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
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="font-black text-white text-base leading-none">Your Order</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Table #{table} · {cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6 space-y-3 pb-40">
          {Object.entries(cart).map(([id, qty]) => {
            const item = MENU.find((m) => m.id === id);
            if (!item) return null;
            return (
              <div key={id} className="card flex items-center gap-4 p-4">
                <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{item.name}</p>
                  <p className="font-black text-sm mt-0.5" style={{ color: brand.accent }}>KES {(item.price * qty).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => dec(id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="w-5 text-center font-black text-white text-sm">{qty}</span>
                  <button onClick={() => add(id)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: brand.primary }}>
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-0 inset-x-0 p-4 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-xl font-black" style={{ color: brand.accent }}>KES {cartTotal.toLocaleString()}</span>
            </div>
            <button onClick={() => setScreen('checkout')} className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2" style={{ background: brand.primary }}>
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
        <img
          src={brand.bannerUrl}
          alt={brand.name}
          className="w-full h-full object-cover"
          style={{ opacity: heroOpacity, transform: `scale(${1 + (1 - heroOpacity) * 0.08})`, transition: 'transform 0.05s linear' }}
        />
        {/* Gradient overlay */}
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
            <img src={brand.logoUrl} alt={brand.name} className="w-14 h-14 rounded-2xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
            <div>
              <h1 className="text-xl font-black text-white leading-none">{brand.name}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3 opacity-50" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.tagline}</span>
              </div>
            </div>
          </div>
          {/* Table badge */}
          <div className="rounded-2xl px-3 py-2 text-center" style={{ background: brand.primary }}>
            <p className="text-[9px] font-bold uppercase opacity-80 text-white leading-none">Table</p>
            <p className="text-lg font-black text-white leading-tight">#{table}</p>
          </div>
        </div>
      </div>

      {/* ── HAPPY HOUR OFFER ─────────────────── */}
      <div className="px-4 pt-4 fade-up">
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.2)' }}>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-wide">Happy Hour · Until 10 PM</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Buy 2 Tusker Lager, Get 1 Free</p>
            </div>
          </div>
          <span className="text-[10px] font-black rounded-lg px-2 py-1.5 flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
            HAPPYBEER
          </span>
        </div>
      </div>

      {/* ── CATEGORY PILLS ───────────────────── */}
      <div className="px-4 pt-5 pb-1 fade-up-delay-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((c) => (
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

        {filtered.map((item) => (
          <div key={item.id} className="card flex items-center gap-4 p-4 transition-all active:scale-[0.98]">
            <div className="relative flex-shrink-0">
              <img src={item.img} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
              {item.badge && (
                <span
                  className="absolute -top-2 -right-2 text-[8px] font-black rounded-full px-1.5 py-0.5 text-white"
                  style={{ background: brand.primary }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm text-white leading-tight truncate">{item.name}</p>
              </div>
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm" style={{ color: brand.accent }}>KES {item.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400">{item.rating}</span>
                  </div>
                </div>

                {(cart[item.id] ?? 0) > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
                    <button onClick={() => dec(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                      <Minus className="w-3.5 h-3.5 text-white" />
                    </button>
                    <span className="w-4 text-center text-xs font-black text-white">{cart[item.id]}</span>
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
        ))}
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
              <span className="text-sm font-black">KES {cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
