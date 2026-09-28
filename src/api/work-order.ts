import { api } from '@/api';
import type { WorkOrder, WorkOrderStatus } from '@/types/work-order';

// O lado do cliente da ordem de serviço. Quem abre a ordem é a loja, no
// balcão — aqui a pessoa acompanha o que deixou e responde ao orçamento.
//
// A lista é do cliente em TODAS as oficinas, como "meus orçamentos": a
// pessoa tem um histórico só, não um por vitrine que visitou.

type Pagina = { data: WorkOrder[]; page: number; pageSize: number; total: number };

export async function listarMinhasOrdens(): Promise<WorkOrder[]> {
  const { data } = await api.get<Pagina>('/users/me/work-orders', {
    params: { pageSize: 100 },
  });
  return data.data;
}

// lerMinhaOrdem existe para a nota impressa: sem ela, a tela precisaria
// baixar a lista inteira e procurar a linha, o que quebra na primeira pessoa
// com mais ordens do que cabem numa página.
export async function lerMinhaOrdem(id: string): Promise<WorkOrder> {
  const { data } = await api.get<WorkOrder>(`/users/me/work-orders/${id}`);
  return data;
}

export async function aprovarOrdem(id: string): Promise<WorkOrder> {
  const { data } = await api.post<WorkOrder>(`/users/me/work-orders/${id}/approve`);
  return data;
}

export async function recusarOrdem(id: string, note: string): Promise<WorkOrder> {
  const { data } = await api.post<WorkOrder>(`/users/me/work-orders/${id}/decline`, { note });
  return data;
}

// O link de acompanhamento que a oficina manda no WhatsApp.
//
// A prévia é PÚBLICA e mostra só o que faz a pessoa se reconhecer — loja,
// número da ordem, equipamento. Nome, telefone, defeito e valor ficam do
// outro lado do login: o link circula por mensagem e pode chegar a qualquer
// um.
export type PreviaDoLink = {
  number: number;
  storeName: string;
  storeSlug: string;
  equipment: string;
  status: WorkOrderStatus;
};

export async function lerPreviaDoLink(token: string): Promise<PreviaDoLink> {
  const { data } = await api.get<PreviaDoLink>(`/work-orders/claim/${token}`);
  return data;
}

/** Vincula a ordem do link à conta de quem está logado. */
export async function vincularOrdem(token: string): Promise<WorkOrder> {
  const { data } = await api.post<WorkOrder>('/users/me/work-orders/claim', { token });
  return data;
}
