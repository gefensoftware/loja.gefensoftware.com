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
      phone: '+1 (555) 123-4567',
      is_whatsapp: true
    }
  ],
  theme: {
    id_enterprise_theme: '1',
    id_enterprise: '1',
    light_primary_color: '#2563eb',
    light_secondary_color: '#64748b',
    light_background_color: '#f8fafc',
    light_text_color: '#1e293b',
    dark_primary_color: '#3b82f6',
    dark_secondary_color: '#94a3b8',
    dark_background_color: '#0f172a',
    dark_text_color: '#f1f5f9',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  business_days: [
    {
      id_business_day: '1',
      day_of_week: 'monday',
      is_closed: false,
      business_hours: [
        {
          id: '1',
          open_time: '08:00',
          close_time: '18:00',
          is_closed: false
        }
      ],
      is_open: true
    }
  ]
}; 