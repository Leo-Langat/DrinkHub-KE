import React, { useState } from 'react';
import { Wine, Plus, Upload, MoveUp, MoveDown, Tag, Sparkles, CheckCircle2, AlertTriangle, Eye, EyeOff, Archive } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  isArchived: boolean;
}

interface Offer {
  id: string;
  title: string;
  type: string;
  discountValue: number;
  promoCode?: string;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Local & Craft Beers', displayOrder: 1 },
  { id: 'cat-2', name: 'Cocktails & Mixers', displayOrder: 2 },
  { id: 'cat-3', name: 'Bitings & Grill', displayOrder: 3 },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Tusker Lager (500ml)', categoryId: 'cat-1', price: 350, description: 'Ice cold local beer', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300', isAvailable: true, isArchived: false },
  { id: 'prod-2', name: 'Nairobi Dawa Cocktail', categoryId: 'cat-2', price: 750, description: 'Vodka, honey, lime & ginger', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300', isAvailable: true, isArchived: false },
  { id: 'prod-3', name: 'Nyama Choma Platter (1kg)', categoryId: 'cat-3', price: 1800, description: 'Grilled goat meat served with Kachumbari', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300', isAvailable: false, isArchived: false },
];

const INITIAL_OFFERS: Offer[] = [
  { id: 'off-1', title: 'Happy Hour Beer Bucket', type: 'PERCENTAGE_DISCOUNT', discountValue: 15, promoCode: 'HAPPYBEER' },
];

export const ManagerMenuPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES' | 'OFFERS'>('PRODUCTS');
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  
  // Modals & Alerts
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: 'cat-1',
    price: 0,
    description: '',
    imageUrl: '',
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const toggleAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = !p.isAvailable;
          triggerAlert(`${p.name} availability set to ${updated ? 'Available' : 'Sold Out'}`);
          return { ...p, isAvailable: updated };
        }
        return p;
      })
    );
  };

  const archiveProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          triggerAlert(`${p.name} archived successfully`);
          return { ...p, isArchived: true };
        }
        return p;
      })
    );
  };

  const moveCategory = (index: number, direction: 'UP' | 'DOWN') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Recalculate displayOrder
    const reordered = newCategories.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    setCategories(reordered);
    triggerAlert('Category display order updated (Drag & Drop Reordered)');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      categoryId: newProduct.categoryId,
      price: Number(newProduct.price),
      description: newProduct.description,
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300',
      isAvailable: true,
      isArchived: false,
    };
    setProducts([created, ...products]);
    setIsAddProductModalOpen(false);
    setNewProduct({ name: '', categoryId: 'cat-1', price: 0, description: '', imageUrl: '' });
    triggerAlert(`New product ${created.name} created successfully`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      displayOrder: categories.length + 1,
    };
    setCategories([...categories, created]);
    setIsAddCategoryModalOpen(false);
    setNewCategoryName('');
    triggerAlert(`Category ${created.name} created`);
  };

  const activeProducts = products.filter((p) => !p.isArchived);

  return (
    <div className="min-h-screen bg-dark-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-500 border border-brand-500/40">
            <Wine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Manager Portal • Menu & Inventory</h1>
            <p className="text-xs text-slate-400">Manage categories, drinks, prices, availability & happy hour offers</p>
          </div>
        </div>

        {/* Action Button depending on tab */}
        {activeTab === 'PRODUCTS' && (
          <Button size="lg" className="flex items-center space-x-2" onClick={() => setIsAddProductModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Add New Drink / Item</span>
          </Button>
        )}
        {activeTab === 'CATEGORIES' && (
          <Button size="lg" className="flex items-center space-x-2" onClick={() => setIsAddCategoryModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        )}
      </div>

      {/* Alert Banner */}
      {alertMessage && (
        <div className="glass-panel border-emerald-500/50 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* shadcn Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'PRODUCTS'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          Drinks & Products ({activeProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'CATEGORIES'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          Categories & Sorting ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('OFFERS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'OFFERS'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-dark-900 text-slate-400 hover:text-white'
          }`}
        >
          Offers & Discounts ({offers.length})
        </button>
      </div>

      {/* TAB 1: PRODUCTS / DRINKS GRID */}
      {activeTab === 'PRODUCTS' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeProducts.map((product) => {
            const cat = categories.find((c) => c.id === product.categoryId);
            return (
              <div key={product.id} className="glass-panel p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                      {cat?.name || 'Category'}
                    </span>
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      className={`flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-bold border ${
                        product.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {product.isAvailable ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{product.isAvailable ? 'Available' : 'Sold Out'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-xl object-cover border border-slate-800"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm">{product.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{product.description}</p>
                      <span className="mt-1 inline-block font-black text-brand-500 text-sm">
                        KES {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between">
                  <Button size="sm" variant="secondary" onClick={() => archiveProduct(product.id)} className="w-full flex items-center justify-center space-x-1">
                    <Archive className="h-3.5 w-3.5 text-amber-400" />
                    <span>Archive Product</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CATEGORIES & DRAG AND DROP SORTING */}
      {activeTab === 'CATEGORIES' && (
        <div className="glass-panel p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Reorder Categories (Drag-and-Drop Display Order)</h2>
            <span className="text-xs text-slate-400">Higher categories appear first on customer QR menu</span>
          </div>

          <div className="space-y-3">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="glass-card flex items-center justify-between p-4 border border-slate-800/80 bg-dark-900/90"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-500 text-xs font-black border border-brand-500/30">
                    #{cat.displayOrder}
                  </span>
                  <span className="font-bold text-white text-sm">{cat.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveCategory(idx, 'UP')}
                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30"
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button
                    disabled={idx === categories.length - 1}
                    onClick={() => moveCategory(idx, 'DOWN')}
                    className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30"
                  >
                    <MoveDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OFFERS & DISCOUNTS */}
      {activeTab === 'OFFERS' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer.id} className="glass-panel p-5 space-y-3 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/30">
                  {offer.type}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-dark-900 px-2 py-0.5 rounded border border-slate-800">
                  {offer.promoCode}
                </span>
              </div>
              <h3 className="font-bold text-white text-base">{offer.title}</h3>
              <p className="text-xs text-slate-400">Discount Value: <span className="font-extrabold text-brand-500">{offer.discountValue}% OFF</span></p>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Add New Drink / Menu Item</h2>
              <button onClick={() => setIsAddProductModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Captain Morgan Spiced Rum"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (KES)</label>
                  <input
                    required
                    type="number"
                    placeholder="450"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Upload Product Image</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={() => triggerAlert('Image uploaded to /uploads/ successfully')}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/20 file:text-brand-500 hover:file:bg-brand-500/30"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Save Product Item
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Create Menu Category</h2>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Premium Whiskies"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Save Category
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
