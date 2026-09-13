// Preço é sempre texto vindo do servidor (domain.Money serializado como
// string decimal). Este módulo nunca faz aritmética sobre ele — nem
// `parseFloat`, nem `Number(...)`, nem soma/subtração — porque o total do
// carrinho e o valor efetivo já vêm calculados do servidor. As duas funções
// abaixo espelham regras que o servidor já resolveu; ver Price.Effective e
// PromotionState em domain (internal/core/domain/catalog.go).
import type { Price } from '@/types/catalog';

/** O valor que o cliente paga agora. Espelha Price.Effective no servidor. */
export function valorEfetivo(p: Price): string {
  return p.promotion?.state === 'active' ? p.promotion.value : p.value;
}

/** Verdadeiro quando há promoção valendo agora, caso em que o valor base
 *  aparece riscado ao lado do promocional. */
export function temPromocaoVigente(p: Price): boolean {
  return p.promotion?.state === 'active';
}

/** Formata um valor monetário textual para exibição (ponto vira vírgula),
 *  sem nunca converter para número. */
export function formatarPreco(valor: string): string {
  return `R$ ${valor.replace('.', ',')}`;
}
