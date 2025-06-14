import React from 'react';
import { useAtom } from 'jotai';
import { cartAtom, updateQuantityAtom } from '../store/cart';
import { Button } from './ui/button';
import { Enterprise } from '../types/enterprise';
import { api } from '../api';
import { toast } from 'react-toastify';
import { authAtom } from '../store/auth';
import { openStoreAtom } from '../store/open-store';

interface CartProps {
  enterprise: Enterprise | null;
}

export const Cart: React.FC<CartProps> = ({ enterprise }: CartProps) => {
  const [cart] = useAtom(cartAtom);
  const [, updateQuantity] = useAtom(updateQuantityAtom);
  const [auth] = useAtom(authAtom);
  const [openStore] = useAtom(openStoreAtom);

  const currentCart = cart;
  const items = currentCart?.items || [];

  const total = items.reduce((sum, item) => {
    return sum + (item.price.value * item.quantity);
  }, 0);

  const generateOrderText = () => {
    const itemsText = items.map(item =>
      `${item.quantity}x ${item.product.title} - ${item.price.name} (R$ ${item.price.value})`
    ).join('\n');

    return `*Pedido:*\n\n${itemsText}\n\n*Total: R$ ${total.toFixed(2)}*`;
  };

  const handleSendOrder = () => {
    if (!openStore) {
      toast.error('A loja está fechada!');
      return;
    }

    if(!auth.isAuthenticated){
      toast.error('Você precisa estar logado para enviar um pedido!');
      return;
    }
    
    const enterprisePhone = enterprise?.phones.find(phone => phone.is_whatsapp)?.phone;
    console.log(enterprisePhone);
    const text = encodeURIComponent(generateOrderText());
    window.open(`https://wa.me/${enterprisePhone}?text=${text}`, '_blank');
  };

  if (!currentCart || items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Seu carrinho está vazio
      </div>
    );
  }

  const handleUpdateQuantity = async (productId: string, priceId: string, quantity: number, id_item_cart: string) => {
    try {
      if (quantity < 0) {
        toast.error('A quantidade não pode ser negativa!');
        return;
      }

      if (quantity === 0) {
        await api.delete(`/cart/delete-item/${id_item_cart}`);
      } else {
        await api.patch('/cart/update-quantity', {
          id_item_cart: id_item_cart,
          id_user: currentCart.id_user,
          id_product: productId,
          id_price: priceId,
          quantity: quantity
        })
      }

      updateQuantity({ productId, priceId, quantity, id_item_cart });
    } catch (error) {
      toast.error('Erro ao atualizar quantidade do produto!');
    }
  }


  console.log(items);
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Carrinho</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${item.product.id_product}-${item.price.id_price}`} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
            <img
              src={item.product.photo_library.find(img => img.is_default)?.location ?? "https://placehold.co/600x400"}
              alt={item.product.title}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.title.substring(0, 20)}...</h3>
              <p className="text-sm text-gray-600">{item.price.name}</p>
              <p className="text-sm font-medium">R$ {item.price.value}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.product.id_product, item.price.id_price, item.quantity - 1, item.id_item_cart)}
              >
                -
              </Button>
              <span className="w-4 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.product.id_product, item.price.id_price, item.quantity + 1, item.id_item_cart)}
              >
                +
              </Button>
            </div>
            {/* <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveFromCart(item.id_item_cart, item.product.id_product, item.price.id_price)}
            >
              <Trash className="w-5 h-5" />
            </Button> */}
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-xl font-bold">R$ {total.toFixed(2)}</span>
        </div>
        <Button
          className="w-full mt-4 text-white"
          onClick={handleSendOrder}
        >
          Enviar Pedido
        </Button>
      </div>
    </div>
  );
}; 