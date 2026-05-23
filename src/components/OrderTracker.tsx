import React, { useState, useEffect } from 'react';
import { getOrder } from '../data/dbHelper';
import { Order } from '../types';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  FileText, 
  Coins, 
  AlertCircle,
  Copy,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrderTrackerProps {
  initialOrderId?: string | null;
}

export default function OrderTracker({ initialOrderId }: OrderTrackerProps) {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');
  const [copied, setCopied] = useState(false);

  // Trigger search on mount if initialOrderId is passed in
  useEffect(() => {
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      handleTrackOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const handleTrackOrder = async (targetId?: string) => {
    const id = targetId || orderIdInput.trim();
    if (!id) {
      setErrorStatus('দয়া করে একটি সঠিক অর্ডার ID টাইপ করুন');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    setSearchedOrder(null);
    
    try {
      const order = await getOrder(id);
      if (order) {
        setSearchedOrder(order);
      } else {
        setErrorStatus('দুঃখিত! এই ID দিয়ে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক ID দিন।');
      }
    } catch (err) {
      console.error(err);
      setErrorStatus('সার্ভার থেকে অর্ডার ট্র্যাকিং তথ্য পেতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status mapping
  const statusSteps = [
    { key: 'Pending', label: 'অর্ডার গৃহিত হয়েছে', desc: 'অর্ডারটি সিস্টেমে এসেছে এবং যাচায়ের অপেক্ষায় রয়েছে।', icon: Clock },
    { key: 'Confirmed', label: 'নিশ্চিত করা হয়েছে', desc: 'পাবনার কার্যালয় থেকে অর্ডারটি কনফার্ম করা হয়েছে।', icon: FileText },
    { key: 'Processing', label: 'প্যাকেজিং ও প্রসেসিং', desc: 'গাছ থেকে তাজা ফল সংগ্রহ ও উপযুক্ত ক্যাভিটি বক্সে প্যাকেজিং চলছে।', icon: Package },
    { key: 'Shipped', label: 'ডেলিভারীর উদ্দেশ্যে রওয়ানা', desc: 'আমাদের ফার্স্ট এক্সপ্রেস রাইডার পাবনা থেকে আপনার ঠিকানায় রওয়ানা দিয়েছে।', icon: Truck },
    { key: 'Delivered', label: 'সফলভাবে ডেলিভারী সম্পন্ন', desc: 'অর্গানিক মিষ্টি সিজনাল ফল সফলভাবে গ্রাহকের হাতে পৌঁছেছে।', icon: CheckCircle },
  ];

  const getStepIndex = (status: Order['status']) => {
    if (status === 'Cancelled') return -1;
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStepIndex = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Search section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-2">আপনার অর্ডার ট্র্যাক করুন</h2>
        <p className="text-slate-500 text-xs md:text-sm text-center mb-6">আমাদের ফাস্ট ও রিয়েল-টাইম ট্র্যাকিং এর মাধ্যমে আপনার ফলের চলমান অবস্থান জানুন</p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="আপনার অর্ডার ID দিন (যেমন: aB9x_yZ8)..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold tracking-wide"
            />
          </div>
          <button
            onClick={() => handleTrackOrder()}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md text-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {isLoading ? 'খোঁজা হচ্ছে...' : 'অবস্থান ট্র্যাক করুন'}
          </button>
        </div>

        {errorStatus && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorStatus}</span>
          </div>
        )}
      </div>

      {/* Searched Order Result Visualization */}
      {searchedOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Tracking */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-start gap-4 flex-wrap border-b pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 tracking-wider">অর্ডার ট্র্যাকিং আইডি</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm bg-slate-100 px-3 py-1 text-slate-800 rounded-lg bold font-bold tracking-widest">{searchedOrder.id}</span>
                  <button 
                    onClick={() => copyToClipboard(searchedOrder.id)}
                    className="p-1 px-2 border hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block tracking-wider">অর্ডার করার সময়</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block font-mono">
                  {new Date(searchedOrder.createdAt).toLocaleString('bn-BD', { hour12: true })}
                </span>
              </div>
            </div>

            {/* Cancelled Alert Box */}
            {searchedOrder.status === 'Cancelled' ? (
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h4 className="font-bold text-rose-800 text-lg">অর্ডারটি বাতিল করা হয়েছে!</h4>
                <p className="text-sm text-rose-600 font-semibold">অনুগ্রহ করে কোনো অনুসন্ধানের জন্য আমাদের ফোন নম্বরে যোগাযোগ করুন (০১৭৮৬-৮০৩৮৯৯)।</p>
              </div>
            ) : (
              /* Timeline Rendering */
              <div className="relative pl-6 md:pl-8 space-y-8">
                {/* Visual Line */}
                <div 
                  className="absolute left-3.5 md:left-4.5 top-2 bottom-2 w-0.5 bg-slate-100"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, #10b981 ${Math.max(0, currentStepIndex) * 25}%, #f1f5f9 ${Math.max(0, currentStepIndex) * 25}%)`
                  }}
                />

                {statusSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  
                  return (
                    <div key={step.key} className="relative flex gap-4 md:gap-6 items-start">
                      {/* Circle indicator */}
                      <div 
                        className={`absolute -left-6.5 md:-left-8.5 w-[30px] h-[30px] md:w-[36px] md:h-[36px] rounded-full border-4 flex items-center justify-center transition-all z-10 ${
                          isCompleted
                            ? 'bg-emerald-600 border-white text-white shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-300'
                        } ${isCurrent ? 'animate-pulse ring-4 ring-emerald-500/30' : ''}`}
                      >
                        <StepIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>

                      <div className="flex-1 md:pl-2">
                        <h4 className={`font-bold text-sm md:text-base leading-none ${
                          isCompleted ? 'text-slate-900 font-extrabold' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </h4>
                        {isCompleted && (
                          <p className="text-xs text-slate-400 mt-1 md:mt-1.5 leading-relaxed font-medium">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Receipt details */}
          <div className="space-y-6">
            {/* Customer Details info block */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2 text-sm">ডেলিভারী ও পেমেন্ট সামারি</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 w-16">গ্রাহক:</span>
                  <span className="text-slate-800 font-bold">{searchedOrder.customerName}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 w-16">মোবাইল:</span>
                  <span className="text-slate-800 font-semibold font-mono">{searchedOrder.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 w-16">ঠিকানা:</span>
                  <span className="text-slate-600 flex-1 leading-relaxed font-semibold">{searchedOrder.address}</span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 w-16">পদ্ধতি:</span>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-black text-[10px]">{searchedOrder.paymentMethod}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 w-16">পেমেন্ট:</span>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    searchedOrder.paymentStatus === 'Paid' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>{searchedOrder.paymentStatus === 'Paid' ? 'পরিশোধিত' : 'বকেয়া (COD)'}</span>
                </div>

                {searchedOrder.transactionId && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <span className="font-bold text-slate-400 w-16">Trx ID:</span>
                    <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded text-[11px] font-bold tracking-wider">{searchedOrder.transactionId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt calculation list */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2 text-sm">ক্রয়কৃত পণ্যের তালিকা</h3>
              
              <div className="space-y-3">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-slate-400 text-[10px]">{item.quantity} {item.unit} × ৳{item.price}</p>
                    </div>
                    <span className="font-bold text-slate-800">৳{item.price * item.quantity}</span>
                  </div>
                ))}

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex justify-between items-center font-bold text-slate-900 text-xs">
                  <span>মোট অংক (Total)</span>
                  <span className="text-base text-rose-500 font-extrabold">৳{searchedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
