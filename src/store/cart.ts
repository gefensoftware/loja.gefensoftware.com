import { atom } from "jotai";
import { Product, Prices } from "../types";

export interface CartItem {
  id_item_cart: string;
  quantity: number;
  price: Prices;
  product: Product;
}

export interface Cart {
  id_cart: string;
  id_user: string;
  items: CartItem[];
}

// Load initial cart state from localStorage
const loadCartFromStorage = (): Cart[] => {
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
export const cartAtom = atom<Cart>({
  id_cart: '',
  id_user: '',
  items: []
});

// Helper function to save cart to localStorage
const saveCartToStorage = (cart: Cart) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const addToCartAtom = atom(
  null,
  (get, set, { product, price, id_item_cart }: { product: Product; price: Prices; id_item_cart: string }) => {
    const cart = get(cartAtom);
    const currentCart = cart 

    const existingItemIndex = currentCart.items.findIndex(
      (item) => item.product.id_product === product.id_product && 
                item.price.id_price === price.id_price
    );

    let newItems: CartItem[];
    if (existingItemIndex >= 0) {
      newItems = [...currentCart.items];
      newItems[existingItemIndex].quantity += 1;
    } else {
      newItems = [...currentCart.items, { product, quantity: 1, price, id_item_cart }];
    }
    
    const newCart = { ...currentCart, items: newItems };
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

export const removeFromCartAtom = atom(
  null,
  (get, set, productId: string, priceId: string, id_item_cart: string) => {
    const cart = get(cartAtom);
    if (!cart) return;

    const newItems = cart.items.filter(
      (item) => !(item.product.id_product === productId && item.price.id_price === priceId && item.id_item_cart === id_item_cart)
    );
    
    const newCart = { ...cart, items: newItems };
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

export const updateQuantityAtom = atom(
  null,
  (get, set, { productId, priceId, quantity, id_item_cart }: { productId: string; priceId: string; quantity: number, id_item_cart: string }) => {
    const cart = get(cartAtom);
    if (!cart) return;

    const newItems = cart.items
      .map((item) => {
        if (item.product.id_product === productId && item.price.id_price === priceId && item.id_item_cart === id_item_cart) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    
    const newCart = { ...cart, items: newItems };
    set(cartAtom, newCart);
    saveCartToStorage(newCart);
  }
);

// Add a new atom to clear the cart
export const clearCartAtom = atom(
  null,
  (get, set) => {
    set(cartAtom, {
      id_cart: '',
      id_user: '',
      items: []
    });
    saveCartToStorage({
      id_cart: '',
      id_user: '',
      items: []
    });
  }
); 