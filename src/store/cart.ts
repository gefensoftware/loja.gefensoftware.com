import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
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
  lastUpdate?: number; // Adicionar timestamp para forçar re-renderização
}

// Usar atomWithStorage para lidar melhor com a hidratação
export const cartAtom = atomWithStorage<Cart>('cart', {
  id_cart: '',
  id_user: '',
  items: []
}, undefined, { getOnInit: true });

// Atom para forçar re-renderização
export const cartUpdateCounterAtom = atom(0);

// Atom derivado para garantir re-renderização
export const cartItemsAtom = atom(
  (get) => {
    const cart = get(cartAtom);
    const counter = get(cartUpdateCounterAtom); // Força re-renderização
    return cart?.items || [];
  }
);

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
    
    const newCart = { ...currentCart, items: newItems, lastUpdate: Date.now() };
    set(cartAtom, newCart);
    set(cartUpdateCounterAtom, get(cartUpdateCounterAtom) + 1);
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
    
    const newCart = { ...cart, items: newItems, lastUpdate: Date.now() };
    set(cartAtom, newCart);
    set(cartUpdateCounterAtom, get(cartUpdateCounterAtom) + 1);
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
      .filter((item) => item.quantity > 0); // Remove itens com quantidade 0
    
    const newCart = { ...cart, items: newItems, lastUpdate: Date.now() };
    set(cartAtom, newCart);
    set(cartUpdateCounterAtom, get(cartUpdateCounterAtom) + 1);
  }
);

// Atom para sincronizar com a API - versão simplificada
export const syncCartWithAPIAtom = atom(
  null,
  (get, set, { productId, priceId, quantity, id_item_cart }: { productId: string; priceId: string; quantity: number, id_item_cart: string }) => {
    const cart = get(cartAtom);
    if (!cart) {
      console.log('Cart is null, cannot update');
      return;
    }

    console.log('Updating cart:', { productId, priceId, quantity, id_item_cart });

    // Atualizar diretamente o item no carrinho
    const newItems = cart.items
      .map(item => {
        if (item.product.id_product === productId && 
            item.price.id_price === priceId && 
            item.id_item_cart === id_item_cart) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      })
      .filter(item => item.quantity > 0); // Remove automaticamente itens com quantidade 0

    const newCart = { ...cart, items: newItems, lastUpdate: Date.now() };
    set(cartAtom, newCart);
    set(cartUpdateCounterAtom, get(cartUpdateCounterAtom) + 1);
    
    console.log('Cart updated, new items:', newItems);
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
    set(cartUpdateCounterAtom, get(cartUpdateCounterAtom) + 1);
  }
); 