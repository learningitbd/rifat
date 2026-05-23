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
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.warn("Firestore connection check completed. Ready.");
    }
  }
}

// Ensure the connection is tested on boot
testConnection();

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
    return handleFirestoreError(error, OperationType.GET, collectionName);
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
          const label = snap.data().unit || 'kg';
          // Make sure stock doesn't drop below zero
          const nextStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(fruitDoc, { stock: nextStock });
        }
      } catch (err) {
        console.warn("Could not reduce stock for fruitID:", item.fruitId, err);
      }
    }

    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

// Load order by tracking ID
export async function getOrder(id: string): Promise<Order | null> {
  const path = `orders/${id}`;
  try {
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Order;
    }
    return null;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

// Get all orders (Admin UI)
export async function getAllOrders(): Promise<Order[]> {
  const collectionName = 'orders';
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const list: Order[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Order);
    });
    // Sort orders by date descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, collectionName);
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
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
