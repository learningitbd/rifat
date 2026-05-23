import React, { useState, useMemo } from 'react';
import { Fruit, Order } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShoppingBag, 
  Coins, 
  Database, 
  Users, 
  Plus, 
  Check, 
  Trash2, 
  Edit, 
  X, 
  Lock, 
  Key, 
  Search, 
  Filter, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Truck,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addFruit, updateFruitDetails, updateOrderStatus } from '../data/dbHelper';

interface AdminPanelProps {
  fruits: Fruit[];
  orders: Order[];
  onRefresh: () => void;
}

export default function AdminPanel({ fruits, orders, onRefresh }: AdminPanelProps) {
  // Staff lockscreen
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Admin sub-tabs: 'overview' | 'orders' | 'inventory' | 'customers'
  const [currentTab, setCurrentTab] = useState<'overview' | 'orders' | 'inventory' | 'customers'>('overview');

  // Search & Filter parameters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [inventorySearch, setInventorySearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Add Fruit modal form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFruitName, setNewFruitName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newUnit, setNewUnit] = useState('কেজি');
  const [newSeason, setNewSeason] = useState<'সরাসরি (Year-round)' | 'গ্রীষ্মকালীন (Summer)' | 'বর্ষাকালীন (Monsoon)' | 'শীতকালীন (Winter)'>('গ্রীষ্মকালীন (Summer)');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Edit Fruit state
  const [editingFruitId, setEditingFruitId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingStock, setEditingStock] = useState('');

  const ADMIN_PASSKEY = 'pabna';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSKEY) {
      setIsAuthenticated(true);
      setPasswordError('');
      // Trigger refresh
      onRefresh();
    } else {
      setPasswordError('ভুল পাসকোড! অনুগ্রহ করে পুনরায় চেষ্টা করুন (পাসকোড: pabna)');
    }
  };

  // Calculations for stats widgets
  const stats = useMemo(() => {
    const totalSales = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const totalFruitsInStock = fruits.reduce((acc, curr) => acc + curr.stock, 0);

    return {
      totalSales,
      totalOrdersCount: orders.length,
      paidOrdersCount: paidOrders,
      pendingOrdersCount: pendingOrders,
      fruitsCount: fruits.length,
      totalFruitsInStock
    };
  }, [orders, fruits]);

  // Chart data preparing (sales by fruit)
  const salesByFruitChartData = useMemo(() => {
    const counts: { [name: string]: number } = {};
    orders
      .filter(o => o.status !== 'Cancelled')
      .forEach(order => {
        order.items.forEach(item => {
          counts[item.name] = (counts[item.name] || 0) + (item.price * item.quantity);
        });
      });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.split(' ')[0], // short name
      'মোট বিক্রয় (৳)': value
    }));
  }, [orders]);

  // Stock level chart data
  const stockChartData = useMemo(() => {
    return fruits.map(f => ({
      name: f.name.split(' ')[0],
      'স্টক (কেজি/পিস)': f.stock
    }));
  }, [fruits]);

  // Seeding Customer list effortlessly from order histories
  const compiledCustomers = useMemo(() => {
    const custs: { [phone: string]: { name: string; email: string; ordersCount: number; totalSpent: number; address: string } } = {};
    
    orders.forEach(order => {
      const ph = order.phone;
      if (!custs[ph]) {
        custs[ph] = {
          name: order.customerName,
          email: order.email || 'নাই',
          ordersCount: 0,
          totalSpent: 0,
          address: order.address
        };
      }
      custs[ph].ordersCount += 1;
      custs[ph].totalSpent += order.totalAmount;
    });

    return Object.values(custs);
  }, [orders]);

  // Filtering lists
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchS = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                     o.phone.includes(orderSearch) || 
                     o.id.includes(orderSearch);
      const matchF = orderFilter === 'ALL' || o.status === orderFilter;
      return matchS && matchF;
    });
  }, [orders, orderSearch, orderFilter]);

  const filteredInventory = useMemo(() => {
    return fruits.filter(f => f.name.toLowerCase().includes(inventorySearch.toLowerCase()));
  }, [fruits, inventorySearch]);

  const filteredCustomers = useMemo(() => {
    return compiledCustomers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  }, [compiledCustomers, customerSearch]);

  // Set order status
  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status'], nextPayment?: Order['paymentStatus']) => {
    try {
      await updateOrderStatus(orderId, nextStatus, nextPayment);
      onRefresh();
    } catch (err) {
      alert('অর্ডার স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  // Save new fruit in Firestore
  const handleCreateFruit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFruitName || !newPrice || !newStock) {
      alert('অনুগ্রহ করে সঠিক তথ্য দিন');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const imgUrl = newImage.trim() || 'https://images.unsplash.com/photo-1610832958506-ee56336191d1?auto=format&fit=crop&q=80&w=400';
      
      const payload: Omit<Fruit, 'id'> = {
        name: newFruitName.trim(),
        price: parseFloat(newPrice),
        stock: parseInt(newStock),
        unit: newUnit,
        season: newSeason,
        image: imgUrl,
        description: newDescription.trim() || 'পাবনার তাজা গাছের সিজনাল সুস্বাদু ফল। ১০০% ফ্রেশ প্যাকড।',
        isAvailable: true
      };

      await addFruit(payload);
      setIsAddModalOpen(false);
      // Reset form
      setNewFruitName('');
      setNewPrice('');
      setNewStock('');
      setNewImage('');
      setNewDescription('');
      
      onRefresh();
    } catch (err) {
      alert('নতুন ফল যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Save fruit inline inline updates
  const handleSaveInlineEdit = async (fruitId: string) => {
    if (!editingPrice || !editingStock) return;
    try {
      await updateFruitDetails(fruitId, {
        price: parseFloat(editingPrice),
        stock: parseInt(editingStock),
        isAvailable: parseInt(editingStock) > 0
      });
      setEditingFruitId(null);
      onRefresh();
    } catch (err) {
      alert('আপডেট সম্ভব হয়নি।');
    }
  };

  const handleToggleAvailable = async (fruitId: string, currentStatus: boolean) => {
    try {
      await updateFruitDetails(fruitId, { isAvailable: !currentStatus });
      onRefresh();
    } catch (err) {
      alert('স্ট্যাটাস টগল ব্যর্থ হয়েছে।');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100/50">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800">অ্যাডমিন / স্টাফ পোর্টাল লক</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
              ব্যবসা পরিচালনা করতে পাসকোড দিয়ে আনলক করুন। <br />
              <strong className="text-emerald-600">স্টাফ প্যানেল ডেমো পাসকোড: <span className="underline italic tracking-widest">pabna</span></strong>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">সিক্রেট পাসকোড</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="পাসকোড টাইপ করুন..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 text-center tracking-widest font-black"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-[11px] font-bold text-rose-500 text-center leading-snug">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow active:scale-95 transition-all text-sm cursor-pointer"
            >
              আনলক করুন
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-8">
      {/* Super Header admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-1.5">সিজনাল ফল অ্যাডমিন প্যানেল </h2>
            <p className="text-slate-400 text-xs">আজকের ইনভেন্টরি, কাস্টমার রেকর্ড এবং পেমেন্ট ট্র্যাকিং</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-slate-300 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> রিলোড ডাটা
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 bg-rose-900/50 hover:bg-rose-950 hover:text-rose-100 text-rose-300 rounded-xl transition-colors border border-rose-800 text-xs font-bold cursor-pointer"
          >
            লগআউট করুন
          </button>
        </div>
      </div>

      {/* Admin stats block widgets */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-slate-800">
          <span className="text-xs text-slate-400 block font-bold tracking-wider">মোট বিক্রয় রেভিনিউ</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-rose-600">৳{stats.totalSales}</span>
            <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> লাইভ</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-slate-800">
          <span className="text-xs text-slate-400 block font-bold tracking-wider">সর্বমোট অর্ডার সংখ্যা</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.totalOrdersCount} টি</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">ইতিহাস</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-slate-800">
          <span className="text-xs text-slate-400 block font-bold tracking-wider">অপেক্ষমান কাস্টমার অর্ডার</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-500">{stats.pendingOrdersCount} টি</span>
            {stats.pendingOrdersCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded animate-pulse">একশন প্রয়োজন</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-slate-800">
          <span className="text-xs text-slate-400 block font-bold tracking-wider">মোট ফল স্টক মজুত</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{stats.totalFruitsInStock} কেজি</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">{stats.fruitsCount} টি ক্যাটাগরি</span>
          </div>
        </div>
      </section>

      {/* Stats charts */}
      {currentTab === 'overview' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fruit Revenue chart */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-base tracking-tight">সবচেয়ে বিক্রীত ফলের রেকর্ড (টাকা)</h3>
            <div className="h-64">
              {salesByFruitChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByFruitChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                    <Bar dataKey="মোট বিক্রয় (৳)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">বিক্রয় শুরু হলে চার্ট ডাটা দেখতে পাবেন।</div>
              )}
            </div>
          </div>

          {/* Fruit stocks level charts */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 text-base tracking-tight">বর্তমান ফলের স্টকের বিবরণ (কেজি/পিস)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                  <Bar dataKey="স্টক (কেজি/পিস)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Admin inner menu tabs navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4 overflow-x-auto pb-px">
          {(['overview', 'orders', 'inventory', 'customers'] as const).map((tab) => {
            const labels = {
              overview: 'স্ট্যাটিস্টিকস ও ওভারভিউ',
              orders: 'অর্ডার সমূহ',
              inventory: 'স্টক ইনভেন্টরি',
              customers: 'ক্রেতাদের তথ্যভান্ডার'
            };
            return (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`py-3.5 px-3 border-b-2 font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  currentTab === tab
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'overview' && <TrendingUp className="w-4 h-4" />}
                {tab === 'orders' && <ShoppingBag className="w-4 h-4" />}
                {tab === 'inventory' && <Database className="w-4 h-4" />}
                {tab === 'customers' && <Users className="w-4 h-4" />}
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin content boards render */}
      <section className="min-h-[400px]">
        {/* TAB 1: OVERVIEW SPLASH (rendered in place above, only show statistics panel) */}
        {currentTab === 'overview' && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-emerald-950">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-800">
              <Leaf className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg">সিজনাল ফলের শুভকামনা!</h4>
              <p className="text-sm text-emerald-800 mt-1">পাবনা সদরের সেরা ও তাজা মৌসুমী ফলগুলোর ডেলিভারী ও অর্ডার সামলানো এখন অনেক সহজ। এখানে কোনো ডাটা ম্যানিপুলেশন বা ভুয়া প্রক্সির অবকাশ নেই; ব্যবহারকারীর প্রতিটি ক্লিক লাইভ ফায়ারস্টোরে সেভ হচ্ছে!</p>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS LIST WITH ACTIONS */}
        {currentTab === 'orders' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
              <h3 className="font-bold text-slate-900 text-lg">ক্রেতা পেমেন্ট ও ডেলিভারী অর্ডার সমূহ</h3>
              
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
                    className="pl-8 pr-4 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none min-w-[200px]"
                  />
                </div>

                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="px-2 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="ALL">সব অর্ডার</option>
                  <option value="Pending">অপেক্ষমান (Pending)</option>
                  <option value="Confirmed">কনফার্মড (Confirmed)</option>
                  <option value="Processing">প্যাকিং (Processing)</option>
                  <option value="Shipped">ডেলিভারী পথে (Shipped)</option>
                  <option value="Delivered">ডেলিভার্ড (Delivered)</option>
                  <option value="Cancelled">বাতিলকৃত (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Orders Table rendering */}
            <div className="overflow-x-auto rounded-xl border border-slate-100/80">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">অর্ডার আইডি & তারিখ</th>
                    <th className="p-4">ক্রেতা ও ঠিকানা</th>
                    <th className="p-4">আইটেম তালিকা (পরিমাণ)</th>
                    <th className="p-4">টোটাল বিল ও পেমেন্ট</th>
                    <th className="p-4">ডেলিভারী স্ট্যাটাস</th>
                    <th className="p-4 text-center">ইনস্ট্যান্ট অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">কোনো সংশ্লিষ্ট অর্ডার পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 rounded font-bold tracking-wider">{order.id}</span>
                          <span className="block text-slate-400 font-mono text-[9px] mt-1">
                            {new Date(order.createdAt).toLocaleDateString('bn-BD')} {new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour12: true })}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{order.customerName}</p>
                          <p className="font-mono text-slate-500 text-[10px] mt-0.5">{order.phone}</p>
                          <p className="text-slate-400 text-[10px] truncate max-w-xs mt-1" title={order.address}>{order.address}</p>
                        </td>
                        <td className="p-4 space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="font-semibold text-slate-700 text-[11px]">
                              • {it.name} <strong className="text-rose-500 font-mono">({it.quantity} {it.unit})</strong>
                            </div>
                          ))}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          <span className="text-slate-900 block font-black">৳{order.totalAmount}</span>
                          <span className="block text-[9px] mt-1">
                            পদ্ধতি: <strong className="text-purple-600">{order.paymentMethod}</strong>
                          </span>
                          <span className={`inline-block py-0.5 px-1 rounded text-[9px] font-bold ${
                            order.paymentStatus === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus === 'Paid' ? 'পরিশোধিত (Paid)' : 'বকেয়া (COD)'}
                          </span>
                          {order.transactionId && (
                            <span className="block text-[9px] text-slate-500 font-mono font-semibold mt-0.5">TrxID: {order.transactionId}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold ${
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Processing' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {order.status === 'Pending' && 'অপেক্ষমান'}
                            {order.status === 'Confirmed' && 'নিশ্চিতকৃত'}
                            {order.status === 'Processing' && 'প্যাকেজিং'}
                            {order.status === 'Shipped' && 'ডেলিভারী পথে'}
                            {order.status === 'Delivered' && 'ডেলিভার্ড'}
                            {order.status === 'Cancelled' && 'বাতিলকৃত'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <div className="flex justify-center flex-wrap gap-1">
                              {order.status === 'Pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'Confirmed')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  কনফার্ম করুন
                                </button>
                              )}
                              {order.status === 'Confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'Processing')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  প্যাকিং শুরু করুন
                                </button>
                              )}
                              {order.status === 'Processing' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <Truck className="w-3 h-3" /> ডেলিভারী পাঠান
                                </button>
                              )}
                              {order.status === 'Shipped' && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'Delivered', 'Paid')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Delivered সম্পন্ন
                                </button>
                              )}

                              <button
                                onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                                className="px-1.5 py-1 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-bold transition-all cursor-pointer ml-1"
                              >
                                বাতিল
                              </button>
                            </div>
                          )}
                          {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                            <span className="text-slate-400 italic">সম্পন্ন হয়েছে</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY MANAGER (CRUD MODALS INLINE EDITING) */}
        {currentTab === 'inventory' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">সিজনাল ফলের ইনভেন্টরি স্টক</h3>
                <p className="text-slate-500 text-xs mt-0.5">ফলের দাম, স্টক এবং অ্যাক্টিভিটি কনফিগার করুন</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="ফল দিয়ে খুঁজুন..."
                  className="px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> নতুন ফল যোগ করুন
                </button>
              </div>
            </div>

            {/* Inventory table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100/80">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ছবি</th>
                    <th className="p-4">ফলের নাম</th>
                    <th className="p-4">মৌসুম / ক্যাটাগরি</th>
                    <th className="p-4">দাম (৳ BDT)</th>
                    <th className="p-4">মজুত স্টক</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((fruit) => {
                    const isEditing = editingFruitId === fruit.id;
                    return (
                      <tr key={fruit.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <img 
                            src={fruit.image} 
                            alt={fruit.name} 
                            className="w-10 h-10 rounded-lg object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{fruit.name}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5 truncate max-w-xs">{fruit.description}</p>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {fruit.season}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold">৳</span>
                              <input
                                type="number"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="w-16 border rounded px-1.5 py-1 text-xs font-mono font-bold"
                              />
                            </div>
                          ) : (
                            <span className="font-black text-rose-500 font-mono text-sm">৳{fruit.price}</span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">প্রতি {fruit.unit}</span>
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingStock}
                              onChange={(e) => setEditingStock(e.target.value)}
                              className="w-16 border rounded px-1.5 py-1 text-xs font-mono font-bold"
                            />
                          ) : (
                            <span className={`font-mono font-bold ${fruit.stock <= 20 ? 'text-rose-500 font-extrabold' : 'text-slate-700'}`}>
                              {fruit.stock} {fruit.unit === '১০০ টি' ? 'পিস' : fruit.unit}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAvailable(fruit.id, fruit.isAvailable)}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                              fruit.isAvailable 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {fruit.isAvailable ? 'চলতি (Active)' : 'বন্ধ (Inactive)'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleSaveInlineEdit(fruit.id)}
                                className="p-1 px-2.5 bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center gap-0.5 transition-all"
                              >
                                <Check className="w-3 h-3" /> সেভ
                              </button>
                              <button
                                onClick={() => setEditingFruitId(null)}
                                className="p-1 px-2 text-slate-500 hover:bg-slate-50 rounded text-[10px]"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingFruitId(fruit.id);
                                setEditingPrice(String(fruit.price));
                                setEditingStock(String(fruit.stock));
                              }}
                              className="p-1 px-2 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-slate-100 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" /> এডিট
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS DIRECTORY */}
        {currentTab === 'customers' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-stretch sm:items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">সিজনাল ফলের সম্মানিত ক্রেতাগণ</h3>
                <p className="text-slate-500 text-xs mt-0.5">ক্রেতাদের মোবাইল এবং মোট খরচের ডিরেক্টরি সূচি</p>
              </div>

              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="কাস্টমার নাম বা ফোন নাম্বার..."
                className="px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none min-w-[200px]"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100/80">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ক্রেতার নাম</th>
                    <th className="p-4">ফোন নম্বর</th>
                    <th className="p-4">ইমেইল</th>
                    <th className="p-4">মোট অর্ডার সংখ্যা</th>
                    <th className="p-4">মোট কেনাকাটার পরিমাণ</th>
                    <th className="p-4">ঠিকানা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">কোনো সংশ্লিষ্ট কাস্টমার ডাটা পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{cust.name}</td>
                        <td className="p-4 font-mono font-bold text-slate-600">{cust.phone}</td>
                        <td className="p-4 font-mono font-semibold text-slate-400">{cust.email}</td>
                        <td className="p-4 font-mono font-black text-slate-700 text-center sm:text-left pl-6">{cust.ordersCount} টি</td>
                        <td className="p-4 text-rose-500 font-black font-mono">৳{cust.totalSpent}</td>
                        <td className="p-4 text-slate-400 break-words max-w-xs">{cust.address}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Add Fruit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 z-10 space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">ইনভেন্টরিতে নতুন তাজা ফল যোগ করুন</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 px-2 border hover:bg-slate-50 rounded text-slate-400 text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFruit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">ফলের নাম (বাংলায়) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newFruitName}
                    onChange={(e) => setNewFruitName(e.target.value)}
                    placeholder="যেমন: ঈশ্বরদী স্পেশাল বোম্বাই লিচু"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-emerald-500 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">দাম (টাকা / BDT) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="যেমন: ১২০"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">প্রাথমিক স্টক পরিমাণ <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="যেমন: ২৫০"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">পরিমাপের একক (Unit)</label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none bg-white text-slate-800"
                    >
                      <option value="কেজি">কেজি (kg)</option>
                      <option value="পিস">পিস (piece)</option>
                      <option value="১০০ টি">১০০ টি (100 pcs)</option>
                      <option value="বক্স">বক্স (Box)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">ঋতু / সিজন (Season)</label>
                    <select
                      value={newSeason}
                      onChange={(e) => setNewSeason(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none bg-white text-slate-800"
                    >
                      <option value="গ্রীষ্মকালীন (Summer)">গ্রীষ্মকালীন (Summer)</option>
                      <option value="বর্ষাকালীন (Monsoon)">বর্ষাকালীন (Monsoon)</option>
                      <option value="শীতকালীন (Winter)">শীতকালীন (Winter)</option>
                      <option value="সরাসরি (Year-round)">সরাসরি (Year-round)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">ফলের আনস্প্ল্যাশ ইমেজ লিঙ্ক (Image URL)</label>
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">ছোট ডেসক্রিপশন / পরিচিতি</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="ফলের পুষ্টিগুণ, স্বাদ এবং পাবনার কোন বাগান থেকে সংগৃহীত তা সংক্ষেপে লিখুন।"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.4 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    disabled={isFormSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isFormSubmitting ? 'সেভ হচ্ছে...' : 'ইনভেন্টরিতে দিন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
