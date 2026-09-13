'use client'

import React from 'react';
import type { Product } from '@/types/catalog';
import { valorEfetivo, temPromocaoVigente, formatarPreco } from '@/lib/price';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock, Tag } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // A listagem pública já traz preço e imagem principal — nada aqui faz
  // uma requisição extra por produto.
  const price = product.prices[0];
  const image = product.images.find((img) => img.isMain) ?? product.images[0];

  const router = useRouter();
  const params = useParams();
  const name_store = params?.name_store as string;

  const handleClick = () => {
    // A rota de produto é por código, não por id.
    router.push(`/${name_store}/product/${product.code}`);
  };

  return (
    <Card onClick={handleClick} className=" group overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-primary/50">
      <CardContent className="p-0 w-full  flex flex-col">
        <div className='flex flex-row w-full  p-4 justify-between'>
          <div className="w-2/3">
            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            {product.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="mb-4">
              {product.isBudget ? (
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Orçamento</span>
                </div>
              ) : price ? (
                <div className="text-primary">
                  {/* Sem o nome do preço o cliente vê um valor solto — ainda
                      mais quando há várias opções e esta é só a primeira. */}
                  {price.name && (
                    <span className="block text-xs text-gray-500">{price.name}</span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {temPromocaoVigente(price) && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatarPreco(price.value)}
                      </span>
                    )}
                    <span className="font-bold text-lg">
                      {formatarPreco(valorEfetivo(price))}
                    </span>
                    {product.prices.length > 1 && (
                      <span className="text-xs text-gray-500">
                        +{product.prices.length - 1}{' '}
                        {product.prices.length - 1 === 1 ? 'opção' : 'opções'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-primary font-bold text-lg">Preço não disponível</div>
              )}
            </div>
          </div>
          <div className=" relative  flex justify-center items-center overflow-hidden ">
            {image ? (
              <img
                src={image.url}
                alt={product?.title || 'Produto'}
                className="w-32 h-full rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-32 h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
                <Tag className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="absolute top-0 right-0">
              <Badge variant={product.type === 'service' ? 'default' : 'secondary'} className={`text-xs ${product.type === 'service' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                {product.type === 'service' ? 'Serviço' : 'Produto'}
              </Badge>
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
