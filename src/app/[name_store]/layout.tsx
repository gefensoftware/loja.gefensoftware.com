import { Suspense, cache } from 'react'
import { notFound } from 'next/navigation'
import { serverApi } from '@/api'
import LoadingScreen from '@/components/LoadingScreen'
import Navbar from '@/components/Navbar'
import StoreLayoutClient from './StoreLayoutClient'
import { Metadata } from 'next'

/** O que esta rota usa da resposta da loja. Não é o DTO inteiro: aqui só se
 *  montam metadados, e declarar só o que se lê deixa claro o que uma mudança
 *  no `enterprise_dto.go` pode quebrar deste lado. */
interface LojaDoServidor {
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
type BuscaDaLoja =
  | { situacao: 'encontrada'; loja: LojaDoServidor }
  | { situacao: 'nao-encontrada' }
  | { situacao: 'indisponivel' }

/**
 * A loja do slug, buscada no servidor.
 *
 * `cache` do React: `generateMetadata` e o layout pedem a mesma loja no mesmo
 * pedido, e sem isso seriam duas idas à API por carregamento de página.
 *
 * GET /enterprises/by-slug/{slug} (enterprise_handler.go): rota pública nova.
 * `/enterprise/{slug}` (singular) é do contrato anterior e não existe mais.
 */
const buscarLoja = cache(async (slug: string): Promise<BuscaDaLoja> => {
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

// Função para gerar metadados dinâmicos
export async function generateMetadata({ 
  params 
}: { 
  params: { name_store: string } 
}): Promise<Metadata> {
  const busca = await buscarLoja(params.name_store)

  // Slug inexistente: o layout abaixo devolve 404 neste caminho, e estes são
  // os metadados da tela de 404. O `noindex` é o que faltava — até aqui
  // qualquer caminho inventado respondia 200 e herdava o `index: true` do
  // layout raiz, então `/robots.txt`, `/sitemap.xml` e todo erro de digitação
  // eram uma página fina indexável. É metade do que o AdSense chamou de
  // "telas sem conteúdo do editor".
  if (busca.situacao === 'nao-encontrada') {
    return {
      title: 'Loja não encontrada',
      description: 'A loja solicitada não foi encontrada.',
      robots: { index: false, follow: false },
    }
  }

  // API fora do ar. A loja existe (ou pode existir), e por isso NÃO se
  // devolve 404 — mas a tela que o cliente vai ver é "Não foi possível
  // carregar a loja", que também não é conteúdo para indexar. O `noindex` aqui
  // é temporário por natureza: passada a falha, o próximo rastreamento volta a
  // ver a vitrine e a indexa de novo.
  if (busca.situacao === 'indisponivel') {
    return {
      title: 'Erro ao carregar loja',
      description: 'Ocorreu um erro ao carregar a loja.',
      robots: { index: false, follow: false },
    }
  }

  const enterprise = busca.loja

  // enterprise_dto.go: logoUrl/bannerUrl são strings diretas (nunca nulas,
  // a API devolve "" sem logo/banner), não mais um objeto { location }.
  const logoUrl = enterprise.logoUrl || 'https://via.placeholder.com/150'
  const bannerUrl = enterprise.bannerUrl || 'https://via.placeholder.com/1200x630'

  return {
    title: `${enterprise.name} | Catálogo Digital`,
    description: enterprise.description || `Confira o Catálogo digital de ${enterprise.name}`,
    keywords: `${enterprise.tradeName}, Catálogo digital, delivery, ${enterprise.address?.city}, ${enterprise.address?.state}`,
    authors: [{ name: enterprise.name }],
    creator: enterprise.name,
    publisher: enterprise.name,
    
    // Open Graph / Facebook
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: `https://loja.gefensoftware.com/${params.name_store}`,
      siteName: enterprise.name,
      title: `${enterprise.name} | Catálogo Digital`,
      description: enterprise.description || `Confira o Catálogo digital de ${enterprise.name}`,
      images: [
        {
          url: logoUrl,
          width: 150,
          height: 150,
          alt: `Logo ${enterprise.name}`,
          type: 'image/png',
        },
        {
          url: bannerUrl,
          width: 1200,
          height: 630,
          alt: `Banner ${enterprise.name}`,
          type: 'image/jpeg',
        }
      ],
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: `${enterprise.name} | Catálogo Digital`,
      description: enterprise.description || `Confira o Catálogo digital de ${enterprise.name}`,
      images: [bannerUrl],
      creator: '@gefensoftware',
      site: '@gefensoftware',
    },
    
    // WhatsApp específico
    other: {
      'whatsapp-meta': 'true',
      'whatsapp-title': `${enterprise.name} | Catálogo Digital`,
      'whatsapp-description': enterprise.description || `Confira o Catálogo digital de ${enterprise.name}`,
      'whatsapp-image': logoUrl,
      'whatsapp-url': `https://loja.gefensoftware.com/${params.name_store}`,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Alternates
    alternates: {
      canonical: `https://loja.gefensoftware.com/${params.name_store}`,
    },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { name_store: string }
}) {
  // Slug que não é loja nenhuma responde 404 de verdade, e não 200 com a tela
  // "Loja não encontrada". O layout é o lugar certo para isso: ele embrulha
  // TODAS as rotas de `/{loja}`, então `/inventado/cart` e
  // `/inventado/profile` morrem no mesmo ponto que `/inventado`.
  //
  // Só `nao-encontrada` devolve 404. Falha de rede cai em `indisponivel` e
  // segue para a tela com o botão "Tentar novamente" — 404 numa soluço da API
  // apagaria a loja de um cliente pagante do índice do Google.
  const busca = await buscarLoja(params.name_store)
  if (busca.situacao === 'nao-encontrada') notFound()

  return (
    <Suspense fallback={<LoadingScreen />}>
      <StoreLayoutClient params={params}>
        {children}
      </StoreLayoutClient>
    </Suspense>
  )
} 