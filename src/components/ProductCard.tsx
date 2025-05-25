import React, { useState } from 'react';
import { Product, Prices } from '../types';
import { useAtom } from 'jotai';
import { addToCartAtom } from '../store/cart';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [, addToCart] = useAtom(addToCartAtom);
  const [selectedPrice, setSelectedPrice] = useState<Prices>(product.price[0]);

  const handleAddToCart = () => {
    addToCart({ product, selectedPrice });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
      <img
        src={product.photo_library.find(img => img.is_default)?.location || product.photo_library[0]?.location}
        alt={product.title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
      <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
      
      <div className="mt-auto">
        <div className="mb-4">
          <Select
            value={selectedPrice.id_price}
            onValueChange={(value: string) => {
              const price = product.price.find(p => p.id_price === value);
              if (price) setSelectedPrice(price);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select price" />
            </SelectTrigger>
            <SelectContent>
              {product.price.map((price) => (
                <SelectItem key={price.id_price} value={price.id_price}>
                  {price.name} - ${price.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleAddToCart}
          className="w-full"
        >
          Add to Cart
        </Button>
        
      </div>
    </div>
  );
}; 