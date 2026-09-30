import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from 'react-toastify'
import { CHAVE_TEMA } from '@/lib/tema'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export const metadata: Metadata = {
  title: 'Cardápio Digital | Gefen Software',
  description: 'Plataforma de cardápio digital para restaurantes e estabelecimentos',
  keywords: 'cardápio digital, delivery, restaurante, pedidos online, Gefen Software',
  authors: [{ name: 'Gefen Software' }],
  creator: 'Gefen Software',
  publisher: 'Gefen Software',

  // O favicon. Sem isto a aba da loja abre com o globo cinza do Chrome
  // enquanto portal e painel mostram a marca — eles declaram o mesmo arquivo
  // no <link rel="icon"> do index.html, e aqui, no App Router, o caminho é a
  // chave `icons` (um `<link>` escrito à mão no <head> abaixo o Next remove).
  // As rotas de loja herdam este valor: o generateMetadata de
  // [name_store]/layout.tsx não devolve `icons`, e o que ele não devolve o
  // Next mantém do layout pai.
  icons: {
    icon: [{ url: '/assets/logo-asset.png', type: 'image/png' }],
    apple: '/assets/logo-asset.png',
  },

  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://loja.gefensoftware.com',
    siteName: 'Cardápio Digital',
    title: 'Cardápio Digital | Gefen Software',
    description: 'Plataforma de cardápio digital para restaurantes e estabelecimentos',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630/2563eb/ffffff?text=Cardápio+Digital',
        width: 1200,
        height: 630,
        alt: 'Cardápio Digital - Gefen Software',
        type: 'image/png',
      }
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Cardápio Digital | Gefen Software',
    description: 'Plataforma de cardápio digital para restaurantes e estabelecimentos',
    images: ['https://via.placeholder.com/1200x630/2563eb/ffffff?text=Cardápio+Digital'],
    creator: '@gefensoftware',
    site: '@gefensoftware',
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
    canonical: 'https://loja.gefensoftware.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* O tema escolhido pelo visitante, aplicado ANTES da primeira
            pintura. Sem isto a página abre clara (o React só decide depois de
            hidratar) e pisca branco na cara de quem escolheu escuro.
            Por isso é script inline no <head>, e não um efeito: qualquer
            coisa que dependa do React já chega tarde demais.
            O padrão do lojista (`theme.mode`) não cabe aqui — depende de
            uma chamada de rede —, e é por isso que a vitrine segura a tela
            com a LoadingScreen até a empresa chegar. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(CHAVE_TEMA)}));if(t==='dark'||t==='black')document.documentElement.classList.add('dark');if(t==='black')document.documentElement.classList.add('black')}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        
        {/* Meta tags específicas para WhatsApp */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cardápio Digital" />
        
        {/* Preload de imagens críticas */}
        <link rel="preload" as="image" href="https://via.placeholder.com/1200x630/2563eb/ffffff?text=Cardápio+Digital" />
        
        {/* DNS prefetch para domínios externos */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//via.placeholder.com" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
} 