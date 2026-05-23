import { INITIAL_FRUITS } from './data/fallbackFruits';
import { Fruit, CartItem, Order, OrderItem } from './types';
import './index.css';
import {
  getFruits,
  addFruit as dbAddFruit,
  updateFruitDetails as dbUpdateFruit,
  placeOrder as dbPlaceOrder,
  getOrder as dbGetOrder,
  getAllOrders as dbGetAllOrders,
  updateOrderStatus as dbUpdateOrderStatus
} from './data/dbHelper';

// -------------------------------------------------------------
// State Management
// -------------------------------------------------------------
let fruits: Fruit[] = [];
let orders: Order[] = [];
let cart: CartItem[] = [];

// Navigation State
type Tab = 'store' | 'track' | 'staff';
let activeTab: Tab = 'store';

// Search & Filter State
let searchQuery = '';
let selectedSeason = 'all';

// Admin Authentication State
let isStaffAuthenticated = false;

// Initialize Storage & Data
function initDatabase() {
  // 1. Initialise Fruits
  const storedFruits = localStorage.getItem('s_fruits');
  if (storedFruits) {
    try {
      fruits = JSON.parse(storedFruits);
    } catch (e) {
      fruits = [];
    }
  }
  
  if (fruits.length === 0) {
    fruits = INITIAL_FRUITS.map((f, idx) => ({
      ...f,
      id: `fruit-${idx + 1}`
    })) as Fruit[];
    saveFruitsToStorage();
  }

  // 2. Initialise Orders
  const storedOrders = localStorage.getItem('s_orders');
  if (storedOrders) {
    try {
      orders = JSON.parse(storedOrders);
    } catch (e) {
      orders = [];
    }
  } else {
    orders = [];
    saveOrdersToStorage();
  }

  // 3. Initialise Cart
  const storedCart = localStorage.getItem('s_cart');
  if (storedCart) {
    try {
      cart = JSON.parse(storedCart);
    } catch (e) {
      cart = [];
    }
  }
}

function saveFruitsToStorage() {
  localStorage.setItem('s_fruits', JSON.stringify(fruits));
}

function saveOrdersToStorage() {
  localStorage.setItem('s_orders', JSON.stringify(orders));
}

function saveCartToStorage() {
  localStorage.setItem('s_cart', JSON.stringify(cart));
}

// -------------------------------------------------------------
// UI Navigation Controllers
// -------------------------------------------------------------
function switchTab(newTab: Tab) {
  activeTab = newTab;

  // Header button focus styling
  const tabStore = document.getElementById('tab-store');
  const tabTrack = document.getElementById('tab-track');
  const tabStaff = document.getElementById('tab-staff');

  const viewStore = document.getElementById('view-store');
  const viewTrack = document.getElementById('view-track');
  const viewStaff = document.getElementById('view-staff');

  // De-activate all tabs
  [tabStore, tabTrack, tabStaff].forEach(btn => {
    btn?.classList.remove('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/15', 'bg-slate-900');
    btn?.classList.add('text-slate-600', 'hover:bg-slate-50');
  });

  // Activate chosen tab
  const activeBtn = newTab === 'store' ? tabStore : newTab === 'track' ? tabTrack : tabStaff;
  activeBtn?.classList.remove('text-slate-600', 'hover:bg-slate-50');
  if (newTab === 'staff') {
    activeBtn?.classList.add('bg-slate-900', 'text-white', 'shadow-md');
  } else {
    activeBtn?.classList.add('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/15');
  }

  // Hide all screens
  viewStore?.classList.add('hidden');
  viewTrack?.classList.add('hidden');
  viewStaff?.classList.add('hidden');

  // Show selected screen
  if (newTab === 'store') {
    viewStore?.classList.remove('hidden');
    renderStorefront();
  } else if (newTab === 'track') {
    viewTrack?.classList.remove('hidden');
    renderRecentTrackerList();
  } else if (newTab === 'staff') {
    viewStaff?.classList.remove('hidden');
    renderStaffInterface();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// Toast Alerts system
// -------------------------------------------------------------
function showToast(message: string, type: 'success' | 'info' | 'warn' = 'success') {
  const wrapper = document.getElementById('toast-wrapper');
  if (!wrapper) return;

  const toast = document.createElement('div');
  toast.className = 'bg-slate-900/95 backdrop-blur text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-800 text-xs font-bold leading-normal transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-auto max-w-sm';
  
  let iconColor = 'text-emerald-400 bg-emerald-500/10';
  if (type === 'warn') iconColor = 'text-amber-400 bg-amber-500/10';
  if (type === 'info') iconColor = 'text-sky-400 bg-sky-500/10';

  toast.innerHTML = `
    <span class="w-5 h-5 flex items-center justify-center p-0.5 rounded-full ${iconColor}">✓</span>
    <span class="flex-1">${message}</span>
  `;

  wrapper.appendChild(toast);

  // Trigger animation entering
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  }, 10);

  // Trigger transition exiting & removal
  setTimeout(() => {
    toast.classList.add('translate-y-[-10px]', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// -------------------------------------------------------------
// Rendering: Storefront Products
// -------------------------------------------------------------
function renderStorefront() {
  const loadingIndicator = document.getElementById('store-loading');
  const emptyState = document.getElementById('store-empty');
  const grid = document.getElementById('fruits-grid');

  if (!grid) return;

  // Hide loading instantly
  if (loadingIndicator) loadingIndicator.classList.add('hidden');

  // Apply filters
  const filteredFruits = fruits.filter(fruit => {
    const matchesSearch = fruit.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (fruit.description && fruit.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSeason = selectedSeason === 'all' || fruit.season === selectedSeason;
    
    return matchesSearch && matchesSeason;
  });

  // Render Empty State if no fruit matched
  if (filteredFruits.length === 0) {
    emptyState?.classList.remove('hidden');
    grid.innerHTML = '';
    return;
  } else {
    emptyState?.classList.add('hidden');
  }

  // Inject beautiful high-contrast fruit cards
  grid.innerHTML = filteredFruits.map(fruit => {
    const isOutOfStock = fruit.stock <= 0;
    const badgeText = isOutOfStock ? 'স্টক ফুরিয়েছে' : (fruit.stock < 10 ? 'সীমিত স্টক' : 'মজুদ আছে');
    const badgeColor = isOutOfStock 
      ? 'bg-rose-100 text-rose-700' 
      : (fruit.stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700');

    return `
      <div class="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group h-full">
        <!-- Thumbnail illustration -->
        <div class="relative aspect-video sm:aspect-square overflow-hidden bg-slate-100 max-h-56">
          <img 
            src="${fruit.image || 'https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&q=80&w=400'}" 
            alt="${fruit.name}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onerror="this.src='https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&q=80&w=400'"
          />
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black ${badgeColor}">
            ${badgeText}
          </span>
          <span class="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
            ${fruit.season.split(' ')[0]}
          </span>
        </div>

        <!-- Description Info Box -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-1.5">
            <h4 class="text-base font-black text-slate-900 leading-tight">${fruit.name}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-semibold">${fruit.description || 'সম্পূর্ণ বিষমুক্ত ও শতভাগ মেদহীন তাজা পুষ্টিকর রসালো মৌসুমি ফল।'}</p>
          </div>

          <div class="space-y-3 pt-1 border-t border-slate-50">
            <!-- Price and specs row -->
            <div class="flex items-baseline justify-between">
              <div class="text-slate-900">
                <span class="text-lg font-black">৳ ${fruit.price}</span>
                <span class="text-[11px] font-bold text-slate-400">/ ${fruit.unit}</span>
              </div>
              <span class="text-[10px] font-extrabold text-slate-400 font-mono">মজুদ: ${fruit.stock} ${fruit.unit}</span>
            </div>

            <!-- Quantitative item addition footer -->
            ${isOutOfStock ? `
              <button disabled class="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl text-xs font-black select-none pointer-events-none">
                স্টক আউট
              </button>
            ` : `
              <div class="flex gap-2">
                <div class="flex items-center bg-slate-100 rounded-xl px-1">
                  <button 
                    onclick="window.decreaseQtyInput('${fruit.id}')"
                    class="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >-</button>
                  <input 
                    type="number" 
                    id="qty-input-${fruit.id}" 
                    value="1" 
                    min="1" 
                    max="${fruit.stock}"
                    class="w-8 text-center bg-transparent border-0 text-xs font-black focus:ring-0 focus:outline-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                    onchange="window.validateQtyInput('${fruit.id}', ${fruit.stock})"
                  />
                  <button 
                    onclick="window.increaseQtyInput('${fruit.id}', ${fruit.stock})"
                    class="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                  >+</button>
                </div>
                <button 
                  onclick="window.addToCart('${fruit.id}')"
                  class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 select-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  <span>ব্যাগে রাখুন</span>
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Interactive Cart Operations & Cart UI State Drawer
// -------------------------------------------------------------
function toggleCart(open: boolean) {
  const sidebar = document.getElementById('cart-sidebar');
  const backdrop = document.getElementById('cart-backdrop');
  const itemBody = document.getElementById('cart-panel-body');

  if (!sidebar || !backdrop || !itemBody) return;

  if (open) {
    sidebar.classList.remove('hidden');
    renderCartDrawerList();
    setTimeout(() => {
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
      itemBody.classList.remove('translate-x-full');
      itemBody.classList.add('translate-x-0');
    }, 10);
  } else {
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    itemBody.classList.remove('translate-x-0');
    itemBody.classList.add('translate-x-full');
    setTimeout(() => {
      sidebar.classList.add('hidden');
    }, 300);
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  if (totalItems > 0) {
    badge.innerText = totalItems.toString();
    badge.classList.remove('hidden');
    // Bounce effect
    badge.classList.add('animate-bounce');
    setTimeout(() => {
      badge.classList.remove('animate-bounce');
    }, 800);
  } else {
    badge.classList.add('hidden');
  }
}

function renderCartDrawerList() {
  const wrapper = document.getElementById('cart-items-wrapper');
  const subtotalLabel = document.getElementById('label-cart-subtotal');
  const totalLabel = document.getElementById('label-cart-total');
  const checkoutSection = document.getElementById('cart-checkout-block');

  if (!wrapper || !subtotalLabel || !totalLabel || !checkoutSection) return;

  if (cart.length === 0) {
    wrapper.innerHTML = `
      <div class="py-24 text-center text-slate-400 space-y-4">
        <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <div class="space-y-1">
          <h4 class="text-slate-800 font-extrabold text-sm">শপিং ব্যাগটি সম্পূর্ণ খালি!</h4>
          <p class="text-[11px] leading-normal font-semibold">ফল স্টোর থেকে সুস্বাদু ও তাজা ফল ব্যাগে যুক্ত করুন</p>
        </div>
        <button 
          onclick="window.closeCart();" 
          class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-black transition-colors"
        >ফল স্টোর দেখুন</button>
      </div>
    `;
    checkoutSection.classList.add('hidden');
    subtotalLabel.innerText = '৳ ০';
    totalLabel.innerText = '৳ ০';
    return;
  }

  checkoutSection.classList.remove('hidden');

  let totalAmount = 0;

  wrapper.innerHTML = cart.map(item => {
    const itemTotal = item.fruit.price * item.quantity;
    totalAmount += itemTotal;

    return `
      <div class="flex items-center gap-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
        <img 
          src="${item.fruit.image || 'https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&q=80&w=150'}" 
          alt="${item.fruit.name}" 
          class="w-12 h-12 rounded-xl object-cover border border-slate-200"
          referrerPolicy="no-referrer"
        />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-black text-slate-900 truncate leading-tight">${item.fruit.name}</h4>
          <p class="text-[10px] text-slate-400 font-bold mt-0.5">৳ ${item.fruit.price} / ${item.fruit.unit}</p>
          <p class="text-xs font-extrabold text-emerald-600 mt-1">৳ ${itemTotal}</p>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <!-- Item count modifier -->
          <div class="flex items-center bg-white border border-slate-150 rounded-lg p-0.5 scale-90">
            <button 
              onclick="window.updateCartItemQty('${item.fruit.id}', ${item.quantity - 1})"
              class="w-5.5 h-5.5 flex items-center justify-center text-[10px] font-black text-slate-500 rounded hover:bg-slate-50"
            >-</button>
            <span class="w-6 text-center text-[10px] font-black text-slate-800">${item.quantity}</span>
            <button 
              onclick="window.updateCartItemQty('${item.fruit.id}', ${item.quantity + 1}, ${item.fruit.stock})"
              class="w-5.5 h-5.5 flex items-center justify-center text-[10px] font-black text-slate-500 rounded hover:bg-slate-50"
            >+</button>
          </div>
          <!-- Delete selector -->
          <button 
            onclick="window.removeCartItem('${item.fruit.id}')"
            class="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            মুছে ফেলুন
          </button>
        </div>
      </div>
    `;
  }).join('');

  subtotalLabel.innerText = `৳ ${totalAmount}`;
  totalLabel.innerText = `৳ ${totalAmount}`;
}

// Global scope bindings for inline script tags support
(window as any).decreaseQtyInput = (id: string) => {
  const el = document.getElementById(`qty-input-${id}`) as HTMLInputElement;
  if (!el) return;
  const val = parseInt(el.value) || 1;
  if (val > 1) el.value = (val - 1).toString();
};

(window as any).increaseQtyInput = (id: string, max: number) => {
  const el = document.getElementById(`qty-input-${id}`) as HTMLInputElement;
  if (!el) return;
  const val = parseInt(el.value) || 1;
  if (val < max) el.value = (val + 1).toString();
};

(window as any).validateQtyInput = (id: string, max: number) => {
  const el = document.getElementById(`qty-input-${id}`) as HTMLInputElement;
  if (!el) return;
  let val = parseInt(el.value) || 1;
  if (val < 1) val = 1;
  if (val > max) val = max;
  el.value = val.toString();
};

(window as any).addToCart = (id: string) => {
  const fruit = fruits.find(f => f.id === id);
  if (!fruit) return;

  const qtyEl = document.getElementById(`qty-input-${id}`) as HTMLInputElement;
  const addedQty = qtyEl ? (parseInt(qtyEl.value) || 1) : 1;

  const existingIdx = cart.findIndex(item => item.fruit.id === id);
  if (existingIdx > -1) {
    const nextQty = Math.min(fruit.stock, cart[existingIdx].quantity + addedQty);
    cart[existingIdx].quantity = nextQty;
  } else {
    cart.push({
      fruit,
      quantity: Math.min(fruit.stock, addedQty)
    });
  }

  saveCartToStorage();
  updateCartBadge();
  showToast(`"${fruit.name.split(' ')[0]}" শপিং ব্যাগে যুক্ত হয়েছে!`);
  
  if (qtyEl) qtyEl.value = '1'; // Reset count
};

(window as any).closeCart = () => {
  toggleCart(false);
};

(window as any).updateCartItemQty = (id: string, newQty: number, maxStock = 9999) => {
  if (newQty < 1) {
    (window as any).removeCartItem(id);
    return;
  }
  
  const idx = cart.findIndex(item => item.fruit.id === id);
  if (idx > -1) {
    cart[idx].quantity = Math.min(maxStock, newQty);
    saveCartToStorage();
    updateCartBadge();
    renderCartDrawerList();
  }
};

(window as any).removeCartItem = (id: string) => {
  const idx = cart.findIndex(item => item.fruit.id === id);
  if (idx > -1) {
    const name = cart[idx].fruit.name;
    cart.splice(idx, 1);
    saveCartToStorage();
    updateCartBadge();
    renderCartDrawerList();
    showToast(`"${name.split(' ')[0]}" শপিং ব্যাগ থেকে সরানো হয়েছে`, 'info');
  }
};

// -------------------------------------------------------------
// Interactive Checkout Submition
// -------------------------------------------------------------
function handleCheckout(e: Event) {
  e.preventDefault();

  if (cart.length === 0) {
    showToast('ডেলিভারি করতে কন্টেইনারে কম পক্ষে ১ টি ফল যোগ করুন!', 'warn');
    return;
  }

  const nameInput = document.getElementById('order-name') as HTMLInputElement;
  const phoneInput = document.getElementById('order-phone') as HTMLInputElement;
  const addressInput = document.getElementById('order-address') as HTMLInputElement;

  if (!nameInput || !phoneInput || !addressInput) return;

  // Formulate items
  const orderItems: OrderItem[] = cart.map(item => ({
    fruitId: item.fruit.id,
    name: item.fruit.name,
    price: item.fruit.price,
    quantity: item.quantity,
    unit: item.fruit.unit
  }));

  const totalAmount = cart.reduce((total, item) => total + (item.fruit.price * item.quantity), 0);

  // Doc IDs
  const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
  const orderId = `memo-${randomOrderNum}`;

  const newOrder: Order = {
    id: orderId,
    customerName: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: 'visitor@seasonal.com',
    address: addressInput.value.trim(),
    paymentMethod: 'Cash-on-Delivery',
    paymentStatus: 'Pending',
    status: 'Pending',
    items: orderItems,
    totalAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Adjust stock on fruits local state
  cart.forEach(item => {
    const fIdx = fruits.findIndex(f => f.id === item.fruit.id);
    if (fIdx > -1) {
      fruits[fIdx].stock = Math.max(0, fruits[fIdx].stock - item.quantity);
      if (fruits[fIdx].stock === 0) {
        fruits[fIdx].isAvailable = false;
      }
    }
  });

  // Save changes
  orders.unshift(newOrder);
  saveOrdersToStorage();
  saveFruitsToStorage();

  // Store recent order ID in localStorage for quick tracker query
  const recentPurchasesStr = localStorage.getItem('s_recent_memos');
  let recents: string[] = recentPurchasesStr ? JSON.parse(recentPurchasesStr) : [];
  if (!recents.includes(orderId)) {
    recents.unshift(orderId);
    localStorage.setItem('s_recent_memos', JSON.stringify(recents));
  }

  // Save order to Firebase Firestore (Real-Time DB Sync)
  dbPlaceOrder(newOrder).then((finalId) => {
    // Replace locally generated temporay ID with true Firestore ID
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      orders[idx].id = finalId;
    }
    
    // Refresh memo list
    let freshMemos = localStorage.getItem('s_recent_memos');
    let memosList: string[] = freshMemos ? JSON.parse(freshMemos) : [];
    memosList = memosList.map(item => item === orderId ? finalId : item);
    localStorage.setItem('s_recent_memos', JSON.stringify(memosList));
    
    saveOrdersToStorage();
    renderRecentTrackerList();

    // If currently tracking this temporary memo, refresh it with real Firestore memo
    const activeTracker = document.getElementById('track-id-input') as HTMLInputElement;
    if (activeTracker && (activeTracker.value === orderId || activeTracker.value === finalId)) {
      activeTracker.value = finalId;
      triggerOrderSearch(finalId);
    }
  }).catch((err) => {
    console.warn("Unable to sync checkout to Firestore:", err);
  });

  // Clear cart
  cart = [];
  saveCartToStorage();
  updateCartBadge();

  // Reset checkout form
  nameInput.value = '';
  phoneInput.value = '';
  addressInput.value = '';

  // Close Side Cart Drawer
  toggleCart(false);

  // Jump to tracker and search for this order ID automatically!
  showToast('আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে!', 'success');
  
  switchTab('track');
  const trackerInput = document.getElementById('track-id-input') as HTMLInputElement;
  if (trackerInput) {
    trackerInput.value = orderId;
    triggerOrderSearch(orderId);
  }
}

// -------------------------------------------------------------
// Rendering: Order Tracker System
// -------------------------------------------------------------
function renderOrderDetailBlock(foundOrder: Order) {
  const placeholder = document.getElementById('track-placeholder');
  const detailsBlock = document.getElementById('track-details-block');
  
  const labelId = document.getElementById('label-track-id');
  const labelStatus = document.getElementById('badge-track-status');
  const textName = document.getElementById('text-track-name');
  const textPhone = document.getElementById('text-track-phone');
  const textAddress = document.getElementById('text-track-address');
  const textTime = document.getElementById('text-track-time');
  const textTotal = document.getElementById('text-track-total');
  const itemsContainer = document.getElementById('item-track-table');

  if (!detailsBlock || !placeholder) return;

  // Hide placeholder
  placeholder.classList.add('hidden');
  detailsBlock.classList.remove('hidden');

  // Fill raw elements
  if (labelId) labelId.innerText = `Memo Code: ${foundOrder.id.toUpperCase()}`;
  
  // Format matching bangla status
  let banglaStatus = 'গৃহীত হয়েছে';
  if (foundOrder.status === 'Confirmed') banglaStatus = 'অর্ডার কনফার্মড';
  if (foundOrder.status === 'Processing') banglaStatus = 'প্যাকেজিং চলছে';
  if (foundOrder.status === 'Shipped') banglaStatus = 'ডেলিভারির পথে 🚴';
  if (foundOrder.status === 'Delivered') banglaStatus = 'ডেলিভারি সম্পন্ন 🎉';
  if (foundOrder.status === 'Cancelled') banglaStatus = 'বাতিল করা হয়েছে';

  if (labelStatus) {
    labelStatus.innerText = banglaStatus;
    labelStatus.className = 'font-black text-xs px-3.5 py-1.5 rounded-full shadow-sm ' + 
      (foundOrder.status === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white');
  }

  if (textName) textName.innerText = foundOrder.customerName;
  if (textPhone) textPhone.innerText = foundOrder.phone;
  if (textAddress) textAddress.innerText = foundOrder.address;

  // Format date
  const dateObj = new Date(foundOrder.createdAt);
  const formattedTime = dateObj.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  if (textTime) textTime.innerText = formattedTime;
  if (textTotal) textTotal.innerText = `৳ ${foundOrder.totalAmount}`;

  // Populate Ordered Fruits list
  if (itemsContainer) {
    itemsContainer.innerHTML = foundOrder.items.map(it => `
      <div class="px-4 py-3 flex justify-between items-center bg-slate-50/45 font-medium text-slate-700">
        <div class="space-y-0.5">
          <p class="font-extrabold text-slate-800 text-xs">${it.name}</p>
          <p class="text-[10px] text-slate-400">৳ ${it.price} x ${it.quantity} ${it.unit}</p>
        </div>
        <span class="text-xs font-bold text-slate-900">৳ ${it.price * it.quantity}</span>
      </div>
    `).join('');
  }

  // Update Progress Map Steps dynamically
  const stepList = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = stepList.indexOf(foundOrder.status);

  const timelineSteps = document.querySelectorAll('.timeline-step');
  timelineSteps.forEach(el => {
    const stepName = el.getAttribute('data-step') || '';
    const stepIndex = stepList.indexOf(stepName);
    const dot = el.querySelector('.step-dot');
    const title = el.querySelector('.step-title');

    if (!dot || !title) return;

    // Reset default styles
    dot.classList.remove('bg-emerald-500', 'border-emerald-200', 'border-white', 'text-white', 'bg-red-500');
    dot.classList.add('bg-slate-200');
    title.classList.remove('text-emerald-600', 'text-slate-900', 'text-red-600');
    title.classList.add('text-slate-700');

    if (foundOrder.status === 'Cancelled') {
      // If cancelled, color first dot red and others inactive
      if (stepIndex === 0) {
        dot.classList.remove('bg-slate-200');
        dot.classList.add('bg-red-500');
        title.classList.add('text-red-500');
      }
    } else {
      if (stepIndex <= currentStepIndex) {
        dot.classList.remove('bg-slate-200');
        dot.classList.add('bg-emerald-500', 'border-emerald-200');
        title.classList.add('text-emerald-600', 'font-black');
      }
    }
  });
}

function triggerOrderSearch(idStr: string) {
  const placeholder = document.getElementById('track-placeholder');
  const detailsBlock = document.getElementById('track-details-block');
  if (!placeholder || !detailsBlock) return;

  const memoId = idStr.trim();
  if (!memoId) return;

  const foundOrder = orders.find(o => o.id.toLowerCase() === memoId.toLowerCase());

  if (foundOrder) {
    // Show local cached order immediately
    renderOrderDetailBlock(foundOrder);
  } else {
    // Show live query loader
    placeholder.classList.remove('hidden');
    placeholder.innerHTML = `
      <div class="py-6 text-center items-center justify-center flex flex-col gap-2.5">
        <div class="w-7 h-7 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
        <p class="text-[11px] text-slate-500 font-bold">সার্ভারে মেমো "${memoId.toUpperCase()}" খোঁজা হচ্ছে...</p>
      </div>
    `;
    detailsBlock.classList.add('hidden');
  }

  // Live async Firestore fetch (guarantees real-time status!)
  dbGetOrder(memoId).then((liveOrder) => {
    if (liveOrder) {
      // Sync local orders array
      const idx = orders.findIndex(o => o.id === liveOrder.id);
      if (idx > -1) {
        orders[idx] = liveOrder;
      } else {
        orders.unshift(liveOrder);
      }
      saveOrdersToStorage();
      renderRecentTrackerList();
      
      // Render the latest up-to-date data
      renderOrderDetailBlock(liveOrder);
    } else if (!foundOrder) {
      placeholder.classList.remove('hidden');
      placeholder.innerHTML = `
        <div class="text-rose-500 font-extrabold flex items-center justify-center gap-1">
          <span>⚠️</span>
          <span>"${memoId}" - নামে কোনো মেমো ডেটাবেজে পাওয়া যায়নি! পিনকোডটি আবার চেক করুন।</span>
        </div>
      `;
      detailsBlock.classList.add('hidden');
    }
  }).catch((err) => {
    console.warn("Error tracking order from Firestore:", err);
    if (!foundOrder) {
      placeholder.classList.remove('hidden');
      placeholder.innerHTML = `
        <div class="text-rose-500 font-extrabold flex items-center justify-center gap-1">
          <span>⚠️</span>
          <span>সার্ভার থেকে ট্র্যাকিং তথ্য লোড করতে ব্যর্থ হয়েছে বা ক্লায়েন্ট অফলাইন!</span>
        </div>
      `;
    }
  });
}

function renderRecentTrackerList() {
  const recentsBox = document.getElementById('track-recents-box');
  const recentsList = document.getElementById('track-recents-list');
  
  if (!recentsBox || !recentsList) return;

  const purchasesStr = localStorage.getItem('s_recent_memos');
  const recents: string[] = purchasesStr ? JSON.parse(purchasesStr) : [];

  if (recents.length === 0) {
    recentsBox.classList.add('hidden');
    return;
  }

  recentsBox.classList.remove('hidden');
  recentsList.innerHTML = recents.map(memoId => `
    <button 
      onclick="window.quickTrack('${memoId}')"
      class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200/50 transition-all cursor-pointer"
    >
      ${memoId.toUpperCase()}
    </button>
  `).join('');
}

(window as any).quickTrack = (memoId: string) => {
  const trackerInput = document.getElementById('track-id-input') as HTMLInputElement;
  if (trackerInput) {
    trackerInput.value = memoId;
    triggerOrderSearch(memoId);
  }
};


// -------------------------------------------------------------
// Staff Portal Admin Interface & Password Validation
// -------------------------------------------------------------
function handleStaffVerification(pinCode: string) {
  if (pinCode.trim() === '১২৩৪' || pinCode === '1234') {
    isStaffAuthenticated = true;
    showToast('স্টাফ পিনকোড ভেরিফিকেশন সফল!', 'success');
    renderStaffInterface();
  } else {
    showToast('ভুল সিকিউরিটি কোড! আবার চেষ্টা করুন।', 'warn');
  }
}

function renderStaffInterface() {
  const gate = document.getElementById('staff-gate');
  const dashboard = document.getElementById('staff-dashboard');

  if (!gate || !dashboard) return;

  if (!isStaffAuthenticated) {
    gate.classList.remove('hidden');
    dashboard.classList.add('hidden');
    return;
  }

  gate.classList.add('hidden');
  dashboard.classList.remove('hidden');

  // Load stats counters
  calculateStaffStats();

  // Load orders table log
  renderStaffOrdersLog();

  // Load fruits stock list editor
  renderStaffFruitsList();
}

function calculateStaffStats() {
  const statRevenue = document.getElementById('stat-revenue');
  const statOrdersCount = document.getElementById('stat-orders-count');
  const statActiveDeliveries = document.getElementById('stat-active-deliveries');
  const statOutStockCount = document.getElementById('stat-out-stock-count');

  const ordersCountLabel = document.getElementById('staff-orders-count-label');
  const itemsCountLabel = document.getElementById('staff-items-count-label');

  if (!statRevenue || !statOrdersCount || !statActiveDeliveries || !statOutStockCount) return;

  // Revenue sums up ONLY completed or non-cancelled orders which are Paid
  const totalRev = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, curr) => sum + curr.totalAmount, 0);

  const activeDeliveriesCount = orders.filter(o => ['Confirmed', 'Processing', 'Shipped'].includes(o.status)).length;
  const outOfStockCount = fruits.filter(f => f.stock <= 0).length;

  statRevenue.innerText = `৳ ${totalRev}`;
  statOrdersCount.innerText = orders.length.toString();
  statActiveDeliveries.innerText = activeDeliveriesCount.toString();
  statOutStockCount.innerText = outOfStockCount.toString();

  if (ordersCountLabel) ordersCountLabel.innerText = `${orders.length} টি মোট অর্ডার`;
  if (itemsCountLabel) itemsCountLabel.innerText = `${fruits.length} টি ফল তালিকা`;
}

function renderStaffOrdersLog() {
  const container = document.getElementById('staff-orders-list');
  const emptyState = document.getElementById('staff-orders-empty');

  if (!container || !emptyState) return;

  if (orders.length === 0) {
    emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');

  container.innerHTML = orders.map(order => {
    // Dynamic Status Background Selectors
    let statusBadgeColor = 'bg-slate-100 text-slate-700';
    if (order.status === 'Confirmed') statusBadgeColor = 'bg-sky-100 text-sky-800';
    if (order.status === 'Processing') statusBadgeColor = 'bg-amber-100 text-amber-800';
    if (order.status === 'Shipped') statusBadgeColor = 'bg-indigo-100 text-indigo-800';
    if (order.status === 'Delivered') statusBadgeColor = 'bg-emerald-100 text-emerald-800';
    if (order.status === 'Cancelled') statusBadgeColor = 'bg-rose-100 text-rose-800';

    return `
      <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        
        <!-- Header info row -->
        <div class="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <span class="text-[10px] font-mono text-slate-400 block font-bold uppercase">${order.id.toUpperCase()}</span>
            <div class="flex items-center gap-2 mt-0.5">
              <h4 class="text-xs font-black text-slate-900">${order.customerName}</h4>
              <span class="text-[10px] text-slate-400 font-bold">•</span>
              <span class="text-[10px] font-mono text-slate-500 font-bold">${new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: 'numeric' })}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Order status selector changer -->
            <select 
              onchange="window.updateOrderStatus('${order.id}', this.value)"
              class="bg-slate-50 border border-slate-200 text-[10px] font-extrabold rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending (গৃহীত)</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed (নিশ্চিত)</option>
              <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing (প্যাকিং)</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped (পথে)</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered (ডেলিভারড)</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled (বাতিল)</option>
            </select>

            <button 
              onclick="window.deleteOrder('${order.id}')"
              class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg hover:text-rose-600 transition-colors"
              title="অর্ডার ডিলিট করুন"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        <!-- Middle Column Content details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div class="space-y-1">
            <p class="text-slate-400 text-[10px] uppercase font-bold">যোগাযোগের নম্বর:</p>
            <p class="text-slate-800 font-mono">${order.phone}</p>
            <p class="text-slate-400 text-[10px] uppercase font-bold pt-1">ডেলিভারি ঠিকানা:</p>
            <p class="text-slate-700 font-medium">${order.address}</p>
          </div>

          <!-- Items Ordered details -->
          <div class="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/70 space-y-2">
            <span class="text-slate-400 text-[10px] uppercase font-bold block">ক্রয়কৃত ফলের তালিকা:</span>
            <div class="space-y-1 max-h-24 overflow-y-auto pr-1">
              ${order.items.map(it => `
                <div class="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span>${it.name} (${it.quantity} ${it.unit})</span>
                  <span>৳ ${it.price * it.quantity}</span>
                </div>
              `).join('')}
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-200/50 text-slate-900 font-black">
              <span>সর্বমোট প্রদেয় বিল:</span>
              <span class="text-emerald-600 font-black">৳ ${order.totalAmount}</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

function renderStaffFruitsList() {
  const container = document.getElementById('staff-fruits-list');
  if (!container) return;

  container.innerHTML = fruits.map(fruit => {
    return `
      <div class="p-4 flex items-center gap-3.5 hover:bg-slate-50 transition-colors">
        <img 
          src="${fruit.image || 'https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&q=80&w=150'}" 
          alt="${fruit.name}" 
          class="w-10 h-10 rounded-xl object-cover border border-slate-200"
          referrerPolicy="no-referrer"
        />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-black text-slate-900 leading-tight truncate">${fruit.name}</h4>
          <p class="text-[10px] text-slate-400 font-bold mt-0.5">৳ ${fruit.price} / ${fruit.unit}</p>
          <p class="text-[10px] font-extrabold ${fruit.stock <= 0 ? 'text-rose-500 font-mono font-black' : 'text-slate-500'}">মজুদ: ${fruit.stock} ${fruit.unit}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button 
            onclick="window.editFruitTrigger('${fruit.id}')"
            class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="সম্পাদনা করুন"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button 
            onclick="window.deleteFruit('${fruit.id}')"
            class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="মুছে ফেলুন"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Global actions for staff panel operations
(window as any).updateOrderStatus = (orderId: string, nextStatus: any) => {
  const oIdx = orders.findIndex(o => o.id === orderId);
  if (oIdx > -1) {
    orders[oIdx].status = nextStatus;
    orders[oIdx].updatedAt = new Date().toISOString();
    
    let payStatus: any = undefined;
    // Auto mark as Paid when delivered
    if (nextStatus === 'Delivered') {
      orders[oIdx].paymentStatus = 'Paid';
      payStatus = 'Paid';
    }

    saveOrdersToStorage();
    calculateStaffStats();
    renderStaffOrdersLog();
    showToast(`মেমো "${orderId.toUpperCase()}"-এর স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে!`, 'info');

    // Live update in Firebase Firestore
    dbUpdateOrderStatus(orderId, nextStatus, payStatus).catch((err) => {
      console.warn("Unable to update order status in Firestore:", err);
    });
  }
};

(window as any).deleteOrder = (orderId: string) => {
  if (confirm(`আপনি কি আসলেও মেমো "${orderId.toUpperCase()}" মুছতে চাচ্ছেন?`)) {
    const oIdx = orders.findIndex(o => o.id === orderId);
    if (oIdx > -1) {
      orders.splice(oIdx, 1);
      saveOrdersToStorage();
      calculateStaffStats();
      renderStaffOrdersLog();
      showToast('অর্ডার ডাটাবেজ থেকে মুছে দেওয়া হয়েছে!', 'warn');
    }
  }
};

(window as any).deleteFruit = (fruitId: string) => {
  const selectedF = fruits.find(f => f.id === fruitId);
  const name = selectedF ? selectedF.name : 'ফলটি';
  if (confirm(`আপনি কি "${name}" ইনভেন্টরি থেকে চিরতরে মুছতে চান?`)) {
    const fIdx = fruits.findIndex(f => f.id === fruitId);
    if (fIdx > -1) {
      fruits.splice(fIdx, 1);
      saveFruitsToStorage();
      calculateStaffStats();
      renderStaffFruitsList();
      showToast('ফল ইনভেন্টরি থেকে বাদ দেওয়া হয়েছে!', 'warn');
    }
  }
};

(window as any).editFruitTrigger = (fruitId: string) => {
  const f = fruits.find(item => item.id === fruitId);
  if (!f) return;

  const modal = document.getElementById('fruit-modal');
  const title = document.getElementById('fruit-modal-title');
  
  const formId = document.getElementById('fruit-form-id') as HTMLInputElement;
  const formName = document.getElementById('fruit-form-name') as HTMLInputElement;
  const formPrice = document.getElementById('fruit-form-price') as HTMLInputElement;
  const formUnit = document.getElementById('fruit-form-unit') as HTMLInputElement;
  const formStock = document.getElementById('fruit-form-stock') as HTMLInputElement;
  const formSeason = document.getElementById('fruit-form-season') as HTMLSelectElement;
  const formImage = document.getElementById('fruit-form-image') as HTMLInputElement;
  const formDesc = document.getElementById('fruit-form-desc') as HTMLTextAreaElement;

  if (!modal || !title || !formId || !formName || !formPrice || !formUnit || !formStock || !formSeason || !formImage || !formDesc) return;

  title.innerText = 'ফলের স্টক ও তথ্য সংশোধন';
  formId.value = f.id;
  formName.value = f.name;
  formPrice.value = f.price.toString();
  formUnit.value = f.unit;
  formStock.value = f.stock.toString();
  formSeason.value = f.season;
  formImage.value = f.image;
  formDesc.value = f.description;

  modal.classList.remove('hidden');
};


// -------------------------------------------------------------
// Initialize App Core Settings and Registers
// -------------------------------------------------------------
function initApp() {
  initDatabase();

  // Basic triggers and inputs query
  const logoBtn = document.getElementById('btn-logo');
  const tabStore = document.getElementById('tab-store');
  const tabTrack = document.getElementById('tab-track');
  const tabStaff = document.getElementById('tab-staff');

  const footStore = document.getElementById('foot-btn-store');
  const footTrack = document.getElementById('foot-btn-track');
  const footStaff = document.getElementById('foot-btn-staff');

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const filterBtns = document.querySelectorAll('.btn-filter');

  const cartTrigger = document.getElementById('cart-trigger');
  const cartCloseTrigger = document.getElementById('cart-close-trigger');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const checkoutForm = document.getElementById('checkout-form');

  const trackerForm = document.getElementById('track-form');

  const staffPinForm = document.getElementById('staff-pin-form');
  const staffPinInput = document.getElementById('staff-pin-input') as HTMLInputElement;
  const bypassGateBtn = document.getElementById('btn-bypass-gate');
  const staffLogoutBtn = document.getElementById('btn-staff-logout');

  const addFruitTrigger = document.getElementById('btn-add-fruit-trigger');
  const addFruitClose = document.getElementById('btn-close-fruit-modal');
  const addFruitCancel = document.getElementById('btn-fruit-cancel');
  const fruitForm = document.getElementById('fruit-form') as HTMLFormElement;

  // 1. Navbar setup tab selectors
  logoBtn?.addEventListener('click', () => switchTab('store'));
  tabStore?.addEventListener('click', () => switchTab('store'));
  tabTrack?.addEventListener('click', () => switchTab('track'));
  tabStaff?.addEventListener('click', () => switchTab('staff'));

  // Foot links
  footStore?.addEventListener('click', () => switchTab('store'));
  footTrack?.addEventListener('click', () => switchTab('track'));
  footStaff?.addEventListener('click', () => switchTab('staff'));

  // 2. Cart toggle controls
  cartTrigger?.addEventListener('click', () => toggleCart(true));
  cartCloseTrigger?.addEventListener('click', () => toggleCart(false));
  cartBackdrop?.addEventListener('click', () => toggleCart(false));

  // 3. Search keyup triggers and live filters
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    renderStorefront();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Manage active filter backgrounds
      filterBtns.forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
        b.classList.add('text-slate-600', 'bg-slate-100', 'hover:bg-slate-200/70');
      });

      btn.classList.remove('text-slate-600', 'bg-slate-100', 'hover:bg-slate-200/70');
      btn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');

      selectedSeason = btn.getAttribute('data-season') || 'all';
      renderStorefront();
    });
  });

  // 4. Submit Order
  checkoutForm?.addEventListener('submit', handleCheckout);

  // 5. Track search
  trackerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('track-id-input') as HTMLInputElement;
    if (input) {
      triggerOrderSearch(input.value);
    }
  });

  // 6. Access codes and logins
  staffPinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (staffPinInput) {
      handleStaffVerification(staffPinInput.value);
      staffPinInput.value = '';
    }
  });

  bypassGateBtn?.addEventListener('click', () => {
    isStaffAuthenticated = true;
    showToast('অ্যাডমিন প্যানেলে বাইপাস এন্ট্রি সফল হয়েছে!', 'info');
    renderStaffInterface();
  });

  staffLogoutBtn?.addEventListener('click', () => {
    isStaffAuthenticated = false;
    showToast('স্টাফ সেশন সফলভাবে শেষ হয়েছে!', 'info');
    renderStaffInterface();
  });

  // 7. Modal Form popup operations
  addFruitTrigger?.addEventListener('click', () => {
    const modal = document.getElementById('fruit-modal');
    const title = document.getElementById('fruit-modal-title');
    const form = document.getElementById('fruit-form') as HTMLFormElement;
    const hiddenIdInput = document.getElementById('fruit-form-id') as HTMLInputElement;

    if (!modal || !title || !form) return;

    title.innerText = 'নতুন তাজা ফল যোগ করুন';
    form.reset();
    if (hiddenIdInput) hiddenIdInput.value = '';

    modal.classList.remove('hidden');
  });

  const closeModal = () => {
    const modal = document.getElementById('fruit-modal');
    modal?.classList.add('hidden');
  };

  addFruitClose?.addEventListener('click', closeModal);
  addFruitCancel?.addEventListener('click', closeModal);

  // 8. Add or Update Fruit inventory
  fruitForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formId = document.getElementById('fruit-form-id') as HTMLInputElement;
    const formName = document.getElementById('fruit-form-name') as HTMLInputElement;
    const formPrice = document.getElementById('fruit-form-price') as HTMLInputElement;
    const formUnit = document.getElementById('fruit-form-unit') as HTMLInputElement;
    const formStock = document.getElementById('fruit-form-stock') as HTMLInputElement;
    const formSeason = document.getElementById('fruit-form-season') as HTMLSelectElement;
    const formImage = document.getElementById('fruit-form-image') as HTMLInputElement;
    const formDesc = document.getElementById('fruit-form-desc') as HTMLTextAreaElement;

    if (!formName || !formPrice || !formUnit || !formStock || !formSeason) return;

    const priceVal = parseFloat(formPrice.value) || 0;
    const stockVal = parseFloat(formStock.value) || 0;

    if (formId.value) {
      // Update Mode
      const fIdx = fruits.findIndex(item => item.id === formId.value);
      if (fIdx > -1) {
        const updatedFruit = {
          ...fruits[fIdx],
          name: formName.value.trim(),
          price: priceVal,
          unit: formUnit.value.trim(),
          stock: stockVal,
          season: formSeason.value as any,
          image: formImage.value.trim(),
          description: formDesc.value.trim(),
          isAvailable: stockVal > 0
        };
        fruits[fIdx] = updatedFruit;
        showToast('ফলের তথ্য সফলভাবে হালনাগাদ করা হয়েছে!', 'success');

        dbUpdateFruit(formId.value, updatedFruit).catch(err => {
          console.warn("Unable to update fruit in Firestore:", err);
        });
      }
    } else {
      // Add Mode
      const newFruitId = `f-id-${Date.now()}`;
      const newFruit: Fruit = {
        id: newFruitId,
        name: formName.value.trim(),
        price: priceVal,
        unit: formUnit.value.trim(),
        stock: stockVal,
        season: formSeason.value as any,
        image: formImage.value.trim() || 'https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&q=80&w=400',
        description: formDesc.value.trim(),
        isAvailable: stockVal > 0
      };
      
      fruits.push(newFruit);
      showToast('নতুন ফল সফলভাবে তালিকাভুক্ত করা হয়েছে!', 'success');

      dbAddFruit(newFruit).then((assignedId) => {
        const slot = fruits.findIndex(f => f.id === newFruitId);
        if (slot > -1) {
          fruits[slot].id = assignedId;
        }
        saveFruitsToStorage();
        calculateStaffStats();
        renderStaffFruitsList();
        renderStorefront();
      }).catch(err => {
        console.warn("Unable to add fruit to Firestore:", err);
      });
    }

    saveFruitsToStorage();
    closeModal();
    calculateStaffStats();
    renderStaffFruitsList();
    renderStorefront();
  });

  // Load initial displays
  renderStorefront();
  updateCartBadge();

  // Background load fresh data from Firebase Firestore (Real-Time Synchronisation)
  getFruits().then((freshFruits) => {
    fruits = freshFruits;
    saveFruitsToStorage();
    renderStorefront();
  }).catch((err) => {
    console.warn("Firestore fruits cache loading:", err);
  });

  dbGetAllOrders().then((freshOrders) => {
    orders = freshOrders;
    saveOrdersToStorage();
    calculateStaffStats();
    if (activeTab === 'staff') {
      renderStaffInterface();
    }
  }).catch((err) => {
    console.warn("Firestore orders cache loading:", err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
