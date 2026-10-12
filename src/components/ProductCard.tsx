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
    <Card onClick={handleClick} className=" group overflow-hidden hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50">
      <CardContent className="p-0 w-full  flex flex-col">
        <div className='flex flex-row w-full gap-4 p-4 sm:p-5 justify-between'>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            {product.description && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
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
                    <span className="block text-xs text-muted-foreground">{price.name}</span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {temPromocaoVigente(price) && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatarPreco(price.value)}
                      </span>
                    )}
                    <span className="font-bold text-lg">
                      {formatarPreco(valorEfetivo(price))}
                    </span>
                    {product.prices.length > 1 && (
                      <span className="text-xs text-muted-foreground">
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
          {/* Foto quadrada e de tamanho fixo: com h-full ela esticava até a
              altura do texto e cada card ficava com uma proporção. */}
          <div className="relative shrink-0 self-start w-28 sm:w-32 aspect-square overflow-hidden rounded-lg">
            {image ? (
              <img
                src={image.url}
                alt={product?.title || 'Produto'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Tag className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            <div className="absolute top-1 right-1">
              <Badge variant={product.type === 'service' ? 'default' : 'secondary'} className={`text-xs ${product.type === 'service' ? 'bg-primary text-on-primary' : 'bg-muted text-foreground'}`}>
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
