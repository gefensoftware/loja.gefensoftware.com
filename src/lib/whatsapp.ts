// O link de WhatsApp da loja, a partir do telefone que o lojista cadastrou.
//
// Existe como módulo porque dois botões mandam o pedido — o do carrinho e o
// do produto — e cada um montando o próprio `wa.me` deixou os dois com o
// telefone cru: o lojista cadastra "21988871706" (ou "(21) 98887-1706"), o
// wa.me lê isso como um número internacional sem país e o WhatsApp responde
// que o usuário "não está no WhatsApp".
//
// A regra é a mesma de `comCodigoDoPais` no portal: só dígitos, e o 55 na
// frente apenas quando falta.

/** O link que abre a conversa com a loja, com o texto já escrito. */
export function linkDoWhatsApp(telefone: string, texto?: string): string {
  const query = texto ? `?text=${encodeURIComponent(texto)}` : '';
  return `https://wa.me/${comCodigoDoPais(telefone)}${query}`;
}

// Quantos dígitos tem um telefone brasileiro, com e sem o código do país.
// Fixo é DDD + 8, celular é DDD + 9; com o 55 na frente, os dois ganham 2.
const NACIONAL = [10, 11];
const COM_PAIS = [12, 13];

/**
 * Os dígitos do telefone com o 55 na frente — acrescentado só quando falta.
 *
 * `startsWith('55')` não basta: 55 também é DDD (Santa Maria, RS). O celular
 * "(55) 99123-4567" vira "55991234567", começa com 55 e NÃO tem código de
 * país. Quem desempata é o comprimento: 11 dígitos é sempre número nacional,
 * 13 é sempre número com país, mesmo os dois começando com 55.
 */
export function comCodigoDoPais(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');
  // O "+" é o próprio lojista dizendo qual é o país; vale mais do que o
  // palpite por tamanho.
  if (telefone.trim().startsWith('+')) return digitos;
  if (COM_PAIS.includes(digitos.length) && digitos.startsWith('55')) return digitos;
  if (NACIONAL.includes(digitos.length)) return `55${digitos}`;
  // Fora desses tamanhos não dá para afirmar o que o número é. Vai como
  // está, sem prefixo inventado: melhor o WhatsApp avisar que o número não
  // existe do que abrir a conversa de um desconhecido.
  return digitos;
}
