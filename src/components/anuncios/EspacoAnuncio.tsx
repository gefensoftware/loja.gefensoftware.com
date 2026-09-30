'use client'

import { useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import {
  adsenseClient,
  marcarPreferenciaAnuncios,
  slotDaPosicao,
  type PosicaoAnuncio,
} from '@/lib/anuncios'
import { escolhaAnunciosAtom, lojaSemAnunciosAtom } from '@/store/anuncios'

interface EspacoAnuncioProps {
  posicao: PosicaoAnuncio
  className?: string
}

// Um bloco de anúncio responsivo do AdSense.
//
// Some por inteiro (null, sem espaço reservado) quando os anúncios estão
// desligados, quando o plano da loja inclui vitrine sem publicidade, ou
// quando a posição não tem slot configurado: a vitrine não pode ganhar um
// buraco em branco por falta de configuração.
//
// O `min-h` reserva a altura antes de o anúncio chegar, para o conteúdo
// abaixo não pular quando ele carrega (CLS). Essa reserva vale enquanto a
// resposta do Google não veio; se ela vier vazia, o espaço colapsa — ver
// `preenchimento` abaixo.
export default function EspacoAnuncio({ posicao, className = '' }: EspacoAnuncioProps) {
  const slot = slotDaPosicao(posicao)
  const escolha = useAtomValue(escolhaAnunciosAtom)
  const semAnuncios = useAtomValue(lojaSemAnunciosAtom)
  // O StrictMode do desenvolvimento monta o efeito duas vezes; um segundo
  // `push` para o mesmo <ins> faz o AdSense lançar "already have ads".
  const enviado = useRef(false)

  const insRef = useRef<HTMLModElement>(null)
  // 'esperando' até o Google responder. A reserva de altura existe só nesse
  // intervalo: é o que evita o conteúdo pular, e é o único momento em que um
  // espaço vazio se justifica.
  const [preenchimento, setPreenchimento] = useState<'esperando' | 'sim' | 'nao'>(
    'esperando',
  )

  useEffect(() => {
    if (!slot || semAnuncios || enviado.current) return
    enviado.current = true
    try {
      // A marcação vem imediatamente antes do `push`, no mesmo bloco
      // síncrono: é a ordem que garante que o Google leia a escolha ao
      // processar este pedido. Mudança posterior não reaproveita o bloco — o
      // aviso recarrega a página (AvisoConsentimento.tsx).
      marcarPreferenciaAnuncios(escolha)
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (erro) {
      // Bloqueador de anúncio ou script ainda indisponível: o anúncio não
      // aparece, a vitrine segue normal. Não é erro para o cliente ver.
      console.warn('[anuncios] não foi possível preencher o espaço', posicao, erro)
    }
  }, [slot, posicao, escolha, semAnuncios])

  // O AdSense escreve `data-ad-status` no <ins> quando a resposta chega:
  // "filled" com anúncio, "unfilled" sem. Sem anúncio o bloco precisa sumir —
  // caso contrário sobra um vão em branco com "PUBLICIDADE" em cima dele, que
  // é o que a loja mostra enquanto o site está em análise no AdSense e, depois
  // dela, sempre que não houver anúncio para a página. Colapsar o espaço não
  // preenchido é o caminho que o próprio Google documenta.
  useEffect(() => {
    const ins = insRef.current
    if (!ins) return

    function conferir() {
      const status = ins?.getAttribute('data-ad-status')
      if (status === 'unfilled') setPreenchimento('nao')
      else if (status === 'filled') setPreenchimento('sim')
    }

    // O atributo pode já estar lá: com o script em cache a resposta às vezes
    // chega antes de o observador ser ligado.
    conferir()

    const observador = new MutationObserver(conferir)
    observador.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })
    return () => observador.disconnect()
  }, [slot])

  if (!slot || !adsenseClient || semAnuncios) return null

  // `hidden` em vez de desmontar: tirar o <ins> do DOM deixaria o AdSense com
  // uma referência a um elemento que não existe mais, e um `push` futuro para
  // o mesmo bloco passaria a dar erro.
  return (
    <aside
      aria-label="Publicidade"
      className={`w-full ${preenchimento === 'nao' ? 'hidden' : className}`}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 text-center">
        Publicidade
      </p>
      <ins
        ref={insRef}
        className={`adsbygoogle block w-full ${
          preenchimento === 'esperando' ? 'min-h-[100px]' : ''
        }`}
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
