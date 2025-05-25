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
      id: '1',
      street: 'Rua Principal',
      number: '123',
      complement: 'Sala 101',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '00000-000'
    },
    logo: {
      id: '1',
      url: 'https://via.placeholder.com/150',
      alt: 'Logo Empresa A'
    },
    banner: {
      id: '2',
      url: 'https://via.placeholder.com/1200x300',
      alt: 'Banner Empresa A'
    },
    emails: [
      {
        id: '1',
        email: 'contato@empresaa.com',
        type: 'commercial'
      }
    ],
    phones: [
      {
        id: '1',
        phone: '(11) 9999-9999',
        type: 'commercial'
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
      id: '2',
      street: 'Avenida Secundária',
      number: '456',
      complement: null,
      neighborhood: 'Jardim',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zip_code: '11111-111'
    },
    logo: {
      id: '3',
      url: 'https://via.placeholder.com/150',
      alt: 'Logo Empresa B'
    },
    banner: {
      id: '4',
      url: 'https://via.placeholder.com/1200x300',
      alt: 'Banner Empresa B'
    },
    emails: [
      {
        id: '2',
        email: 'contato@empresab.com',
        type: 'commercial'
      }
    ],
    phones: [
      {
        id: '2',
        phone: '(21) 8888-8888',
        type: 'commercial'
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