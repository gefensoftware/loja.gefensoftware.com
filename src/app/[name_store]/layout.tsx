import { Suspense } from 'react'
import { serverApi } from '@/api'
import LoadingScreen from '@/components/LoadingScreen'
import Navbar from '@/components/Navbar'
import StoreLayoutClient from './StoreLayoutClient'
import { Metadata } from 'next'

// Função para gerar metadados dinâmicos
export async function generateMetadata({ 
  params 
}: { 
  params: { name_store: string } 
}): Promise<Metadata> {
  try {
    // GET /enterprises/by-slug/{slug} (enterprise_handler.go): rota pública
    // nova. `/enterprise/{slug}` (singular) é do contrato anterior e não
    // existe mais — os metadados eram sempre os do bloco catch abaixo.
    const { data: enterprise } = await serverApi.get(`/enterprises/by-slug/${params.name_store}`)

    if (!enterprise) {
      return {
        title: 'Loja não encontrada',
        description: 'A loja solicitada não foi encontrada.'
      }
    }

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
  } catch (error) {
    console.error('Erro ao gerar metadados:', error)
    return {  
      title: 'Erro ao carregar loja',
      description: 'Ocorreu um erro ao carregar a loja.'
    }
  }
}

export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { name_store: string }
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <StoreLayoutClient params={params}>
        {children}
      </StoreLayoutClient>
    </Suspense>
  )
} 