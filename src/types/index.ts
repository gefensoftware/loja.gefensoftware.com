export interface Category {
  id_category: string;
  name: string;
  description?: string;
}

export interface Product {
  id_product: string;
  title: string;
  description: string;
  extra: string;
  price: Prices[];
  is_budget: boolean;
  id_category: string;
  createdAt: Date;
  photo_library: Image[];
  updatedAt: Date;
  details_point: string[];
  id_service?: string;
  service?: Product;
}

export type Prices = {
  id_price: string;
  id_product: string;
  name: string;
  value: number;
}

export type Image = {
  id_image: string;
  key: string;
  location: string;
  mimetype: string;
  size: number;
  originalname: string;
  id_product: string;
  is_default: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
  isMain: boolean;
  createdAt: Date;
}