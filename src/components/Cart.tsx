import React from 'react';
import { useAtom } from 'jotai';
import { cartAtom, updateQuantityAtom } from '../store/cart';
import { Button } from './ui/button';
import { Enterprise } from '../types/enterprise';
import { api } from '../api';
import { toast } from 'react-toastify';
import { authAtom } from '../store/auth';
import { openStoreAtom } from '../store/open-store';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
        <p className="text-gray-600">Adicione produtos para começar seu pedido</p>
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

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <Card key={`${item.product.id_product}-${item.price.id_price}`} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {item.product.photo_library && item.product.photo_library.length > 0 ? (
                      <img
                        src={item.product.photo_library.find(img => img.is_default)?.location ?? item.product.photo_library[0].location}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.product.title}
                      </h3>
                      {item.price.name && (
                        <p className="text-xs text-gray-500 mt-1">{item.price.name}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-primary">
                          R$ {item.price.value.toFixed(2).replace('.', ',')}
                        </span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => handleUpdateQuantity(item.product.id_product, item.price.id_price, item.quantity - 1, item.id_item_cart)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => handleUpdateQuantity(item.product.id_product, item.price.id_price, item.quantity + 1, item.id_item_cart)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t bg-gray-50 p-4 space-y-4">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Total do Pedido</span>
          <span className="text-2xl font-bold text-primary">
            R$ {total.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Store Status */}
        {!openStore && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-800">
                Loja fechada - Pedidos não disponíveis
              </span>
            </div>
          </div>
        )}

        {/* Send Order Button */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
          onClick={handleSendOrder}
          disabled={!openStore || !auth.isAuthenticated}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {!auth.isAuthenticated 
            ? 'Faça login para pedir' 
            : !openStore 
              ? 'Loja fechada' 
              : 'Enviar Pedido via WhatsApp'
          }
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center">
          <p>Seu pedido será enviado via WhatsApp</p>
          <p>para o estabelecimento</p>
        </div>
      </div>
    </div>
  );
}; 