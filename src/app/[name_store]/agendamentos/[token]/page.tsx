import GuestAppointment from '@/screens/GuestAppointment'

// Fica sob /agendamentos de propósito: herda o Disallow de
// CAMINHOS_SEM_RASTREAMENTO (app/robots.ts), e rotaAceitaAnuncio já a deixa
// sem anúncio. É uma tela de estado do visitante, não conteúdo da loja.
export default function AgendamentoSemContaPage() {
  return <GuestAppointment />
}
