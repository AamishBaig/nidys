import { MenuCategory, Theme, InitialMediaFolder } from './types';

// Placeholder images have been removed to start with a clean slate.

// The initial media library now contains empty folders.
export const INITIAL_MEDIA_LIBRARY: InitialMediaFolder = {
  id: 'root',
  name: 'Media Library',
  type: 'folder',
  children: [
    {
      id: 'folder-bg',
      name: 'Backgrounds',
      type: 'folder',
      children: [],
    },
    {
      id: 'folder-fg',
      name: 'Foregrounds',
      type: 'folder',
      children: [],
    },
    { id: 'folder-themes', name: 'Themes', type: 'folder', children: [] },
    { id: 'folder-app', name: 'App', type: 'folder', children: [] },
  ]
};

// Menu items now start without any images assigned.
export const INITIAL_MENU_DATA: MenuCategory[] = [
  {
    id: 'cat-1',
    title: 'Mains',
    items: [
      {
        id: 'item-1',
        name: 'Gourmet Burger',
        description: 'A delicious burger with all the toppings, including a juicy patty, fresh lettuce, tomatoes, and our special sauce.',
        price: 15.99,
        backgroundImageId: null,
        foregroundImageId: null,
        dietary: { glutenFree: false, vegetarian: false, vegan: false, noSeafood: true, spicyLevel: 1 },
        isAvailable: true,
      },
      {
        id: 'item-2',
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh mozzarella, San Marzano tomatoes, fresh basil, salt and extra-virgin olive oil.',
        price: 12.99,
        backgroundImageId: null,
        foregroundImageId: null,
        dietary: { glutenFree: false, vegetarian: true, vegan: false, noSeafood: true, spicyLevel: 0 },
        isAvailable: true,
      },
    ],
  },
  {
    id: 'cat-2',
    title: 'Sides',
    items: [
       {
        id: 'item-3',
        name: 'Crispy Fries',
        description: 'Golden, crispy fries served with our house-made aioli.',
        price: 4.99,
        backgroundImageId: null,
        foregroundImageId: null,
        dietary: { glutenFree: true, vegetarian: true, vegan: true, noSeafood: true, spicyLevel: 0 },
        isAvailable: true,
      },
    ],
  },
   {
    id: 'cat-3',
    title: 'Drinks',
    items: [
       {
        id: 'item-4',
        name: 'Cola',
        description: 'A refreshing can of your favorite cola.',
        price: 2.99,
        backgroundImageId: null,
        foregroundImageId: null,
        dietary: { glutenFree: true, vegetarian: true, vegan: true, noSeafood: true, spicyLevel: 0 },
        isAvailable: true,
      },
      {
        id: 'item-5',
        name: 'Mineral Water',
        description: 'Chilled mineral water.',
        price: 1.99,
        backgroundImageId: null,
        foregroundImageId: null,
        dietary: { glutenFree: true, vegetarian: true, vegan: true, noSeafood: true, spicyLevel: 0 },
        isAvailable: false,
      },
    ],
  },
];

// Themes now start without any background images.
export const INITIAL_THEMES: Theme[] = [
    {
        id: 'theme-1',
        name: 'Default',
        backgroundImage: '',
        primaryColor: 'amber',
        secondaryColor: 'indigo',
        textColor: 'white',
    },
    {
        id: 'theme-2',
        name: 'Ocean',
        backgroundImage: '',
        primaryColor: 'cyan',
        secondaryColor: 'blue',
        textColor: 'white',
    }
];