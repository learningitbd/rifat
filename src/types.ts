export interface Fruit {
  id: string; // Document ID
  name: string; // Fruit name (Bengali and/or English, e.g. "আম (Mango)")
  price: number; // Price in BDT (৳)
  stock: number; // Available stock in kg
  unit: string; // kg, piece, crate
  image: string; // Unsplash image or high-quality illustration representation
  season: 'সরাসরি (Year-round)' | 'গ্রীষ্মকালীন (Summer)' | 'বর্ষাকালীন (Monsoon)' | 'শীতকালীন (Winter)';
  description: string;
  isAvailable: boolean;
}

export interface CartItem {
  fruit: Fruit;
  quantity: number;
}

export interface OrderItem {
  fruitId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string; // Document ID
  customerName: string;
  phone: string;
  email: string;
  address: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Cash-on-Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  transactionId?: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  totalAmount: number;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}
