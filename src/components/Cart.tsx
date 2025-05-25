import React from 'react';
import { useAtom } from 'jotai';
import { cartAtom, removeFromCartAtom, updateQuantityAtom } from '../store/cart';
import { Button } from './ui/button';
import { Trash } from 'lucide-react';
import { Enterprise } from '../types/enterprise';

interface CartProps {
  enterprise: Enterprise | null;
}

export const Cart: React.FC<CartProps> = ({ enterprise }: CartProps) => {
  const [cart] = useAtom(cartAtom);
  const [, removeFromCart] = useAtom(removeFromCartAtom);
  const [, updateQuantity] = useAtom(updateQuantityAtom);

  const total = cart.reduce((sum, item) => {
    return sum + (item.selectedPrice.value * item.quantity);
  }, 0);



  const generateOrderText = () => {
    const items = cart.map(item => 
      `${item.quantity}x ${item.product.title} - ${item.selectedPrice.name} (R$ ${item.selectedPrice.value})`
    ).join('\n');
    
    return `*Pedido:*\n\n${items}\n\n*Total: R$ ${total.toFixed(2)}*`;
  };

  const handleSendOrder = () => {
    const enterprisePhone = enterprise?.phones.find(phone => phone.is_whatsapp)?.phone;
    console.log(enterprisePhone);
    const text = encodeURIComponent(generateOrderText());
    window.open(`https://wa.me/${enterprisePhone}?text=${text}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Seu carrinho está vazio
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Carrinho</h2>
      <div className="space-y-2">
        {cart.map((item) => (
          <div key={`${item.product.id_product}-${item.selectedPrice.id_price}`} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
            <img
              src={item.product.photo_library.find(img => img.is_default)?.location || item.product.photo_library[0]?.location}
              alt={item.product.title}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.title}</h3>
              <p className="text-sm text-gray-600">{item.selectedPrice.name}</p>
              <p className="text-sm font-medium">${item.selectedPrice.value}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity({
                  productId: item.product.id_product,
                  priceId: item.selectedPrice.id_price,
                  quantity: item.quantity - 1
                })}
              >
                -
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity({
                  productId: item.product.id_product,
                  priceId: item.selectedPrice.id_price,
                  quantity: item.quantity + 1
                })}
              >
                +
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeFromCart(item.product.id_product, item.selectedPrice.id_price)}
            >
              <Trash className="w-5 h-5" />
            </Button>
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