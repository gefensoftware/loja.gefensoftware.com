// Montagem da mensagem de pedido para o WhatsApp.
//
// O pedido não é gravado em lugar nenhum: a vitrine só abre uma conversa com
// a loja com o carrinho escrito por extenso. Por isso o envio não exige
// login — quem montou carrinho anônimo manda a mensagem do mesmo jeito.
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

export function montarMensagemDoPedido({ linhas, total, urlDaLoja }: DadosDoPedido): string {
  const itens = linhasDoPedido(linhas);
  const partes = ['Olá! Gostaria de fazer este pedido:', '', ...itens.map(descreveLinha), ''];
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
