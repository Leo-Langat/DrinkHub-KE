import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Wine,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discountPercentage: number;
  promoCode: string;
}

const DEMO_OFFERS: Offer[] = [
  {
    id: 'off-1',
    title: '🔥 Happy Hour Beer Bucket',
    description: '15% OFF all local beers before 10 PM',
    discountPercentage: 15,
    promoCode: 'HAPPYBEER',
  },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm-1',
    name: 'Tusker Lager (500ml)',
    category: 'Beers',
    price: 350,
    description: 'Kenya finest ice-cold lager, brewed since 1922.',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400',
    isAvailable: true,
  },
  {
    id: 'm-2',
    name: 'White Cap Crisp (500ml)',
    category: 'Beers',
    price: 380,
    description: 'Sugar-free crisp lager, perfectly chilled.',
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400',
    isAvailable: true,
  },
  {
    id: 'm-3',
    name: 'Nairobi Dawa Cocktail',
    category: 'Cocktails',
    price: 750,
    description: 'Vodka, honey, fresh lime wedges & crushed ginger stem.',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
    isAvailable: true,
  },
  {
    id: 'm-4',
    name: 'Captain Morgan Spiced (750ml Bottle)',
    category: 'Spirits',
    price: 3800,
    description: 'Premium Caribbean spiced rum with 4 mixers included.',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    isAvailable: true,
  },
  {
    id: 'm-5',
    name: 'Nyama Choma Platter (1kg)',
    category: 'Food & Bitings',
    price: 1800,
    description: 'Slow-grilled goat meat served with hot Kachumbari & Ugali chips.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    isAvailable: true,
  },
];

export const QrMenuPage: React.FC = () => {
  const { venueSlug, tableNum } = useParams<{ venueSlug?: string; tableNum?: string }>();
  const currentTable = tableNum || '2';
  const currentVenueName = venueSlug
    ? venueSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'The Alchemist Westlands';

  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  // Age Verification & Payment Method States
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'MPESA' | 'CARD' | 'CASH'>('MPESA');

  // M-Pesa State
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Cash State
  const [exactCash, setExactCash] = useState<boolean>(true);
  const [customerCashTendered, setCustomerCashTendered] = useState<number>(0);

  // Submission Feedback State
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const increaseQuantity = (id: string) => {
    setCart((prev) => {
      const count = (prev[id] || 0) + 1;
      const item = DEMO_MENU_ITEMS.find((m) => m.id === id);
      triggerToast(`Added 1x ${item?.name} to cart`);
      return { ...prev, [id]: count };
    });
  };

  const decreaseQuantity = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const emptyCart = () => {
    setCart({});
    triggerToast('Cart emptied');
  };

  const totalItemCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const subtotalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const item = DEMO_MENU_ITEMS.find((m) => m.id === id);
    return sum + (item ? item.price * count : 0);
  }, 0);

  const categories = Array.from(new Set(DEMO_MENU_ITEMS.map((i) => i.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const handleCheckoutClick = () => {
    setIsCartSheetOpen(false);
    setIsAgeModalOpen(true);
    setCustomerCashTendered(subtotalPrice);
  };

  // Change Calculation
  const changeDue = Math.max(0, customerCashTendered - subtotalPrice);

  const handleProcessPayment = () => {
    if (selectedPaymentMethod === 'MPESA') {
      if (!phoneNumber) {
        alert('Please enter your Safaricom M-Pesa phone number');
        return;
      }
      setPaymentSuccessMessage(`STK Push prompt sent to ${phoneNumber}. Enter M-Pesa PIN on your phone to complete KSh ${subtotalPrice.toLocaleString()}.`);
    } else if (selectedPaymentMethod === 'CARD') {
      setPaymentSuccessMessage(`Waiter notified! POS Machine requested for Table #${currentTable}. Payment KSh ${subtotalPrice.toLocaleString()} marked PENDING.`);
    } else if (selectedPaymentMethod === 'CASH') {
      if (exactCash) {
        setPaymentSuccessMessage(`Waiter notified! Customer has exact cash KSh ${subtotalPrice.toLocaleString()} for Table #${currentTable}.`);
      } else {
        if (customerCashTendered < subtotalPrice) {
          alert(`Tendered cash (KSh ${customerCashTendered}) must be greater than order total (KSh ${subtotalPrice})`);
          return;
        }
        setPaymentSuccessMessage(`Waiter notified! Customer paying KSh ${customerCashTendered.toLocaleString()}. Bring KSh ${changeDue.toLocaleString()} change to Table #${currentTable}.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-28 text-slate-100 font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 rounded-2xl bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-brand-400 flex items-center space-x-2 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. WELCOME HEADER (Club Logo & Table Identifier) */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-r from-dark-900 via-brand-950/30 to-dark-900 p-6 shadow-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-500/20 px-3 py-1 text-xs font-extrabold text-brand-400 border border-brand-500/30">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
              <span>Table #{currentTable} • Live Venue Session</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{currentVenueName}</h1>
            <p className="text-xs text-slate-400">QR Code Menu • M-Pesa, Card & Cash Supported</p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 p-1 shadow-xl">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-dark-900 text-2xl">
              🍸
            </div>
          </div>
        </div>

        {/* OFFERS BANNER */}
        {DEMO_OFFERS.length > 0 && (
          <div className="mx-auto mt-4 max-w-2xl">
            {DEMO_OFFERS.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-amber-500/10 p-3.5 border border-amber-500/30 shadow-inner"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-amber-400 animate-spin" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-300">{offer.title}</h4>
                    <p className="text-[11px] text-slate-300">{offer.description}</p>
                  </div>
                </div>
                <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-mono font-bold text-amber-400 border border-amber-500/40">
                  {offer.promoCode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. CATEGORY TABS NAV */}
      <div className="sticky top-16 z-30 border-b border-slate-800 bg-dark-950/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl space-x-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MENU DRINK CARDS GRID */}
      <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card p-4 h-24 animate-pulse bg-dark-900/60 border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {DEMO_MENU_ITEMS.filter((item) => selectedCategory === 'ALL' || item.category === selectedCategory).map(
              (item) => (
                <div
                  key={item.id}
                  className="glass-card flex items-center justify-between p-4 transition-all duration-200 hover:border-brand-500/50"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-800 shadow-md"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{item.description}</p>
                      <span className="inline-block pt-1 font-black text-brand-500 text-sm">
                        KES {item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {cart[item.id] > 0 ? (
                      <div className="flex items-center space-x-2 rounded-xl bg-dark-900 p-1 border border-slate-800">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-dark-800 text-slate-200 hover:bg-dark-700"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-white">{cart[item.id]}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => increaseQuantity(item.id)} className="px-3 py-2">
                        + Add
                      </Button>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* 4. FLOATING BOTTOM BAR TOGGLING CART SHEET */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl">
          <div className="glass-panel flex items-center justify-between p-4 shadow-2xl border border-brand-500/50 bg-dark-900/95 backdrop-blur-xl">
            <div className="flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white font-extrabold shadow-md">
                {totalItemCount}
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Order</p>
                <p className="text-lg font-black text-white">KES {subtotalPrice.toLocaleString()}</p>
              </div>
            </div>

            <Button size="lg" className="flex items-center space-x-2" onClick={() => setIsCartSheetOpen(true)}>
              <ShoppingBag className="h-4 w-4" />
              <span>View Cart & Checkout</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. SHOPPING CART SHEET */}
      {isCartSheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-dark-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-dark-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-brand-500" />
                  <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
                </div>
                <button onClick={() => setIsCartSheetOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-dark-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <ShoppingBag className="mx-auto h-12 w-12 text-slate-600" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([id, quantity]) => {
                    const item = DEMO_MENU_ITEMS.find((m) => m.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex items-center justify-between rounded-xl bg-dark-950 p-3.5 border border-slate-800">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <p className="text-xs text-brand-500 font-extrabold">KES {(item.price * quantity).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 rounded-xl bg-dark-900 p-1 border border-slate-800">
                          <button onClick={() => decreaseQuantity(id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-dark-800 text-slate-200">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-black text-white">{quantity}</span>
                          <button onClick={() => increaseQuantity(id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-white">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={emptyCart} className="mt-4 flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 font-semibold">
                    <Trash2 className="h-4 w-4" />
                    <span>Empty Entire Cart</span>
                  </button>
                </div>
              )}
            </div>

            {Object.keys(cart).length > 0 && (
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal Amount</span>
                  <span className="font-extrabold text-white">KES {subtotalPrice.toLocaleString()}</span>
                </div>
                <Button size="lg" className="w-full" onClick={handleCheckoutClick}>
                  Proceed to Age Verification & Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. AGE VERIFICATION & MULTI-OPTION PAYMENT MODAL */}
      {isAgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/85 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 space-y-6 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-6 w-6 text-brand-500" />
                <h2 className="text-lg font-bold text-white">Checkout & Payment</h2>
              </div>
              <button onClick={() => setIsAgeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!paymentSuccessMessage ? (
              <div className="space-y-5">
                {/* 18+ Mandatory Disclaimer Checkbox */}
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                    <Info className="h-4 w-4" />
                    <span>18+ Mandatory Age Verification</span>
                  </div>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAgeConfirmed}
                      onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-dark-900 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      "I confirm I am over 18 years old and will provide identification upon request."
                    </span>
                  </label>
                </div>

                {/* SELECT PAYMENT METHOD TABS (1: M-Pesa, 2: Card POS, 3: Cash) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedPaymentMethod('MPESA')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedPaymentMethod === 'MPESA'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md'
                          : 'border-slate-800 bg-dark-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-5 w-5 mb-1 text-emerald-400" />
                      <span>1. M-Pesa</span>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('CARD')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedPaymentMethod === 'CARD'
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-md'
                          : 'border-slate-800 bg-dark-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mb-1 text-brand-400" />
                      <span>2. Card POS</span>
                    </button>

                    <button
                      onClick={() => setSelectedPaymentMethod('CASH')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedPaymentMethod === 'CASH'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-md'
                          : 'border-slate-800 bg-dark-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="h-5 w-5 mb-1 text-amber-400" />
                      <span>3. Cash</span>
                    </button>
                  </div>
                </div>

                {/* PAYMENT METHOD 1: M-PESA STK PUSH */}
                {selectedPaymentMethod === 'MPESA' && (
                  <div className="space-y-3 rounded-xl bg-dark-900 p-4 border border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300">Safaricom Phone Number</label>
                    <input
                      type="tel"
                      placeholder="0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-dark-950 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">STK Push prompt will pop up on your phone screen.</p>
                  </div>
                )}

                {/* PAYMENT METHOD 2: CREDIT / DEBIT CARD (POS MACHINE) */}
                {selectedPaymentMethod === 'CARD' && (
                  <div className="rounded-xl bg-brand-500/10 border border-brand-500/30 p-4 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 font-bold text-brand-400">
                      <CreditCard className="h-4 w-4" />
                      <span>Card POS Machine Request</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Do not process online. Submitting will mark order payment as <span className="font-bold text-amber-400">PENDING</span> and notify the waiter to <span className="font-bold text-white">"Bring POS Machine to Table #{currentTable}"</span>.
                    </p>
                  </div>
                )}

                {/* PAYMENT METHOD 3: CASH PAYMENT (EXACT CASH OR CHANGE CALCULATOR) */}
                {selectedPaymentMethod === 'CASH' && (
                  <div className="space-y-4 rounded-xl bg-dark-900 p-4 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white">Do you have the exact amount?</span>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExactCash(true);
                            setCustomerCashTendered(subtotalPrice);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold ${
                            exactCash ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-400'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setExactCash(false)}
                          className={`px-3 py-1.5 rounded-lg font-bold ${
                            !exactCash ? 'bg-amber-500 text-dark-950' : 'bg-dark-800 text-slate-400'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {exactCash ? (
                      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-amber-300 font-medium text-[11px]">
                        exact_cash = true • Waiter will be notified: "Customer has exact cash KSh {subtotalPrice.toLocaleString()}."
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">How much will you pay?</label>
                          <input
                            type="number"
                            placeholder="e.g. 2000"
                            value={customerCashTendered}
                            onChange={(e) => setCustomerCashTendered(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-700 bg-dark-950 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        {customerCashTendered >= subtotalPrice ? (
                          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-1">
                            <div className="flex justify-between text-slate-300">
                              <span>Order Total:</span>
                              <span className="font-bold text-white">KSh {subtotalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Customer Pays:</span>
                              <span className="font-bold text-emerald-400">KSh {customerCashTendered.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-extrabold text-amber-400 pt-1 border-t border-slate-800">
                              <span>Change Due to You:</span>
                              <span>KSh {changeDue.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-red-400 text-[11px]">Amount tendered must be at least KSh {subtotalPrice.toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBMIT CHECKOUT BUTTON - DISABLED UNTIL 18+ AGE CHECKBOX IS CONFIRMED */}
                <Button
                  size="lg"
                  disabled={!isAgeConfirmed}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleProcessPayment}
                >
                  Confirm Order & Process Payment
                </Button>

                {!isAgeConfirmed && (
                  <p className="text-[11px] text-amber-400/80 text-center font-medium">
                    ⚠️ Checkout remains disabled until age verification box is checked.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 py-6">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 animate-bounce" />
                <h3 className="text-lg font-extrabold text-white">Payment Request Submitted!</h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">{paymentSuccessMessage}</p>
                <Button variant="secondary" className="w-full" onClick={() => setIsAgeModalOpen(false)}>
                  Close Window
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
