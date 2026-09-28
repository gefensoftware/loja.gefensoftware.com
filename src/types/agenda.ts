// Espelho de appointmentResponse na API Go (internal/adapters/in/http/
// appointment_dto.go).
//
// `requested` é o pedido do cliente e `confirmed` é a loja aceitando. Só
// `confirmed` segura o horário: pedir não tira a hora de ninguém, e é por isso
// que dois clientes podem pedir o mesmo horário e só um ficar com ele.
export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'no_show';

export type Appointment = {
  id: string;
  enterpriseId: string;
  status: AppointmentStatus;
  title: string;
  notes: string;
  budgetRequestId: string | null;
  startsAt: string;
  endsAt: string;
  closedNote: string;
  // Nulo quando a loja marcou um horário LIVRE, fora do catálogo — "traga o
  // carro que eu vejo o que está acontecendo". Não há página de produto para
  // onde apontar, e quem nomeia a marcação é o `title`.
  product: {
    id: string;
    code: number;
    title: string;
    status: string;
    image: { id: string; url: string; position: number } | null;
  } | null;
  customer: {
    id: string | null;
    customerId: string | null;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
};

// Em aberto é o que ainda vai acontecer — o que o cliente pode desmarcar.
export function agendaEmAberto(status: AppointmentStatus): boolean {
  return status === 'requested' || status === 'confirmed';
}
