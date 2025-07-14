import { useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Calendar, Clock, MapPin, Package, Plus } from 'lucide-react';
import AppointmentModal from '../components/AppointmentModal';
import { toast } from 'react-toastify';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered';
  appointment?: {
    date: string;
    time: string;
    location: string;
  };
}

const mockOrder: Order = {
  id: 1,
  items: [
    { id: 1, name: 'Produto A', quantity: 2, price: 100 },
    { id: 2, name: 'Produto B', quantity: 1, price: 150 },
  ],
  total: 350,
  status: 'pending',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  delivered: 'bg-blue-100 text-blue-800'
};

const statusText = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  delivered: 'Entregue'
};

const OrderDetails = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSchedule = () => {
    // Aqui você pode fazer a chamada para a API para agendar
    toast.success('Agendamento realizado com sucesso!');
  };

  return (
    <div className="py-2 px-2">
      <Button
        variant="ghost"
        className="mb-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="space-y-4">
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pedido #{mockOrder.id}</CardTitle>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[mockOrder.status]}`}>
                {statusText[mockOrder.status]}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Itens do Pedido</h3>
                <div className="space-y-2">
                  {mockOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <span>R$ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>R$ {mockOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {mockOrder.appointment ? (
                <div>
                  <h3 className="font-medium mb-2">Agendamento</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(mockOrder.appointment.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{mockOrder.appointment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{mockOrder.appointment.location}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Entrega
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleSchedule}
      />
    </div>
  );
};

export default OrderDetails; 