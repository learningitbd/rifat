import React, { useState, useEffect } from 'react';
import { Fruit, CartItem, Order } from './types';
import StoreFront from './components/StoreFront';
import Cart from './components/Cart';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import { getFruits, getAllOrders } from './data/dbHelper';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Leaf, 
  Settings, 
  Compass, 
  Search, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation: 'store' | 'track' | 'admin'
  const [activeTab, setActiveTab] = useState<'store' | 'track' | 'admin'>('store');
  
  // Data states
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingFruits, setIsLoadingFruits] = useState(true);
  
  // Cart states
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Persistent basket
    const saved = localStorage.getItem('seasonal_fruit_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string | null>(null);

  // Status Alerts
  const [notification, setNotification] = useState<string | null>(null);

  // Load fruits on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Save cart modifications to localStorage
  useEffect(() => {
    localStorage.setItem('seasonal_fruit_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const loadAllData = async () => {
    setIsLoadingFruits(true);
    try {
      // 1. Fetch available fruits catalog
      const items = await getFruits();
      setFruits(items);

      // 2. Fetch order log histories (used for Admin Stats & Tables)
      const ords = await getAllOrders();
      setOrders(ords);
    } catch (err) {
      console.error("Critical error loading shop data:", err);
    } finally {
      setIsLoadingFruits(false);
    }
  };

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Cart Operations
  const handleAddToBag = (fruit: Fruit, qty: number) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.fruit.id === fruit.id);
      if (idx > -1) {
        const next = [...prev];
        // Ensure not exceeding stock
        const totalQty = Math.min(fruit.stock, next[idx].quantity + qty);
        next[idx] = { ...next[idx], quantity: totalQty };
        return next;
      } else {
        return [...prev, { fruit, quantity: Math.min(fruit.stock, qty) }];
      }
    });
    triggerNotification(`"${fruit.name.split(' ')[0]}" শপিং ব্যাগে যোগ হয়েছে!`);
  };

  const handleUpdateQty = (fruitId: string, qty: number) => {
    setCartItems((prev) => 
      prev.map((item) => 
        item.fruit.id === fruitId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveItem = (fruitId: string) => {
    const itemToRemove = cartItems.find(it => it.fruit.id === fruitId);
    setCartItems((prev) => prev.filter((item) => item.fruit.id !== fruitId));
    if (itemToRemove) {
      triggerNotification(`"${itemToRemove.fruit.name.split(' ')[0]}" শপিং ব্যাগ থেকে বাদ দেওয়া হয়েছে`);
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Callback when checking out is successful
  const handleOrderConfirmed = (orderId: string) => {
    setIsCartOpen(false);
    setActiveTrackOrderId(orderId);
    setActiveTab('track');
    triggerNotification('অর্ডারটি নিশ্চিত হয়েছে! নিচের ট্র্যাকার দেখুন।');
    // Refresh background state
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Banner Contact Information */}
      <div className="bg-emerald-600 text-slate-100 text-[11px] sm:text-xs font-semibold py-2 px-4 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5 sm:gap-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            পাবনা সদরের সেরা ও তাজা এবং ফরমালিন মুক্ত সিজনাল লাভজনক অফার সমূহ!
          </span>
          <div className="flex items-center gap-4 text-[10px] sm:text-xs">
            <span className="font-mono">📞 ফোন করুন: ০১৭৮৬-৮০৩৮৯৯</span>
            <span className="hidden md:inline font-mono">✉️ seasonalfool@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm z-30 pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-102 transition-transform">
              <Leaf className="w-5 h-5 fill-emerald-100/10 text-white animate-float" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-emerald-600 transition-colors">
                সিজনাল ফল
              </h1>
              <p className="text-[10px] text-slate-400 font-bold leading-none mt-0.5">সবচেয়ে সতেজ ও প্রাকৃতিকভাবে তাজা</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'store'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" /> ফল স্টোর
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" /> অর্ডার ট্র্যাক
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" /> স্টাফ পোর্টাল
            </button>

            {/* Dynamic Sticky shopping basket count trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main container pages content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'store' && (
          <StoreFront
            fruits={fruits}
            cartItems={cartItems}
            isLoading={isLoadingFruits}
            onAddToBag={handleAddToBag}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenTracker={() => setActiveTab('track')}
          />
        )}

        {activeTab === 'track' && (
          <OrderTracker initialOrderId={activeTrackOrderId} />
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
            fruits={fruits} 
            orders={orders} 
            onRefresh={loadAllData} 
          />
        )}
      </main>

      {/* Sliding shopping cart overlay component */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderConfirmed}
      />

      {/* Micro Status Alert Toast banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-800 text-xs font-bold leading-none max-w-sm"
          >
            <Check className="w-4.5 h-4.5 text-emerald-400 bg-emerald-500/10 rounded-full p-0.5" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Footer section */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo brand & details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Leaf className="w-4.5 h-4.5 fill-emerald-100/10" />
              </div>
              <h3 className="text-lg font-black tracking-wide text-white">সিজনাল ফল</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
              ❤️ তাজা, রসালো ও প্রাকৃতিক সিজনাল ফল ❤️ আপনার সুস্থ জীবনের প্রতিস্রুতি ❤️ <br />
              আমরা সরাসরি পাবনা এবং ঈশ্বরদীর বিখ্যাত চাষীদের বাগান থেকে বিষমুক্ত ও শতভাগ ফরমালিন মুক্ত তাজা মৌসুমী ফল সংগ্রহ করে নিরাপদ প্যাকেজিংয়ে দ্রুত ডেলিভারী দিয়ে থাকি।
            </p>
            <p className="text-xs text-emerald-500 font-bold">
              📍 পাবনা সদর, পাবনা, Pabna, Bangladesh, 6600
            </p>
          </div>

          {/* Quick tabs links */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm">সহজ লিংক</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('store')} className="hover:text-emerald-400 transition-colors text-left cursor-pointer pointer-events-auto">
                  তাজা ফল স্টোর
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('track')} className="hover:text-emerald-400 transition-colors text-left cursor-pointer pointer-events-auto">
                  কনফার্মড অর্ডার ট্র্যাকিং
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('admin')} className="hover:text-emerald-400 transition-colors text-left cursor-pointer pointer-events-auto">
                  স্টাফ অ্যাডমিন প্যানেল
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details info */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-sm">যোগাযোগ করুন</h4>
            <div className="space-y-2 text-xs leading-relaxed font-semibold">
              <p>মোবাইল: ০১৭৮৬-৮০৩৮৯৯</p>
              <p>হটলাইন: +৮৮০ ১৭৮৬-৮০৩৮৯৯</p>
              <p className="font-mono">ইমেইল: seasonalfool@gmail.com</p>
              <p className="text-slate-500 font-normal mt-2 text-[10px]">সার্ভিস স্ট্যাটাস: ২৪ ঘণ্টা খোলা (Always open)</p>
            </div>
          </div>
        </div>

        {/* copyright base */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 mt-12 border-t border-slate-800 text-center text-[11px] text-slate-500 font-medium">
          <p>© ২০২৬ সিজনাল ফল পাবনা। সর্বস্বত্ব সংরক্ষিত। প্রাকৃতিকভাবে সতেজ ও পুষ্টিকর জীবনের নিশ্চয়তা।</p>
        </div>
      </footer>
    </div>
  );
}
