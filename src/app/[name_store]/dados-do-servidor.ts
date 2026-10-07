import { cache } from 'react'
import { serverApi } from '@/api'
import type { Product } from '@/types/catalog'

// As buscas que o SERVIDOR faz para montar os metadados de `/{loja}` e das
// rotas abaixo dela.
//
// Moram num módulo próprio, e não dentro de `layout.tsx`, por causa do
// `cache` do React: ele deduplica por referência de função, então o layout e
// a página do produto só dividem uma ida à API se chamarem a MESMA função.
// Cada arquivo com a sua cópia daria duas requisições por carregamento, que é
// exatamente o que o `cache` existe para evitar.

/** O que estas rotas usam da resposta da loja. Não é o DTO inteiro: aqui só
 *  se montam metadados, e declarar só o que se lê deixa claro o que uma
 *  mudança no `enterprise_dto.go` pode quebrar deste lado. */
export interface LojaDoServidor {
  name: string
  tradeName?: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  address?: { city?: string; state?: string }
}

/** O desfecho da busca da loja no servidor.
 *
 *  `nao-encontrada` e `indisponivel` são desfechos DIFERENTES, e a diferença
 *  decide se o caminho devolve 404: slug que não existe tem de devolver 404,
 *  mas API fora do ar não pode fazer a loja de um cliente desaparecer do
 *  Google. É a mesma distinção que `useEmpresa` faz no cliente. */
export type BuscaDaLoja =
  | { situacao: 'encontrada'; loja: LojaDoServidor }
  | { situacao: 'nao-encontrada' }
  | { situacao: 'indisponivel' }

/**
 * A loja do slug, buscada no servidor.
 *
 * GET /enterprises/by-slug/{slug} (enterprise_handler.go): rota pública nova.
 * `/enterprise/{slug}` (singular) é do contrato anterior e não existe mais.
 */
export const buscarLoja = cache(async (slug: string): Promise<BuscaDaLoja> => {
  try {
    const { data } = await serverApi.get<LojaDoServidor | null>(
      `/enterprises/by-slug/${slug}`,
    )
    if (!data) return { situacao: 'nao-encontrada' }
    return { situacao: 'encontrada', loja: data }
  } catch (erro) {
    const status = (erro as { response?: { status?: number } })?.response?.status
    if (status === 404) return { situacao: 'nao-encontrada' }
    console.error('Erro ao buscar a loja:', erro)
    return { situacao: 'indisponivel' }
  }
})

/**
 * O produto do código, buscado no servidor para montar o preview do link.
 *
 * GET /enterprises/by-slug/{slug}/products/{code}: a mesma rota pública que
 * `ProductDetail` usa no cliente.
 *
 * Devolve `null` em QUALQUER falha, e não um desfecho de três estados como a
 * loja: aqui não há decisão de 404 a tomar. O 404 de slug inexistente já foi
 * dado pelo layout, que embrulha esta rota, e produto que não carrega apenas
 * cai no preview da loja — um link de produto que some do WhatsApp porque a
 * API soluçou seria pior que um preview com o logo.
 */
export const buscarProduto = cache(
  async (slug: string, code: string): Promise<Product | null> => {
    try {
      const { data } = await serverApi.get<Product | null>(
        `/enterprises/by-slug/${slug}/products/${code}`,
      )
      return data ?? null
    } catch {
      return null
    }
  },
)
