'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { useAtomValue } from 'jotai'
import { adsenseClient, marcarPreferenciaAnuncios } from '@/lib/anuncios'
import { escolhaAnunciosAtom } from '@/store/anuncios'

// Carrega a biblioteca do AdSense uma única vez por página. Vive no shell da
// loja (StoreLayoutClient) e não no layout raiz: as páginas legais e a home
// da plataforma não exibem anúncio e não têm por que baixar o script.
//
// Com os anúncios desligados não renderiza nada — nenhum pedido sai para o
// domínio do Google.
export default function ScriptAdsense() {
  const escolha = useAtomValue(escolhaAnunciosAtom)

  // A fila nasce marcada, antes de a biblioteca chegar. O `<EspacoAnuncio>`
  // remarca junto de cada `push`, e é ele quem de fato garante a ordem — isto
  // aqui cobre o resto: um pedido que não venha de um bloco nosso (anúncios
  // automáticos, por exemplo) encontraria a fila já configurada.
  useEffect(() => {
    if (!adsenseClient) return
    marcarPreferenciaAnuncios(escolha)
  }, [escolha])

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
