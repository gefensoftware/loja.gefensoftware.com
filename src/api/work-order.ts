import { api } from '@/api';
import type { WorkOrder } from '@/types/work-order';

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
