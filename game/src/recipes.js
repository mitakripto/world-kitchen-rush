// The menu of Warung Sizzle: eight ingredients on the counter and the four
// house dishes customers order. Every dish is an ordered sequence — a real
// warung cook adds garlic and chilli to hot oil before the rice goes in.

export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', icon: '🍚', color: '#f5ead2', key: '1' },
  { id: 'noodle', name: 'Noodles', icon: '🍜', color: '#f2c14e', key: '2' },
  { id: 'garlic', name: 'Garlic', icon: '🧄', color: '#e8ddc8', key: '3' },
  { id: 'chili', name: 'Chilli', icon: '🌶️', color: '#e2483d', key: '4' },
  { id: 'kecap', name: 'Kecap Manis', icon: '🍶', color: '#7a4a21', key: '5' },
  { id: 'egg', name: 'Egg', icon: '🥚', color: '#ffd94d', key: '6' },
  { id: 'chicken', name: 'Chicken', icon: '🍗', color: '#d98e4a', key: '7' },
  { id: 'shrimp', name: 'Shrimp', icon: '🦐', color: '#ff9d76', key: '8' },
  { id: 'greens', name: 'Greens', icon: '🥬', color: '#69b455', key: '9' },
];

export const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

export const RECIPES = [
  {
    id: 'nasi-goreng-spesial',
    name: 'Nasi Goreng Spesial',
    icon: '🍛',
    price: 24,
    steps: ['garlic', 'chili', 'rice', 'kecap', 'chicken', 'egg'],
  },
  {
    id: 'mie-goreng-jawa',
    name: 'Mie Goreng Jawa',
    icon: '🍝',
    price: 22,
    steps: ['garlic', 'noodle', 'kecap', 'greens', 'shrimp', 'egg'],
  },
  {
    id: 'nasi-goreng-seafood',
    name: 'Nasi Goreng Seafood',
    icon: '🦐',
    price: 27,
    steps: ['garlic', 'chili', 'shrimp', 'rice', 'greens', 'kecap'],
  },
  {
    id: 'mie-ayam-pedas',
    name: 'Mie Ayam Pedas',
    icon: '🌶️',
    price: 21,
    steps: ['chili', 'garlic', 'noodle', 'chicken', 'greens', 'kecap'],
  },
];

export const CUSTOMER_NAMES = [
  'Bu Sari', 'Pak Budi', 'Mbak Rina', 'Mas Dimas', 'Bu Tini',
  'Pak Agus', 'Mbak Dewi', 'Mas Rizky', 'Bu Wulan', 'Pak Joko',
];

export const CUSTOMER_FACES = ['😊', '😋', '🙂', '🤩', '😄', '🧕', '👴', '👩', '👨', '👵'];
