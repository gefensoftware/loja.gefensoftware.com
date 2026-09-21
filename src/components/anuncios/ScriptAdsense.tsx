'use client'

import Script from 'next/script'
import { adsenseClient } from '@/lib/anuncios'

// Carrega a biblioteca do AdSense uma única vez por página. Vive no shell da
// loja (StoreLayoutClient) e não no layout raiz: as páginas legais e a home
// da plataforma não exibem anúncio e não têm por que baixar o script.
//
// Com os anúncios desligados não renderiza nada — nenhum pedido sai para o
// domínio do Google.
export default function ScriptAdsense() {
  if (!adsenseClient) return null

  return (
    <Script
      id="adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
