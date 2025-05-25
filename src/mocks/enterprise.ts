import { Enterprise } from '../types/enterprise';

export const mockEnterprise: Enterprise = {
  id_enterprise: '1',
  id_address: '1',
  id_image: '1',
  id_image_banner: '2',
  name: 'Enterprise Name',
  name_fantasy: 'Enterprise Fantasy Name',
  description: 'A great enterprise description',
  cnpj: '12345678901234',
  address: {
    id_user: '1',
    id_product: '1',
    id_enterprise: '1',
    lat: 123,
    lng: 123,
    uf: 'NY',
    id_address: '1',
    street: 'Main Street',
    number: 123,
    complement: 'Suite 100',
    neighborhood: 'Downtown',
    city: 'New York',
    country: 'USA',
    zipcode: '10001'
  },
  logo: {
    id_product: '1',
    id_image: '1',
    key: 'logo.png',
    location: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200',
    mimetype: 'image/png',
    size: 1024,
    originalname: 'logo.png'
  },
  banner: {
    id_product: '1',
    id_image: '2',
    key: 'banner.jpg',
    location: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    mimetype: 'image/jpeg',
    size: 2048,
    originalname: 'banner.jpg'
  },
  emails: [
    {
      id_enterprise_email: '1',
      id_enterprise: '1',
      name: 'Main Email',
      email: 'contact@enterprise.com'
    }
  ],
  phones: [
    {
      id_enterprise_phone: '1',
      id_enterprise: '1',
      name: 'Main Phone',
      phone: '+1 (555) 123-4567'
    }
  ]
}; 