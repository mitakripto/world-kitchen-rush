// The menu of World Kitchen Rush: twelve ingredients on the counter and five
// house dishes from five kitchens of the world — Italy, Indonesia, China and
// India. Every dish is an ordered sequence, the way a real cook builds it:
// aromatics first, sauce before the garnish.

export const INGREDIENTS = [
  { id: 'rice', name: 'Rice', icon: '🍚', color: '#f5ead2', key: '1' },
  { id: 'pasta', name: 'Pasta', icon: '🍝', color: '#f2c14e', key: '2' },
  { id: 'dough', name: 'Dough', icon: '🫓', color: '#e8cf9f', key: '3' },
  { id: 'tomato', name: 'Tomato', icon: '🍅', color: '#e2483d', key: '4' },
  { id: 'cheese', name: 'Cheese', icon: '🧀', color: '#ffd94d', key: '5' },
  { id: 'basil', name: 'Basil', icon: '🌿', color: '#69b455', key: '6' },
  { id: 'garlic', name: 'Garlic', icon: '🧄', color: '#e8ddc8', key: '7' },
  { id: 'chilli', name: 'Chilli', icon: '🌶️', color: '#e2483d', key: '8' },
  { id: 'soy', name: 'Soy Sauce', icon: '🍶', color: '#7a4a21', key: '9' },
  { id: 'egg', name: 'Egg', icon: '🥚', color: '#ffd94d', key: '0' },
  { id: 'chicken', name: 'Chicken', icon: '🍗', color: '#d98e4a', key: 'Q' },
  { id: 'curry', name: 'Curry Spice', icon: '🍛', color: '#d97b2f', key: 'W' },
];

export const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]));

export const RECIPES = [
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    cuisine: 'Italy',
    icon: '🍕',
    price: 24,
    steps: ['dough', 'tomato', 'garlic', 'cheese', 'basil'],
  },
  {
    id: 'chicken-carbonara',
    name: 'Chicken Carbonara',
    cuisine: 'Italy',
    icon: '🍝',
    price: 26,
    steps: ['pasta', 'garlic', 'egg', 'chicken', 'cheese', 'basil'],
  },
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    cuisine: 'Indonesia',
    icon: '🍛',
    price: 24,
    steps: ['garlic', 'chilli', 'rice', 'soy', 'chicken', 'egg'],
  },
  {
    id: 'dan-dan-noodles',
    name: 'Dan Dan Noodles',
    cuisine: 'China',
    icon: '🍜',
    price: 22,
    steps: ['chilli', 'garlic', 'soy', 'pasta', 'chicken', 'basil'],
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    cuisine: 'India',
    icon: '🍲',
    price: 27,
    steps: ['garlic', 'curry', 'rice', 'chicken', 'tomato', 'basil'],
  },
];

export const CUSTOMER_NAMES = [
  'Marco', 'Sofia', 'Li Wei', 'Priya', 'Kenji',
  'Emma', 'Raj', 'Lucia', 'Chen', 'Aisha',
];

export const CUSTOMER_FACES = ['👨', '👩', '🧑', '👳', '👴', '👵', '🧕', '👱‍♀️', '👲', '🧔'];
