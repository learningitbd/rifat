import React, { useState, useMemo } from 'react';
import { Fruit, CartItem, OrderItem, Order } from '../types';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  ChevronLeft, 
  CreditCard, 
  ChevronRight,
  CheckCircle,
  Copy,
  Info,
  Loader2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { placeOrder } from '../data/dbHelper';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQty: (fruitId: string, q: number) => void;
  onRemoveItem: (fruitId: string) => void;
  onClearCart: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export default function Cart({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  isOpen,
  onClose,
  onOrderPlaced
}: CartProps) {
  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Cash-on-Delivery'>('Cash-on-Delivery');
  
  // Mobile payment simulator state
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Flow screen: 'cart' | 'checkout'
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [copiedId, setCopiedId] = useState(false);

  // Math totals
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + (curr.fruit.price * curr.quantity), 0);
  }, [cartItems]);

  const deliveryCharge = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal > 1000 ? 0 : 60; // Free delivery for orders above 1000 BDT
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return subtotal + deliveryCharge;
  }, [subtotal, deliveryCharge]);

  const handleQtyChange = (itemId: string, currentQty: number, change: number) => {
    const next = currentQty + change;
    if (next <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQty(itemId, next);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const validateForm = () => {
    if (!customerName.trim()) return 'আপনার নাম লিখুন';
    if (!phone.trim()) return 'মোবাইল নম্বর লিখুন';
    if (!/^01[3-9]\d{8}$/.test(phone.trim())) return 'সঠিক ১১-ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন';
    if (!address.trim()) return 'সরবরাহের ঠিকানা লিখুন';
    if (paymentMethod !== 'Cash-on-Delivery' && !transactionId.trim()) {
      return `দয়া করে ${paymentMethod} ট্রানজেকশন ID এবং পেমেন্ট সম্পন্ন করুন`;
    }
    return '';
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const err = validateForm();
    if (err) {
      setErrorMessage(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        fruitId: item.fruit.id,
        name: item.fruit.name,
        price: item.fruit.price,
        quantity: item.quantity,
        unit: item.fruit.unit
      }));

      const newOrder: Omit<Order, 'id'> = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash-on-Delivery' ? 'Pending' : 'Paid',
        transactionId: paymentMethod === 'Cash-on-Delivery' ? '' : transactionId.trim(),
        status: 'Pending',
        items: orderItems,
        totalAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const orderId = await placeOrder(newOrder);
      
      // Successfully placed order! Clear states
      onClearCart();
      setCustomerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTransactionId('');
      setStep('cart');
      setIsSubmitting(false);
      onOrderPlaced(orderId);
    } catch (error) {
      console.error(error);
      setErrorMessage('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Cart Slider */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-20 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800 text-lg">আপনার শপিং ব্যাগ</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              <ShoppingBag className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600 text-lg">আপনার ব্যাগ খালি রয়েছে!</p>
            <p className="text-sm text-slate-400 mt-1 max-w-[240px]">স্টোরপেইজ থেকে আপনার পছন্দের তাজা ও সুস্বাদু ফল নির্বাচন করে ব্যাগে যোগ করুন।</p>
            <button
              onClick={onClose}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-full shadow transition-all text-sm"
            >
              ফল কেনাকাটা শুরু করুন
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {step === 'cart' ? (
              /* Step 1: Cart Listing */
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.fruit.id}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50"
                    >
                      <img 
                        src={item.fruit.image} 
                        alt={item.fruit.name} 
                        className="w-16 h-16 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm">{item.fruit.name}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">৳{item.fruit.price} / {item.fruit.unit}</span>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden scale-90 origin-left">
                            <button
                              onClick={() => handleQtyChange(item.fruit.id, item.quantity, -1)}
                              className="p-1 px-2.5 hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-bold text-slate-700 text-xs">{item.quantity}</span>
                            <button
                              onClick={() => handleQtyChange(item.fruit.id, item.quantity, 1)}
                              disabled={item.quantity >= item.fruit.stock}
                              className="p-1 px-2.5 hover:bg-slate-50 text-slate-500 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => onRemoveItem(item.fruit.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between">
                        <span className="font-bold text-slate-800 text-sm">৳{item.fruit.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Foot Calculations */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-slate-500 font-medium">
                      <span>সাবটোটাল</span>
                      <span>৳{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 font-medium">
                      <span>সরবরাহ খরচ (ডেলিভারী চার্জ)</span>
                      <span>{deliveryCharge === 0 ? <strong className="text-emerald-600">ফ্রি</strong> : `৳${deliveryCharge}`}</span>
                    </div>
                    {deliveryCharge > 0 && (
                      <p className="text-[10px] text-amber-600">১০% ফ্রি অফার: ১০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারী!</p>
                    )}
                    <div className="h-px bg-slate-200 my-4" />
                    <div className="flex justify-between text-base font-bold text-slate-950">
                      <span>সর্বমোট</span>
                      <span className="text-xl font-extrabold text-rose-500">৳{totalAmount}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/15 transition-all text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    চেকআউট করতে এগিয়ে যান <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Checkout Form & simulated secure payments */
              <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Back to Cart link */}
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 pointer-events-auto"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> শপিং ব্যাগে ফিরে যান
                  </button>

                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium">
                    <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>সিকিউর ২৫৬-বিট ইনক্রিপশন চেকআউট</span>
                  </div>

                  {/* Delivery details */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm border-b pb-2">ডেলিভারী ও কন্টাক্ট ইনফো</h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">আপনার নাম <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="যেমন: মোঃ সাকিব হাসান"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="যেমন: 017xxxxxxxx"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ইমেইল (ঐচ্ছিক)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="যেমন: customer@gmail.com"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">ডেলিভারী ঠিকানা <span className="text-rose-500">*</span></label>
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="যেমন: বাসা নং ১২, রোড ০৩, রাধানগর, পাবনা সদর, পাবনা।"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment option */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm border-b pb-2">মূল্য পরিশোধের পদ্ধতি (Payment)</h3>
                    
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('Cash-on-Delivery');
                          setTransactionId('');
                        }}
                        className={`p-3 rounded-xl border font-bold text-xs text-center transition-all flex flex-col items-center justify-center gap-1.5 leading-tight ${
                          paymentMethod === 'Cash-on-Delivery'
                            ? 'border-slate-800 bg-slate-900 text-white'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                         ক্যাশ অন ডেলিভারী
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bKash')}
                        className={`p-3 rounded-xl border font-bold text-xs text-center transition-all flex flex-col items-center justify-center gap-1.5 leading-tight ${
                          paymentMethod === 'bKash'
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-pink-100 hover:bg-pink-50/20 text-pink-600'
                        }`}
                      >
                        বিকাশ (bKash)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Nagad')}
                        className={`p-3 rounded-xl border font-bold text-xs text-center transition-all flex flex-col items-center justify-center gap-1.5 leading-tight ${
                          paymentMethod === 'Nagad'
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-orange-50 hover:bg-orange-50/20 text-orange-600'
                        }`}
                      >
                        নগদ (Nagad)
                      </button>
                    </div>

                    {/* Mobile Banking secure payment instructions panel */}
                    {paymentMethod !== 'Cash-on-Delivery' && (
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs space-y-3.5 text-slate-600">
                        <div className="flex items-start gap-2 text-slate-700">
                          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="font-semibold">{paymentMethod} পেমেন্ট নির্দেশনা:</p>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 font-medium pl-1">
                          <li>আপনার মোবাইল থেকে {paymentMethod} অ্যাকাউন্টে প্রবেশ করুন।</li>
                          <li>Personal নাম্বারে <strong>Send Money</strong> নির্বাচন করুন।</li>
                          <li>নাম্বার ঘরে টাইপ করুন: <strong className="text-slate-900 text-sm font-mono tracking-wider ml-1">০১৭৮৬-৮০৩৮৯৯</strong></li>
                          <li>টাকার পরিমাণ লিখুন: <strong className="text-rose-500 text-sm font-bold font-mono">৳{totalAmount}</strong></li>
                          <li>পেমেন্ট সম্পন্ন করে নিচের ইনপুটে Transaction ID (যেমন: 8X9M10KL) টাইপ করুন।</li>
                        </ol>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Transaction ID টাইপ করুন <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                            placeholder="যেমন: TR79DJK3M8"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-xs uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800 tracking-widest font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 mx-6 mb-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Footer Submit */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 px-1">
                    <span>টোটাল পরিশোধযোগ্য পরিমাণ</span>
                    <span className="text-lg font-extrabold text-rose-600">৳{totalAmount}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> অর্ডার সাবমিট হচ্ছে...
                      </>
                    ) : (
                      'অর্ডার সম্পন্ন করুন'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
