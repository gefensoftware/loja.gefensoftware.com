'use client'

import  { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { cartAtom, syncCartWithAPIAtom } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Enterprise } from '@/types/enterprise';
import { api } from '@/api';
import { toast } from 'react-toastify';
import { authAtom } from '@/store/auth';
import { openStoreAtom } from '@/store/open-store';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const CartPage = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [, syncCartWithAPI] = useAtom(syncCartWithAPIAtom);
  const [auth] = useAtom(authAtom);
  const [openStore] = useAtom(openStoreAtom);
  const router = useRouter();
  const params = useParams();
  const name_store = params?.name_store as string;
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const getEnterprise = async () => {
    if (!name_store) return;
    try {
      const { data } = await api.get(`/enterprise/${name_store}`);
      setEnterprise(data);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    }
  };

  useEffect(() => {
    getEnterprise();
  }, [name_store]);

  const currentCart = cart;
  const items = currentCart?.items || [];

  const total = items.reduce((sum, item) => {
    // Verificar se price e value existem antes de acessar
    if (!item.price || typeof item.price.value === 'undefined') {
      return sum;
    }
    return sum + (item.price.value * item.quantity);
  }, 0);

  const generateOrderText = () => {
    const itemsText = items.map(item => {
      // Verificar se price e value existem antes de acessar
      if (!item.price || typeof item.price.value === 'undefined') {
        return `${item.quantity}x ${item.product?.title || 'Produto sem nome'} - Preço não disponível`;
      }
      return `${item.quantity}x ${item.product?.title || 'Produto sem nome'} - ${item.price.name} (R$ ${item.price.value})`;
    }).join('\n');

    return `*Pedido:*\n\n${itemsText}\n\n*Total: R$ ${total.toFixed(2)}*`;
  };

  const handleSendOrder = () => {
    if (!openStore) {
      toast.error('A loja está fechada!');
      return;
    }

    if (!auth.isAuthenticated) {
      toast.error('Você precisa estar logado para enviar um pedido!');
      return;
    }

    const enterprisePhone = enterprise?.phones.find(phone => phone.is_whatsapp)?.phone;
    if (!enterprisePhone) {
      toast.error('Telefone da empresa não encontrado!');
      return;
    }

    const text = encodeURIComponent(generateOrderText());
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/${enterprisePhone}?text=${text}`, '_blank');
    }
  };

  const handleUpdateQuantity = async (productId: string, priceId: string, quantity: number, id_item_cart: string) => {
    const itemKey = `${productId}-${priceId}-${id_item_cart}`;
    
    try {
      // 1. Marcar como "atualizando" (feedback visual)
      setUpdatingItems(prev => new Set(prev).add(itemKey));
      
      // 2. Atualizar estado local IMEDIATAMENTE
      syncCartWithAPI({ productId, priceId, quantity, id_item_cart });
      
      // 3. Fazer requisição para API (em background)
      if (quantity === 0) {
        await api.delete(`/cart/delete-item/${id_item_cart}`);
        setCart(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id_item_cart !== id_item_cart)
        }));
      } else {
        await api.patch('/cart/update-quantity', {
          id_item_cart: id_item_cart,
          id_user: currentCart.id_user,
          id_product: productId,
          id_price: priceId,
          quantity: quantity
        });
        setCart(prev => ({
          ...prev,
          items: prev.items.map(item => item.id_item_cart === id_item_cart ? { ...item, quantity } : item)
        }));
      }
      
      // 4. Sucesso - estado já está atualizado
    } catch (error) {
      console.error('Error updating quantity:', error);
      // 5. Em caso de erro, mostrar toast
      toast.error('Erro ao atualizar quantidade!');
    } finally {
      // 6. Remover estado de "atualizando"
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  }

  if (!currentCart || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-3">Carrinho vazio</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Adicione produtos ao seu carrinho para começar seu pedido
          </p>
          <Button
            onClick={() => router.push(`/${name_store}`)}
            className="bg-primary hover:bg-primary/90"
          >
            Ver Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Itens do Pedido</h2>
              </div>
              <div className="p-6 space-y-4">
                {items.map((item) => {
                  const itemKey = `${item.product?.id_product || ''}-${item.price?.id_price || ''}-${item.id_item_cart}`;
                  const isUpdating = updatingItems.has(itemKey);
                  
                  return (
                    <Card key={item.id_item_cart} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                              {item.product?.photo_library && item.product.photo_library.length > 0 ? (
                                <img
                                  src={item.product.photo_library.find(img => img.is_default)?.location ?? item.product.photo_library[0].location}
                                  alt={item.product?.title || 'Produto'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div
                              className=' mt-2'
                            >
                              {item.price?.name && (
                                <p className="text-sm text-gray-500 mt-1">{item.price.name}</p>
                              )}
                              <span className="font-semibold text-primary text-lg">
                                {item.price && typeof item.price.value !== 'undefined' 
                                  ? `R$ ${item.price.value.toFixed(2).replace('.', ',')}`
                                  : 'Preço não disponível'
                                }
                              </span>

                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-base line-clamp-2">
                                  {item.product?.title || 'Produto sem nome'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{item.product?.description || 'Sem descrição'}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-10 h-10 p-0"
                                      onClick={() => handleUpdateQuantity(item.product?.id_product || '', item.price?.id_price || '', item.quantity - 1, item.id_item_cart)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className={`w-12 text-center text-base font-medium`}>
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-10 h-10 p-0"
                                      onClick={() => handleUpdateQuantity(item.product?.id_product || '', item.price?.id_price || '', item.quantity + 1, item.id_item_cart)}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-6">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Items Count */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Itens ({items.length})</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Store Status */}
                {!openStore && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 