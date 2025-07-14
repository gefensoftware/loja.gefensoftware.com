import React, { useState } from 'react';
import { Product, Prices } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import {
  Clock, Tag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [selectedPrice] = useState<Prices>(product.price[0]);

  const navigate = useNavigate();
  const { name_store } = useParams();

  const handleClick = () => {
    navigate(`/${name_store}/product/${product.id_product}`);
  };

  return (
    <Card onClick={handleClick} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-primary/50">
      <CardContent className="p-0 w-full flex flex-col">
        <div className='flex flex-row w-full p-4 justify-between'>
          <div className=" w-2/3">
            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            {product.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
            )}

            {/* <Button 
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </Button> */}
            {product.price.length > 1 ? (
              <div className="mb-2">
                <p className='font-bold text-lg text-primary'>
                  {product.price.sort((a, b) => a.value - b.value)[0].name + ' - ' + product.price.sort((a, b) => a.value - b.value)[0].value.toFixed(2).replace('.', ',')}
                </p>
                {/* <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Escolha a opção:
                </label>
                <Select
                  value={selectedPrice.id_price}
                  onValueChange={(value: string) => {
                    const price = product.price.find(p => p.id_price === value);
                    if (price) setSelectedPrice(price);
                  }}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:border-primary">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.price.map((price) => (
                      <SelectItem key={price.id_price} value={price.id_price}>
                        <div className="flex items-center justify-between w-full">
                          <span>{price.name}</span>
                          <span className="font-semibold text-primary">
                            R$ {price.value.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>
            ) : (
              <div className="mb-4">
                {product.is_budget ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">Orçamento</span>
                  </div>
                ) : (
                  <div className="text-primary">
                    <div className="font-bold text-lg">
                      R$ {selectedPrice.value.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className=" relative  flex justify-center items-center overflow-hidden ">
            {product.photo_library && product.photo_library.length > 0 ? (
              <img
                src={product.photo_library.find(img => img.is_default)?.location ?? product.photo_library[0].location}
                alt={product.title}
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