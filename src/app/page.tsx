import type { Metadata } from 'next'
import Home from '@/screens/Home'
import { EMPRESA } from '@/content/legal/empresa'

// A raiz do domínio. Rota estática, portanto acima de `/[name_store]`: quem
// abre `loja.gefensoftware.com` sem slug chega aqui, e não na vitrine de uma
// loja sem nome.
//
// Os metadados do layout raiz valem para todo o domínio e descrevem a
// plataforma; o que esta página precisa dizer a mais é o canônico dela.
export const metadata: Metadata = {
  description:
    'Plataforma de catálogo digital da Gefen Software: restaurantes, lojas e ' +
    'prestadores de serviço publicam seu catálogo, e o cliente consulta, pede, ' +
    'agenda e solicita orçamento pelo celular.',
  alternates: { canonical: EMPRESA.plataforma },
  robots: { index: true, follow: true },
}

export default function HomePage() {
  return <Home />
}
