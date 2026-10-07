import { Metadata } from 'next'
import ProductDetail from '@/screens/ProductDetail'
import { imagemPrincipal } from '@/lib/imagem-do-produto'
import { buscarLoja, buscarProduto } from '../../dados-do-servidor'

// O preview do link do PRODUTO.
//
// Sem isto a rota herdava os metadados do layout da loja, que são os da
// vitrine inteira: quem mandava "Gostaria de saber mais sobre o Beijinho" no
// WhatsApp via o logo da loja e o título "Catálogo Digital" — o mesmo cartão
// para todos os produtos, sem dizer qual deles o link abre.
//
// A imagem é a do produto, pela mesma regra da galeria da tela
// (`imagemPrincipal`): o cartão do WhatsApp e a página têm de mostrar a
// mesma foto, senão o link promete um doce e abre outro.
export async function generateMetadata({
  params,
}: {
  params: { name_store: string; code: string }
}): Promise<Metadata> {
  const [busca, produto] = await Promise.all([
    buscarLoja(params.name_store),
    buscarProduto(params.name_store, params.code),
  ])

  const loja = busca.situacao === 'encontrada' ? busca.loja : null

  // Produto que não carregou: devolver objeto vazio deixa valer o que o
  // layout já montou para a loja, que é a reserva certa — um preview com o
  // logo da loja diz menos, mas não mente.
  if (!produto) return {}

  const url = `https://loja.gefensoftware.com/${params.name_store}/product/${params.code}`
  const imagem = imagemPrincipal(produto.images)
  const nomeDaLoja = loja?.name ?? ''
  const titulo = nomeDaLoja ? `${produto.title} | ${nomeDaLoja}` : produto.title
  // A descrição do produto é escrita para a página e pode vir longa ou
  // vazia; o cartão do link corta em poucas linhas de qualquer jeito. Sem
  // descrição, a frase diz o que o link faz em vez de ficar em branco.
  const descricao =
    produto.description?.trim() ||
    (nomeDaLoja ? `Veja ${produto.title} no catálogo de ${nomeDaLoja}.` : produto.title)

  // Sem foto do produto, a reserva é o logo da loja (a escolha do lojista):
  // o preview nunca fica sem imagem, e a marca diz mais que um vazio.
  //
  // Omitir `images` por completo NÃO serviria de reserva: o Next não herda o
  // openGraph do layout quando a página declara o seu, então o cartão sairia
  // sem imagem nenhuma.
  const imagens = imagem
    ? [{ url: imagem.url, alt: produto.title }]
    : loja?.logoUrl
      ? [{ url: loja.logoUrl, width: 150, height: 150, alt: `Logo ${nomeDaLoja}` }]
      : []

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url,
      siteName: nomeDaLoja || undefined,
      title: titulo,
      description: descricao,
      images: imagens,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: imagens.map((i) => i.url),
    },
    alternates: { canonical: url },
  }
}

export default function ProductDetailPage() {
  return <ProductDetail />
}
