import { api } from './index';
import type { CartLine, Order } from '@/types/catalog';

/**
 * Grava o pedido que a vitrine está encaminhando para o WhatsApp da loja.
 *
 * Sem token de propósito: o carrinho da vitrine é anônimo, e exigir login para
 * mandar uma mensagem mataria a venda que este caminho existe para capturar. A
 * rota na API é pública pelo mesmo motivo.
 *
 * O corpo manda só REFERÊNCIAS — produto, preço, quantidade. Não há campo de
 * valor, e essa ausência é a regra: o preço é resolvido no servidor contra o
 * catálogo, porque o número que o lojista vai lançar no caixa não pode vir do
 * navegador de quem compra.
 */
export const encaminharPedido = (eid: string, items: CartLine[]) =>
  api.post<Order>(`/enterprises/${eid}/orders`, { items }).then((r) => r.data);
