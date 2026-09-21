'use client'

import { useEffect, useRef } from 'react'
import { adsenseClient, slotDaPosicao, type PosicaoAnuncio } from '@/lib/anuncios'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface EspacoAnuncioProps {
  posicao: PosicaoAnuncio
  className?: string
}

// Um bloco de anúncio responsivo do AdSense.
//
// Some por inteiro (null, sem espaço reservado) quando os anúncios estão
// desligados ou a posição não tem slot configurado: a vitrine não pode
// ganhar um buraco em branco por falta de configuração.
//
// O `min-h` reserva a altura antes de o anúncio chegar, para o conteúdo
// abaixo não pular quando ele carrega (CLS).
export default function EspacoAnuncio({ posicao, className = '' }: EspacoAnuncioProps) {
  const slot = slotDaPosicao(posicao)
  // O StrictMode do desenvolvimento monta o efeito duas vezes; um segundo
  // `push` para o mesmo <ins> faz o AdSense lançar "already have ads".
  const enviado = useRef(false)

  useEffect(() => {
    if (!slot || enviado.current) return
    enviado.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (erro) {
      // Bloqueador de anúncio ou script ainda indisponível: o anúncio não
      // aparece, a vitrine segue normal. Não é erro para o cliente ver.
      console.warn('[anuncios] não foi possível preencher o espaço', posicao, erro)
    }
  }, [slot, posicao])

  if (!slot || !adsenseClient) return null

  return (
    <aside aria-label="Publicidade" className={`w-full ${className}`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1 text-center">
        Publicidade
      </p>
      <ins
        className="adsbygoogle block min-h-[100px] w-full"
        data-ad-client={adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
