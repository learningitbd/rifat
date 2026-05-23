import React, { useState, useMemo } from 'react';
import { Fruit, CartItem } from '../types';
import { 
  Search, 
  Sparkles, 
  Leaf, 
  Info, 
  ShoppingBag, 
  Plus, 
  Minus, 
  ChevronRight, 
  Check, 
  X,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoreFrontProps {
  fruits: Fruit[];
  onAddToBag: (fruit: Fruit, qty: number) => void;
  cartItems: CartItem[];
  isLoading: boolean;
  onOpenCart: () => void;
  onOpenTracker: () => void;
}

export default function StoreFront({
  fruits,
  onAddToBag,
  cartItems,
  isLoading,
  onOpenCart,
  onOpenTracker
}: StoreFrontProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('সব (All)');
  const [activeFruitDetail, setActiveFruitDetail] = useState<Fruit | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Cart total items
  const cartTotalQty = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const seasonsList = ['সব (All)', 'গ্রীষ্মকালীন (Summer)', 'বর্ষাকালীন (Monsoon)', 'শীতকালীন (Winter)', 'সরাসরি (Year-round)'];

  // Filter fruits based on search & season category
  const filteredFruits = useMemo(() => {
    return fruits.filter((fruit) => {
      const matchesSearch = 
        fruit.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        fruit.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeason = selectedSeason === 'সব (All)' || fruit.season === selectedSeason;
      
      return matchesSearch && matchesSeason;
    });
  }, [fruits, searchTerm, selectedSeason]);

  const handleSimpleAdd = (e: React.MouseEvent, fruit: Fruit) => {
    e.stopPropagation();
    if (fruit.stock <= 0) return;
    onAddToBag(fruit, 1);
    
    // Trigger localized visual "Checked" feedback
    setAddedAnimationId(fruit.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1500);
  };

  const handleModalAdd = () => {
    if (activeFruitDetail) {
      onAddToBag(activeFruitDetail, modalQty);
      setActiveFruitDetail(null);
      setModalQty(1);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 py-16 px-4 md:py-24 rounded-3xl mb-12 shadow-sm border border-emerald-100/50">
        <div className="max-w-4xl mx-auto text-center relative z-15">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/70 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold mb-6"
          >
            <Sparkles className="w-3 px-0.5 h-3 text-amber-500 fill-amber-500" />
            <span>১০০% প্রাকৃতিকভাবে উৎপাদিত অর্গানিক ফল</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
          >
            তাজা, রসালো ও প্রাকৃতিক <br />
            <span className="text-emerald-600 font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">সিজনাল ফল</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed"
          >
            ❤️ আপনার সুস্থ জীবনের প্রতিশ্রুতি ❤️ <br />
            পাবনার সর্বশ্রেষ্ঠ বাগান থেকে সুমিষ্ট, ফরমালিন মুক্ত এবং সবচেয়ে ফ্রেশ ফল সরাসরি আপনার দুয়ারে। আমাদের প্রতিটি কামড়ে পাবেন সুমিষ্ট তৃপ্তি।
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button
              onClick={() => {
                const element = document.getElementById('fruit-catalog');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm pointer-events-auto"
            >
              আজকের কালেকশন <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenTracker}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg active:scale-95 transition-all text-sm pointer-events-auto"
            >
              <Clock className="w-4 h-4 text-emerald-400" /> অর্ডার ট্র্যাক করুন
            </button>
          </motion.div>
        </div>

        {/* Floating background graphics for dynamic look */}
        <div className="absolute top-1/4 -left-10 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-1/4 -right-10 w-40 h-40 bg-amber-200/40 rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
      </section>

      {/* Core Contact Info Bar */}
      <section className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 mb-12 shadow-sm grid md:grid-cols-3 gap-6 text-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-lg">ঠিকানা</h4>
            <p className="text-sm mt-1 text-slate-500">পাবনা সদর, পাবনা, বাংলাদেশ (Pabna, Bangladesh, 6600)</p>
          </div>
        </div>

        <div className="flex items-start gap-4 border-t md:border-t-0 md:border-x border-slate-100 pt-6 md:pt-0 md:px-6">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-lg">সার্ভিস সময়সূচি</h4>
            <p className="text-sm mt-1 text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Always Open (২৪ ঘণ্টা খোলা)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 border-t md:border-t-0 pt-6 md:pt-0">
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-lg">সরাসরি যোগাযোগ</h4>
            <p className="text-sm mt-0.5 text-slate-600 font-semibold font-mono">০১৭৮৬-৮০৩৮৯৯</p>
            <p className="text-xs text-slate-400 font-mono">seasonalfool@gmail.com</p>
          </div>
        </div>
      </section>

      {/* Search & Filtering Catalog */}
      <section id="fruit-catalog" className="scroll-mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">আমাদের সিজনাল ফল সমূহ</h2>
            <p className="text-slate-500 text-sm mt-1">সবচেয়ে সতেজ ও সস্তায় সুস্বাদু ফলের পসরা</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            {/* Search inputs */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ফল খুঁজুন (যেমন: আম, কাঁঠাল)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Season filter chips */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {seasonsList.map((season) => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSeason === season
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {season}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">তাজা ফল লোড হচ্ছে...</p>
          </div>
        ) : filteredFruits.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">দুঃখিত! এই ক্যাটাগরিতে কোনো ফল পাওয়া যায়নি।</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSeason('সব (All)');
              }}
              className="mt-4 text-emerald-600 font-semibold text-sm hover:underline"
            >
              সবগুলো ফল পুনরায় দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFruits.map((fruit) => (
              <motion.div
                key={fruit.id}
                layoutId={`fruit-card-${fruit.id}`}
                onClick={() => {
                  setActiveFruitDetail(fruit);
                  setModalQty(1);
                }}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                {/* Image & tag */}
                <div className="relative pt-[70%] bg-emerald-50/20 overflow-hidden">
                  <img
                    src={fruit.image}
                    alt={fruit.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                      {fruit.season.split(' ')[0]}
                    </span>
                    {fruit.stock > 0 && fruit.stock <= 20 && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        অল্প স্টক বাকি
                      </span>
                    )}
                  </div>
                </div>

                {/* Info body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {fruit.name}
                  </h3>
                  
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {fruit.description}
                  </p>

                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">প্রতি {fruit.unit}</span>
                      <span className="text-xl font-black text-rose-500 flex items-center">
                        ৳{fruit.price}
                      </span>
                    </div>

                    {fruit.stock > 0 ? (
                      <button
                        onClick={(e) => handleSimpleAdd(e, fruit)}
                        className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          addedAnimationId === fruit.id
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white group-hover:shadow-md'
                        }`}
                      >
                        {addedAnimationId === fruit.id ? (
                          <>
                            <Check className="w-4 h-4" /> যোগ হয়েছে
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" /> কিনুন
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200">
                        স্টক ফুরিয়েছে
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Fruit Detail Information Modal */}
      <AnimatePresence>
        {activeFruitDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFruitDetail(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveFruitDetail(null)}
                className="absolute top-4 right-4 z-20 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cover Image in Modal */}
              <div className="w-full md:w-1/2 relative bg-emerald-50/50 min-h-[220px]">
                <img
                  src={activeFruitDetail.image}
                  alt={activeFruitDetail.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {activeFruitDetail.season}
                </span>
              </div>

              {/* Form Content in Modal */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-600 tracking-wider">১০০% অর্গানিক সানি ফসল</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                    {activeFruitDetail.name}
                  </h3>
                  
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">৳{activeFruitDetail.price}</span>
                    <span className="text-xs text-slate-400">প্রতি {activeFruitDetail.unit}</span>
                  </div>

                  {/* Stock level info */}
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeFruitDetail.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                    <span className="text-xs text-slate-500">
                      {activeFruitDetail.stock > 0 ? (
                        <>স্টক পরিমাপ: <strong className="text-slate-800">{activeFruitDetail.stock} {activeFruitDetail.unit === '১০০ টি' ? 'পিস' : activeFruitDetail.unit}</strong></>
                      ) : (
                        'স্টক সাময়িকভাবে ফুরিয়েছে'
                      )}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs mt-4 leading-relaxed font-medium">
                    {activeFruitDetail.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  {activeFruitDetail.stock > 0 ? (
                    <div>
                      {/* Qty controller */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500">পরিমাণ নির্বাচন করুন</span>
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                          <button
                            onClick={() => setModalQty(m => Math.max(1, m - 1))}
                            disabled={modalQty === 1}
                            className="p-1 px-2.5 hover:bg-white text-slate-500 transition-colors disabled:opacity-40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-bold font-mono text-sm">{modalQty}</span>
                          <button
                            onClick={() => setModalQty(m => Math.min(activeFruitDetail.stock, m + 1))}
                            disabled={modalQty >= activeFruitDetail.stock}
                            className="p-1 px-2.5 hover:bg-white text-slate-500 transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={handleModalAdd}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-600/10 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" /> ব্যাগে যোগ করুন - ৳{activeFruitDetail.price * modalQty}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-semibold rounded-2xl">
                      স্টক পুনরায় লোড হওয়া পর্যন্ত অপেক্ষা করুন
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Quick Floating Sticky Button */}
      {cartTotalQty > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-6 right-6 z-40 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full p-4 pl-5 shadow-2xl active:scale-95 transition-all cursor-pointer flex items-center gap-3"
          onClick={onOpenCart}
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2.5 -right-2.5 bg-white text-rose-600 text-[10px] font-black rounded-full h-5 w-5 border-2 border-rose-500 flex items-center justify-center">
              {cartTotalQty}
            </span>
          </div>
          <span className="text-sm font-extrabold pr-1">৳{cartItems.reduce((acc, curr) => acc + (curr.fruit.price * curr.quantity), 0)}</span>
        </motion.div>
      )}
    </div>
  );
}
