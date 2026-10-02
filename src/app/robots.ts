import type { MetadataRoute } from 'next'

// `/robots.txt` na raiz do domínio. Antes deste arquivo o caminho caía no
// segmento dinâmico `[name_store]`: o Google pedia as regras de rastreamento
// e recebia HTTP 200 com a tela "Loja não encontrada" de uma loja chamada
// "robots.txt". Sem regras, ele rastreava tudo — inclusive as telas abaixo.
//
// O segmento estático tem precedência sobre `[name_store]`, pelo mesmo
// caminho de `/ads.txt`.

/** Caminhos de uso pessoal dentro de uma loja: carrinho, perfil, pedidos,
 *  agendamentos, orçamentos.
 *
 *  Não são conteúdo publicado — são telas de navegação e de estado do
 *  visitante, muitas vezes vazias (carrinho sem item, lista sem pedido). A
 *  política do AdSense proíbe anúncio em tela "usada para alertas, navegação
 *  ou outros fins comportamentais", e indexá-las enche o índice do Google de
 *  páginas sem conteúdo do editor.
 *
 *  `Disallow` é casamento por prefixo, então `/x/profile` cobre
 *  `/x/profile/dados`, `/x/profile/foto` e `/x/profile/senha`. O `*` no meio
 *  é o curinga do slug da loja.
 *
 *  Esta lista é a metade de rastreamento da mesma decisão que
 *  `rotaAceitaAnuncio` (`lib/anuncios.ts`) aplica aos anúncios: mudar uma
 *  pede olhar a outra. */
export const CAMINHOS_SEM_RASTREAMENTO = [
  '/*/cart',
  '/*/profile',
  '/*/ordens',
  '/*/agendamentos',
  '/*/orcamentos',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: CAMINHOS_SEM_RASTREAMENTO,
      },
    ],
    host: 'https://loja.gefensoftware.com',
  }
}
