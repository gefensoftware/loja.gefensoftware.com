import { api } from './index';
import type { Cart, CartLine, MergeResult } from '@/types/catalog';

const base = (enterpriseId: string) => `/users/me/carts/${enterpriseId}`;

export const getCart = (eid: string) =>
  api.get<Cart>(base(eid)).then((r) => r.data);

export const addCartItem = (eid: string, line: CartLine) =>
  api.post<Cart>(`${base(eid)}/items`, line).then((r) => r.data);

export const setCartItemQuantity = (eid: string, itemId: string, quantity: number) =>
  api.patch<Cart>(`${base(eid)}/items/${itemId}`, { quantity }).then((r) => r.data);

export const removeCartItem = (eid: string, itemId: string) =>
  api.delete<Cart>(`${base(eid)}/items/${itemId}`).then((r) => r.data);

export const clearCart = (eid: string) =>
  api.delete<void>(base(eid)).then(() => undefined);

export const mergeCart = (eid: string, items: CartLine[]) =>
  api.post<MergeResult>(`${base(eid)}/merge`, { items }).then((r) => r.data);
