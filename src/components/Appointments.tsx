
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Appointment {
  id: number;
  date: string;
  time: string;
  service: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const mockAppointments: Appointment[] = [
  {
    id: 1,
    date: '2024-03-20',
    time: '14:00',
    service: 'Consulta de Rotina',
    location: 'Clínica Central',
    status: 'confirmed'
  },
  {
    id: 2,
    date: '2024-03-25',
    time: '10:30',
    service: 'Exame de Sangue',
    location: 'Laboratório Principal',
    status: 'pending'
  }
];

const statusColors = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusText = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado'
};

const Appointments = () => {
  return (
    <div className="space-y-4">
      {mockAppointments.map((appointment) => (
        <Card key={appointment.id} className="border-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{appointment.service}</CardTitle>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                {statusText[appointment.status]}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.location}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">Remarcar</Button>
              <Button variant="destructive" size="sm">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Appointments; 