import { atom } from "jotai";
import { Product, Prices } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPrice: Prices;
}

// Load initial cart state from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const savedCart = localStorage.getItem('cart');
  if (!savedCart) return [];
  try {
    return JSON.parse(savedCart);
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
};

// Create atom with initial value from localStorage
export const cartAtom = atom<CartItem[]>(loadCartFromStorage());

// Helper function to save cart to localStorage
const saveCartToStorage = (cart: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const addToCartAtom = atom(
  null,
  (get, set, { product, selectedPrice }: { product: Product; selectedPrice: Prices }) => {
    const cart = get(cartAtom);
    const existingItemIndex = cart.findIndex(
      (item) => item.product.id_product === product.id_product && 
                item.selectedPrice.id_price === selectedPrice.id_price
    );

    let newCart: CartItem[];
    if (existingItemIndex >= 0) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart = [...cart, { product, quantity: 1, selectedPrice }];
    }
    
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

export const removeFromCartAtom = atom(
  null,
  (get, set, productId: string, priceId: string) => {
    const cart = get(cartAtom);
    const newCart = cart.filter(
      (item) => !(item.product.id_product === productId && item.selectedPrice.id_price === priceId)
    );
    
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

export const updateQuantityAtom = atom(
  null,
  (get, set, { productId, priceId, quantity }: { productId: string; priceId: string; quantity: number }) => {
    const cart = get(cartAtom);
    const newCart = cart.map((item) => {
      if (item.product.id_product === productId && item.selectedPrice.id_price === priceId) {
        return { ...item, quantity: Math.max(0, quantity) };
      }
      return item;
    }).filter((item) => item.quantity > 0);
    
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

// Add a new atom to clear the cart
export const clearCartAtom = atom(
  null,
  (get, set) => {
    set(cartAtom, []);
    saveCartToStorage([]);
  }
); 