import { api } from '@/api';
import type { BudgetRequest, BudgetStatus } from '@/types/budget';

// O lado do cliente do orçamento. A loja fala com
// /enterprises/:eid/budget-requests, que é o portal, não esta vitrine.
//
// Todas as rotas exigem token: o dono do pedido sai de lá, nunca do corpo ou
// do caminho — o mesmo contrato do carrinho do servidor.

type Pagina = { data: BudgetRequest[]; page: number; pageSize: number; total: number };

export async function criarPedidoDeOrcamento(
  enterpriseId: string,
  productId: string,
  message: string
): Promise<BudgetRequest> {
  const { data } = await api.post<BudgetRequest>('/users/me/budget-requests', {
    enterpriseId,
    productId,
    message,
  });
  return data;
}

// listarMeusPedidos aceita o filtro por produto porque a tela de um produto
// só quer saber do pedido DAQUELE item: sem ele, ela baixaria o histórico
// inteiro da pessoa para achar uma linha.
export async function listarMeusPedidos(params: {
  productId?: string;
  status?: BudgetStatus;
  pageSize?: number;
} = {}): Promise<BudgetRequest[]> {
  const { data } = await api.get<Pagina>('/users/me/budget-requests', { params });
  return data.data;
}

export async function aceitarCotacao(id: string): Promise<BudgetRequest> {
  const { data } = await api.post<BudgetRequest>(`/users/me/budget-requests/${id}/accept`);
  return data;
}

export async function recusarCotacao(id: string, note: string): Promise<BudgetRequest> {
  const { data } = await api.post<BudgetRequest>(`/users/me/budget-requests/${id}/decline`, { note });
  return data;
}

export async function cancelarPedido(id: string): Promise<BudgetRequest> {
  const { data } = await api.post<BudgetRequest>(`/users/me/budget-requests/${id}/cancel`);
  return data;
}
