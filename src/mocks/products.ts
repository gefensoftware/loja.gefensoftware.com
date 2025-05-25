import { Product } from '../types/product';

// Mock data for products
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    description: 'Description for product 1',
    price: 99.99,
    image: 'https://via.placeholder.com/150',
    category: 'Category 1'
  },
  {
    id: 2,
    name: 'Product 2',
    description: 'Description for product 2',
    price: 149.99,
    image: 'https://via.placeholder.com/150',
    category: 'Category 2'
  },
  {
    id: 3,
    name: 'Product 3',
    description: 'Description for product 3',
    price: 199.99,
    image: 'https://via.placeholder.com/150',
    category: 'Category 1'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  await delay(2000); // Simulate network delay
  return mockProducts;
};

// Get product by ID
export const getProductById = async (id: number): Promise<Product | undefined> => {
  await delay(800); // Simulate network delay
  return mockProducts.find(product => product.id === id);
};

// Search products by name
export const searchProducts = async (query: string): Promise<Product[]> => {
  await delay(600); // Simulate network delay
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.description.toLowerCase().includes(query.toLowerCase())
  );
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  await delay(700); // Simulate network delay
  return mockProducts.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  );
}; 