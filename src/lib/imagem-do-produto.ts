import type { ProductImage } from '@/types/catalog'

/**
 * A imagem que representa o produto: a marcada como principal e, na falta
 * dela, a primeira da galeria.
 *
 * A ordenação por `position` vem ANTES da escolha, e não é detalhe: sem ela,
 * "a primeira" é a ordem em que o JSON chegou, que não é a ordem que o
 * lojista arrumou. Produto sem `isMain` marcada apareceria com uma foto no
 * preview do link e outra na galeria da tela.
 *
 * Devolve `undefined` no produto sem foto nenhuma — quem chama decide a
 * reserva, porque ela é diferente em cada lugar (o preview do link cai no
 * logo da loja; o cartão da lista, num espaço reservado).
 */
export function imagemPrincipal(
  images: ProductImage[] | undefined,
): ProductImage | undefined {
  if (!images?.length) return undefined
  const ordenadas = [...images].sort((a, b) => a.position - b.position)
  return ordenadas.find((i) => i.isMain) ?? ordenadas[0]
}
