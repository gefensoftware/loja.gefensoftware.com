import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { productsAtom } from '../store/products';
import { useAtom } from 'jotai';
import { CategorySidebar } from '../components/CategorySidebar';
import { Header } from '../components/Header';

const Products = () => {
  const { name_store } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useAtom(productsAtom);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enterprise, setEnterprise] = useState<any>(null);
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

  const filteredProducts = selectedCategory
    ? products.filter(product => product.id_category === selectedCategory)
    : products;

  return (
    <div>
      <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        enterpriseName={enterprise?.name_fantasy}
        enterpriseLogo={enterprise?.logo?.location}
      />

      <div className="container py-6">
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div
          className="flex flex-wrap gap-2 mb-4 mx-2 max-md:hidden"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
              ${selectedCategory === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button key={category.id_category}
              onClick={() => setSelectedCategory(category.id_category)}
              className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border border-gray-300
              ${selectedCategory === category.id_category ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-2">
          {filteredProducts.map((product) => (
            <Link
              to={product.status === "active" ? `/${name_store}/product/${product.id_product}` : `/${name_store}`}
              key={product.id_product}
              className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300 relative ${product.status === "paused" ? "opacity-50" : ""}`} 
            >
              {product.type === 'service' ? (
                <div className="bg-green-600 text-white px-2 py-1  text-sm absolute top-2 right-2 z-10 rounded-full">
                  Serviço
                </div>
              ) : (
                <div className="bg-sky-600 text-white px-2 py-1  text-sm absolute top-2 right-2 z-10 rounded-full">
                  Produto
                </div>
              )}
              {product.photo_library && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.photo_library.find(photo => photo.is_default)?.location ?? "https://placehold.co/600x400"}
                    alt={product.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-zinc-800">{product.title}</h3>
                <p className="text-gray-600 mt-2">{product.description}</p>
                {product.is_budget ? (
                  <p className="text-lg font-bold mt-4 text-primary">Orçamento</p>
                ) : (
                  <p className="text-lg font-bold mt-4 text-primary">R${product.price[0].value}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;