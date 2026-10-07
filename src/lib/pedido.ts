// Montagem da mensagem de pedido para o WhatsApp.
//
// A vitrine abre uma conversa com a loja com o carrinho escrito por extenso, e
// GRAVA o mesmo carrinho na API antes de abrir — é o que dá ao lojista um
// lugar para confirmar, depois da conversa, que o pedido foi finalizado, e é
// essa confirmação que vira lançamento no caixa dele.
//
// O envio continua sem exigir login: quem montou carrinho anônimo manda a
// mensagem do mesmo jeito, e a rota que grava o pedido é pública pelo mesmo
// motivo.
//
// O número do pedido é o que liga as duas pontas. Sem ele a mensagem é a de
// antes — ver `montarMensagemDoPedido`, que o trata como opcional de
// propósito.
//
// Nada aqui faz conta: os valores saem como vieram (`effectiveValue`,
// `lineTotal`, `total`), só trocando o ponto pela vírgula na formatação. Um
// total somado no navegador poderia divergir do que a loja cobra, e é
// exatamente essa divergência silenciosa que a fatia inteira evita.
import { formatarPreco } from '@/lib/price';
import type { LinhaDoCarrinho } from '@/store/cart';

export interface DadosDoPedido {
  linhas: LinhaDoCarrinho[];
  /** O total do servidor, como veio. Nulo quando o carrinho é anônimo. */
  total: string | null;
  /** Endereço do **cardápio da loja**, para o cliente (e a loja) voltarem
   *  ao lugar certo. Não é a página atual: enviada da tela do carrinho, ela
   *  apontaria para o carrinho de quem mandou. */
  urlDaLoja: string;
  /**
   * O número com que o pedido foi gravado, quando foi.
   *
   * Nulo é um caso previsto, e não um erro a tratar: é a gravação que falhou.
   * A mensagem vai sem o número — perder a venda porque a nossa API piscou
   * seria pior do que perder a linha que o lojista ia confirmar depois.
   */
  numero?: number | null;
}

/** As linhas que de fato entram no pedido: produto fora do cardápio não vai,
 *  pelo mesmo motivo que não entra no total do servidor. */
export function linhasDoPedido(linhas: LinhaDoCarrinho[]): LinhaDoCarrinho[] {
  return linhas.filter((l) => !l.foraDoCardapio);
}

function descreveLinha(l: LinhaDoCarrinho): string {
  const nome = l.price.name ? `${l.product.title} (${l.price.name})` : l.product.title;
  const unitario = `${formatarPreco(l.effectiveValue)} cada`;
  // `lineTotal` só existe no carrinho do servidor. Sem ele, a mensagem
  // informa a quantidade e o valor unitário e para por aí.
  const valor = l.lineTotal ? ` — ${formatarPreco(l.lineTotal)}` : '';
  return `• ${l.quantity}x ${nome} — ${unitario}${valor}`;
}

export function montarMensagemDoPedido({
  linhas,
  total,
  urlDaLoja,
  numero,
}: DadosDoPedido): string {
  const itens = linhasDoPedido(linhas);
  // O número vem na PRIMEIRA linha, e em negrito, porque é o que o lojista
  // procura: é por ele que ele acha este pedido na tela para confirmar que
  // fechou. Enterrado no fim da mensagem, ele não seria lido.
  const abertura = numero
    ? `Olá! Gostaria de fazer este pedido (*nº ${numero}*):`
    : 'Olá! Gostaria de fazer este pedido:';
  const partes = [abertura, '', ...itens.map(descreveLinha), ''];
  partes.push(
    total
      ? `*Total: ${formatarPreco(total)}*`
      : '*Total: a confirmar com a loja*',
  );
  if (urlDaLoja) {
    partes.push('', `Cardápio: ${urlDaLoja}`);
  }
  return partes.join('\n');
}

/** O telefone de WhatsApp da loja, quando há um marcado como tal. */
export function telefoneDeWhatsApp(
  phones: { phone: string; isWhatsapp: boolean }[] | undefined,
): string | null {
  return phones?.find((p) => p.isWhatsapp)?.phone ?? null;
}

export function linkDoWhatsApp(telefone: string, mensagem: string): string {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
