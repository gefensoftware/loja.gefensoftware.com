import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { productsAtom, searchTermAtom } from '../store/products';
import { useAtom } from 'jotai';
import { CategorySidebar } from '../components/CategorySidebar';

import {  Tag } from 'lucide-react';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import { ProductCard } from '../components/ProductCard';

const Products = () => {
  const { name_store } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useAtom(productsAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [_, setEnterprise] = useState<any>(null);
  const [categories, setCategories] = useState<any>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await api.get(`/category/enterprise/${name_store}`);
      setCategories(data);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/product/enterprise/${name_store}`, {
          params: {
            status: "active,paused"
          }
        });
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEnterprise = async () => {
      try {
        const { data } = await api.get(`/enterprise/${name_store}`);
        setEnterprise(data);
      } catch (error) {
        console.error('Error fetching enterprise:', error);
      }
    };

    fetchProducts();
    fetchEnterprise();
  }, []);

  // Filtrar produtos por termo de pesquisa
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar produtos por categoria
  const productsByCategory = categories.reduce((acc: any, category: any) => {
    const categoryProducts = filteredProducts.filter(product => product.id_category === category.id_category);
    if (categoryProducts.length > 0) {
      acc[category.id_category] = {
        category,
        products: categoryProducts
      };
    }
    return acc;
  }, {});

  // Produtos sem categoria
  const uncategorizedProducts = filteredProducts.filter(product => !product.id_category);

  // Função para scroll até a categoria
  // const handleCategorySelect = (categoryId: string) => {
  //   setSelectedCategory(categoryId);
  //   setTimeout(() => {
  //     const el = document.getElementById(`category-${categoryId}`);
  //     if (el) {
  //       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     }
  //   }, 100);
  // };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
              <p className="text-gray-600 mt-1">Explore nossos produtos e serviços</p>
            </div>
          </div>
        </div>
        <ProductSkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">

      {/* Categorias e Produtos */}
      <div className="space-y-10">
        {Object.keys(productsByCategory).length === 0 && uncategorizedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `Não encontramos produtos para "${searchTerm}"` 
                  : 'Não há produtos disponíveis no momento'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Produtos por Categoria */}
            {Object.entries(productsByCategory).map(([categoryId, data]: [string, any]) => {
              const { category, products: categoryProducts } = data;
              return (
                <div key={categoryId} id={`category-${categoryId}`}>
                  {/* Título da Categoria */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
                  {/* Grid de Produtos */}
                  <div className="grid  gap-6 grid-cols-1 sm:grid-cols-2 ">
                    {categoryProducts.map((product: any) => (
                      <ProductCard key={product.id_product} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Produtos sem categoria */}
            {uncategorizedProducts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Outros Produtos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {uncategorizedProducts.map((product: any) => (
                    <ProductCard key={product.id_product} product={product} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Category Sidebar */}
      <CategorySidebar
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};

export default Products;