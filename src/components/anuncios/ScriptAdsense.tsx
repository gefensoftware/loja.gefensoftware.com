'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { adsenseClient, marcarPreferenciaAnuncios, rotaAceitaAnuncio } from '@/lib/anuncios'
import { escolhaAnunciosAtom, lojaSemAnunciosAtom } from '@/store/anuncios'

// Carrega a biblioteca do AdSense uma única vez por página. Vive no shell da
// loja (StoreLayoutClient) e não no layout raiz: as páginas legais e a home
// da plataforma não exibem anúncio e não têm por que baixar o script.
//
// Com os anúncios desligados não renderiza nada — nenhum pedido sai para o
// domínio do Google. "Desligados" são dois desligamentos independentes: a
// plataforma inteira (sem NEXT_PUBLIC_ADSENSE_CLIENT) e esta loja, quando o
// plano dela inclui vitrine sem publicidade.
export default function ScriptAdsense() {
  const escolha = useAtomValue(escolhaAnunciosAtom)
  const semAnuncios = useAtomValue(lojaSemAnunciosAtom)
  // Este componente vive no shell da loja, que embrulha TODAS as rotas de
  // `/{loja}` — inclusive carrinho, perfil e pedidos. Só a vitrine e a página
  // de produto podem servir anúncio, e carregar a biblioteca nas outras já é
  // o bastante para o Google pôr anúncio automático nelas.
  const anuncioPermitido = rotaAceitaAnuncio(usePathname() ?? '')

  // A fila nasce marcada, antes de a biblioteca chegar. O `<EspacoAnuncio>`
  // remarca junto de cada `push`, e é ele quem de fato garante a ordem — isto
  // aqui cobre o resto: um pedido que não venha de um bloco nosso (anúncios
  // automáticos, por exemplo) encontraria a fila já configurada.
  useEffect(() => {
    if (!adsenseClient || semAnuncios || !anuncioPermitido) return
    marcarPreferenciaAnuncios(escolha)
  }, [escolha, semAnuncios, anuncioPermitido])

  if (!adsenseClient || semAnuncios || !anuncioPermitido) return null

  return (
    <Script
      id="adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
