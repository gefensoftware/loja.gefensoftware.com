import { Product } from '../types';

// Mock data for products
const mockProducts: Product[] = [
  {
    id_product: '1',
    title: 'Product 1',
    description: 'Description for product 1',
    extra: 'Extra info for product 1',
    price: [
      {
        id_price: '1',
        id_product: '1',
        name: 'Regular Price',
        value: 99.99
      }
    ],
    is_budget: false,
    id_category: '1',
    createdAt: new Date('2024-01-01'),
    photo_library: [
      {
        id_image: '1',
        key: 'product1.jpg',
        location: 'https://via.placeholder.com/150',
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'product1.jpg',
        id_product: '1',
        is_default: true
      }
    ],
    updatedAt: new Date('2024-01-01'),
    details_point: ['Feature 1', 'Feature 2'],
    type: 'product',
    status: 'active',
    for_schedule: false
  },
  {
    id_product: '2',
    title: 'Product 2',
    description: 'Description for product 2',
    extra: 'Extra info for product 2',
    price: [
      {
        id_price: '2',
        id_product: '2',
        name: 'Regular Price',
        value: 149.99
      }
    ],
    is_budget: false,
    id_category: '2',
    createdAt: new Date('2024-01-01'),
    photo_library: [
      {
        id_image: '2',
        key: 'product2.jpg',
        location: 'https://via.placeholder.com/150',
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'product2.jpg',
        id_product: '2',
        is_default: true
      }
    ],
    updatedAt: new Date('2024-01-01'),
    details_point: ['Feature 1', 'Feature 2'],
    type: 'product',
    status: 'active',
    for_schedule: false
  },
  {
    id_product: '3',
    title: 'Product 3',
    description: 'Description for product 3',
    extra: 'Extra info for product 3',
    price: [
      {
        id_price: '3',
        id_product: '3',
        name: 'Regular Price',
        value: 199.99
      }
    ],
    is_budget: false,
    id_category: '1',
    createdAt: new Date('2024-01-01'),
    photo_library: [
      {
        id_image: '3',
        key: 'product3.jpg',
        location: 'https://via.placeholder.com/150',
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'product3.jpg',
        id_product: '3',
        is_default: true
      }
    ],
    updatedAt: new Date('2024-01-01'),
    details_point: ['Feature 1', 'Feature 2'],
    type: 'product',
    status: 'active',
    for_schedule: false
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
export const getProductById = async (id: string): Promise<Product | undefined> => {
  await delay(800); // Simulate network delay
  return mockProducts.find(product => product.id_product === id);
};

// Search products by name
export const searchProducts = async (query: string): Promise<Product[]> => {
  await delay(600); // Simulate network delay
  return mockProducts.filter(product => 
    product.title.toLowerCase().includes(query.toLowerCase()) ||
    product.description.toLowerCase().includes(query.toLowerCase())
  );
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  await delay(700); // Simulate network delay
  return mockProducts.filter(product => 
    product.id_category === category
  );
}; 