import { Fruit } from '../types';

export const INITIAL_FRUITS: Omit<Fruit, 'id'>[] = [
  {
    name: 'রাজশাহী স্পেশাল ফজলী আম',
    price: 130,
    stock: 250,
    unit: 'কেজি',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=400',
    season: 'গ্রীষ্মকালীন (Summer)',
    description: 'পাবনার স্বনামধন্য বাগান থেকে সরাসরি সংগৃহীত তাজা ফজলী আম। অনন্য মিষ্টি স্বাদ এবং আঁশহীন রসালো কোয়া।',
    isAvailable: true
  },
  {
    name: 'ঈশ্বরদী বোম্বাই লিচু',
    price: 380,
    stock: 120,
    unit: '১০০ টি',
    image: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=400',
    season: 'গ্রীষ্মকালীন (Summer)',
    description: 'বোম্বাই লিচু পাবনার ঈশ্বরদীর সর্বশ্রেষ্ঠ আকর্ষণ। টকটকে লাল রঙের এবং অসম্ভব মিষ্টি ও সুস্বাদু।',
    isAvailable: true
  },
  {
    name: 'পাবনার তাজা গাছের পাকা কাঁঠাল',
    price: 220,
    stock: 75,
    unit: 'পিস',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400',
    season: 'বর্ষাকালীন (Monsoon)',
    description: 'বাঙালির জাতীয় ফল কাঁঠাল, সুমিষ্ট ঘ্রাণ ও অতুলনীয় পুষ্টিগুণে সমৃদ্ধ। সম্পূর্ণ ফরমালিন মুক্ত।',
    isAvailable: true
  },
  {
    name: 'দেশী পেয়ারা (কাঞ্চননগর জাত)',
    price: 90,
    stock: 180,
    unit: 'কেজি',
    image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=400',
    season: 'সরাসরি (Year-round)',
    description: 'ভিটামিন সি সমৃদ্ধ মচমচে ও মিষ্টি পেয়ারা। একদম দেশী বীজ ও অর্গানিক সার দিয়ে উৎপাদিত।',
    isAvailable: true
  },
  {
    name: 'মিষ্টি পাকা পেঁপে',
    price: 110,
    stock: 140,
    unit: 'কেজি',
    image: 'https://images.unsplash.com/photo-1613082441995-1f9f25712534?auto=format&fit=crop&q=80&w=400',
    season: 'সরাসরি (Year-round)',
    description: 'গাছে পাকা পেঁপে, হজমশক্তি বৃদ্ধিকারী ও দারুণ পুষ্টিকর। ডায়াবেটিস রোগীদের জন্য চমৎকার ফল।',
    isAvailable: true
  },
  {
    name: 'মধুপুর জলডুগি আনারস',
    price: 60,
    stock: 90,
    unit: 'পিস',
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=400',
    season: 'বর্ষাকালীন (Monsoon)',
    description: 'মিষ্টি ও অতিরিক্ত রসালো আনারস। জ্বরের পথ্য হিসেবে ও গরমের ক্লান্তি দূরীকরণে অত্যন্ত কার্যকরী।',
    isAvailable: true
  },
  {
    name: 'রসালো লাল তরমুজ',
    price: 320,
    stock: 60,
    unit: 'পিস',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
    season: 'গ্রীষ্মকালীন (Summer)',
    description: 'ভেতরটা লাল টুকটুকে এবং অতীব মিষ্টি তরমুজ। শরীরের ক্লান্তি ও দূর করতে অনন্য প্রাকৃতিক বলবর্ধক।',
    isAvailable: true
  },
  {
    name: 'মিষ্টি জামরুল',
    price: 140,
    stock: 80,
    unit: 'কেজি',
    image: 'https://images.unsplash.com/photo-1595908129746-57bb1cae155b?auto=format&fit=crop&q=80&w=400',
    season: 'গ্রীষ্মকালীন (Summer)',
    description: 'হালকা মিষ্টি স্বাদের কচি ও সতেজ অর্গানিক সাদা জামরুল, যা গ্রীষ্মের প্রখর রোদে শীতল ভাব এনে দেয়।',
    isAvailable: true
  }
];
