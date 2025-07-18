import { Enterprise } from '../types/enterprise';

// Mock data for enterprises
const mockEnterprises: Enterprise[] = [
  {
    id_enterprise: '1',
    id_address: '1',
    id_image: '1',
    id_image_banner: '2',
    name: 'Empresa A Ltda',
    name_fantasy: 'Empresa A',
    description: 'Descrição da Empresa A',
    cnpj: '00.000.000/0001-00',
    address: {
      id_address: '1',
      id_user: null,
      id_product: null,
      id_enterprise: '1',
      street: 'Rua Principal',
      number: 123,
      complement: 'Sala 101',
      neighborhood: 'Centro',
      city: 'São Paulo',
      uf: 'SP',
      lat: null,
      lng: null,
      zipcode: '00000-000',
      country: 'Brasil'
    },
    logo: {
      id_image: '1',
      key: 'logo.png',
      location: 'https://via.placeholder.com/150',
      mimetype: 'image/png',
      size: 1024,
      originalname: 'logo.png',
      id_product: '1'
    },
    banner: {
      id_image: '2',
      key: 'banner.jpg',
      location: 'https://via.placeholder.com/1200x300',
      mimetype: 'image/jpeg',
      size: 2048,
      originalname: 'banner.jpg',
      id_product: '1'
    },
    emails: [
      {
        id_enterprise_email: '1',
        id_enterprise: '1',
        name: 'Email Principal',
        email: 'contato@empresaa.com'
      }
    ],
    phones: [
      {
        id_enterprise_phone: '1',
        id_enterprise: '1',
        name: 'Telefone Principal',
        phone: '(11) 9999-9999',
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
  },
  {
    id_enterprise: '2',
    id_address: '2',
    id_image: '3',
    id_image_banner: '4',
    name: 'Empresa B S.A.',
    name_fantasy: 'Empresa B',
    description: 'Descrição da Empresa B',
    cnpj: '00.000.000/0002-00',
    address: {
      id_address: '2',
      id_user: null,
      id_product: null,
      id_enterprise: '2',
      street: 'Avenida Secundária',
      number: 456,
      complement: '',
      neighborhood: 'Jardim',
      city: 'Rio de Janeiro',
      uf: 'RJ',
      lat: null,
      lng: null,
      zipcode: '11111-111',
      country: 'Brasil'
    },
    logo: {
      id_image: '3',
      key: 'logo.png',
      location: 'https://via.placeholder.com/150',
      mimetype: 'image/png',
      size: 1024,
      originalname: 'logo.png',
      id_product: '1'
    },
    banner: {
      id_image: '4',
      key: 'banner.jpg',
      location: 'https://via.placeholder.com/1200x300',
      mimetype: 'image/jpeg',
      size: 2048,
      originalname: 'banner.jpg',
      id_product: '1'
    },
    emails: [
      {
        id_enterprise_email: '2',
        id_enterprise: '2',
        name: 'Email Principal',
        email: 'contato@empresab.com'
      }
    ],
    phones: [
      {
        id_enterprise_phone: '2',
        id_enterprise: '2',
        name: 'Telefone Principal',
        phone: '(21) 8888-8888',
        is_whatsapp: true
      }
    ],
    theme: {
      id_enterprise_theme: '2',
      id_enterprise: '2',
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
        id_business_day: '2',
        day_of_week: 'monday',
        is_closed: false,
        business_hours: [
          {
            id: '2',
            open_time: '08:00',
            close_time: '18:00',
            is_closed: false
          }
        ],
        is_open: true
      }
    ]
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all enterprises
export const getEnterprises = async (): Promise<Enterprise[]> => {
  await delay(800);
  return mockEnterprises;
};

// Get enterprise by ID
export const getEnterpriseById = async (id: string): Promise<Enterprise | undefined> => {
  await delay(600);
  return mockEnterprises.find(enterprise => enterprise.id_enterprise === id);
}; 