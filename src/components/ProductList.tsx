import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { ProductSkeleton } from './ProductSkeleton';
import { api } from '../api';
import { useParams } from 'react-router-dom';
import { ProductCard } from './ProductCard';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { name_store } = useParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/product/${name_store}`);
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [name_store]);

  if (loading) {
    return <ProductSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id_product} product={product} />
      ))}
    </div>
  );
}; 