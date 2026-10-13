import { api } from '@/api';
import type { Appointment } from '@/types/agenda';

// O lado do cliente da agenda.
//
// A disponibilidade é a ÚNICA rota pública, e ela devolve só horários: o
// servidor calcula os livres a partir do expediente menos o que já está
// confirmado, e a agenda nunca sai. O contrato antigo entregava os eventos
// inteiros — com nome e e-mail de quem tinha hora marcada — a qualquer
// visitante, sem autenticação.

type Disponibilidade = { date: string; slots: string[] };

// `technicianId` recorta os horários de uma profissional; ausente é "sem
// preferência", e o servidor devolve o horário se ALGUMA estiver livre.
export async function horariosLivres(
  nameStore: string,
  code: number,
  data: string,
  technicianId?: string
): Promise<string[]> {
  const { data: resposta } = await api.get<Disponibilidade>(
    `/enterprises/by-slug/${nameStore}/products/${code}/availability`,
    { params: { date: data, technicianId } }
  );
  return resposta.slots;
}

export type Profissional = { id: string; name: string };

// Com quem o cliente pode marcar. Pública como a disponibilidade, e pelo
// mesmo motivo devolve só id e nome. Lista vazia é a loja que atende sozinha
// ou não pôs ninguém à escolha — e então o painel nem pergunta.
export async function profissionaisDaLoja(nameStore: string): Promise<Profissional[]> {
  const { data } = await api.get<Profissional[]>(`/enterprises/by-slug/${nameStore}/technicians`);
  return data;
}

type Pagina = { data: Appointment[]; page: number; pageSize: number; total: number };

export async function pedirHorario(body: {
  enterpriseId: string;
  productId: string;
  startsAt: string;
  notes: string;
  technicianId?: string;
}): Promise<Appointment> {
  const { data } = await api.post<Appointment>('/users/me/appointments', body);
  return data;
}

export async function listarMeusAgendamentos(pageSize = 100): Promise<Appointment[]> {
  const { data } = await api.get<Pagina>('/users/me/appointments', { params: { pageSize } });
  return data.data;
}

export async function desmarcar(id: string, note: string): Promise<Appointment> {
  const { data } = await api.post<Appointment>(`/users/me/appointments/${id}/cancel`, { note });
  return data;
}
