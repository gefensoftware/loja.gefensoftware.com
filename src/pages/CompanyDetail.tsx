'use client'

import React from 'react';
import { useParams } from 'next/navigation';

const CompanyDetail: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;

  // Mock data - in a real application, this would come from an API
  const company = {
    id: Number(id),
    name: `Empresa ${id}`,
    description: `Descrição detalhada da Empresa ${id}`,
    address: 'Endereço da empresa',
    phone: '(00) 0000-0000',
    email: 'contato@empresa.com'
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{company.name}</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Descrição</h2>
            <p className="text-gray-600">{company.description}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Endereço</h2>
            <p className="text-gray-600">{company.address}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Contato</h2>
            <p className="text-gray-600">Telefone: {company.phone}</p>
            <p className="text-gray-600">Email: {company.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail; 