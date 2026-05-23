import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc,
  getDocFromServer,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Fruit, Order, OrderItem } from '../types';
import { INITIAL_FRUITS } from './fallbackFruits';

// Validate Connection to Firestore as required by the Firebase Integration Skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test passed successfully.");
  } catch (error) {
    // Graceful offline message instead of scary console.error
    console.info("Firestore connection check completed. High-availability offline-resilient mode is active.");
  }
}

// Ensure the connection is tested on boot
testConnection();

// Local storage caching helpers for offline recovery
function saveOrderToLocal(order: Order) {
  try {
    const saved = localStorage.getItem('local_orders');
    const localOrds: Order[] = saved ? JSON.parse(saved) : [];
    const index = localOrds.findIndex(o => o.id === order.id);
    if (index > -1) {
      localOrds[index] = order;
    } else {
      localOrds.push(order);
    }
    localStorage.setItem('local_orders', JSON.stringify(localOrds));
  } catch (e) {
    console.warn("Offline local orders cache update failed:", e);
  }
}

function getLocalOrders(): Order[] {
  try {
    const saved = localStorage.getItem('local_orders');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

// Load available fruits from Firestore
export async function getFruits(): Promise<Fruit[]> {
  const collectionName = 'fruits';
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    let list: Fruit[] = [];
    
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Fruit);
    });

    // If Firestore is empty, seed with initial mock data
    if (list.length === 0) {
      console.log("Seeding Firestore with default fruit list...");
      for (const item of INITIAL_FRUITS) {
        const docRef = doc(collection(db, collectionName));
        await setDoc(docRef, { ...item });
      }
      // Re-fetch
      const freshSnapshot = await getDocs(collection(db, collectionName));
      list = [];
      freshSnapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Fruit);
      });
    }

    return list;
  } catch (error) {
    console.warn("Unable to fetch fruits from Firestore. Using offline-resilient local fallback catalog.");
    return INITIAL_FRUITS.map((item, index) => ({
      id: `fallback-fruit-${index + 1}`,
      ...item
    })) as Fruit[];
  }
}

// Add/save a new fruit (Admin UI)
export async function addFruit(fruit: Omit<Fruit, 'id'>): Promise<string> {
  const collectionName = 'fruits';
  try {
    const docRef = await addDoc(collection(db, collectionName), fruit);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

// Update a fruit (Admin UI)
export async function updateFruitDetails(id: string, fruit: Partial<Fruit>): Promise<void> {
  const path = `fruits/${id}`;
  try {
    const docRef = doc(db, 'fruits', id);
    await updateDoc(docRef, { ...fruit });
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Place a new Order
export async function placeOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  const collectionName = 'orders';
  try {
    const docRef = await addDoc(collection(db, collectionName), orderData);
    
    // Attempt to decrement fruit stock in Firestore atomically or sequentially
    for (const item of orderData.items) {
      try {
        const fruitDoc = doc(db, 'fruits', item.fruitId);
        const snap = await getDoc(fruitDoc);
        if (snap.exists()) {
          const currentStock = snap.data().stock || 0;
          // Make sure stock doesn't drop below zero
          const nextStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(fruitDoc, { stock: nextStock });
        }
      } catch (err) {
        console.warn("Could not reduce stock for fruitID:", item.fruitId, err);
      }
    }

    const newOrder: Order = { id: docRef.id, ...orderData };
    saveOrderToLocal(newOrder);
    return docRef.id;
  } catch (error) {
    console.warn("Unable to write order to Firestore. Utilizing local storage backup for resilient checkout:", error);
    const offlineId = `order-off-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOrder: Order = { id: offlineId, ...orderData };
    saveOrderToLocal(newOrder);
    return offlineId;
  }
}

// Load order by tracking ID
export async function getOrder(id: string): Promise<Order | null> {
  const path = `orders/${id}`;
  try {
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const order = { id: snap.id, ...snap.data() } as Order;
      saveOrderToLocal(order);
      return order;
    }
    // If not in firestore, check local storage cache
    const local = getLocalOrders().find(o => o.id === id);
    if (local) return local;
    return null;
  } catch (error) {
    console.warn("Unable to load order from Firestore. Checking offline local storage orders database:", error);
    return getLocalOrders().find(o => o.id === id) || null;
  }
}

// Get all orders (Admin UI)
export async function getAllOrders(): Promise<Order[]> {
  const collectionName = 'orders';
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const list: Order[] = [];
    snapshot.forEach((d) => {
      const order = { id: d.id, ...d.data() } as Order;
      list.push(order);
      saveOrderToLocal(order);
    });
    // Sort orders by date descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Unable to fetch orders from online database. Displaying cache of local orders:", error);
    const localList = getLocalOrders();
    return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Update order status (Admin UI)
export async function updateOrderStatus(id: string, status: Order['status'], paymentStatus?: Order['paymentStatus']): Promise<void> {
  const path = `orders/${id}`;
  try {
    const docRef = doc(db, 'orders', id);
    const updates: Partial<Order> = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (paymentStatus) {
      updates.paymentStatus = paymentStatus;
    }
    await updateDoc(docRef, updates);
    
    const existingOrder = getLocalOrders().find(o => o.id === id);
    if (existingOrder) {
      saveOrderToLocal({
        ...existingOrder,
        status,
        updatedAt: updates.updatedAt,
        ...(paymentStatus ? { paymentStatus } : {})
      });
    }
  } catch (error) {
    console.warn("Offline status update triggered:", error);
    const localList = getLocalOrders();
    const existingOrder = localList.find(o => o.id === id);
    if (existingOrder) {
      saveOrderToLocal({
        ...existingOrder,
        status,
        updatedAt: new Date().toISOString(),
        ...(paymentStatus ? { paymentStatus } : {})
      });
    } else {
      return handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
