'use client'

import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  anunciosAtivos,
  marcarPreferenciaAnuncios,
  type EscolhaAnuncios,
} from '@/lib/anuncios'
import {
  escolhaAnunciosAtom,
  preferenciasAnunciosAbertasAtom,
} from '@/store/anuncios'

// O aviso de consentimento para anúncios personalizados.
//
// Não é enfeite de conformidade: a Política de Privacidade (seções "Para que
// usamos" e "Cookies e armazenamento local") diz que a base legal do anúncio
// personalizado é o consentimento (art. 7º, I da LGPD), pedido num aviso na
// primeira visita a uma loja. Enquanto a resposta não vem, valem só os
// anúncios não personalizados — quem garante isso é
// `marcarPreferenciaAnuncios` (lib/anuncios.ts), não este componente.
//
// Aparece na primeira visita e sempre que o link "Preferências de anúncios"
// do rodapé o reabre. Some por inteiro com os anúncios desligados.
//
// Fica acima da Navbar (`fixed bottom-0 z-50`): daí o `z-[60]` e o `pb-24`,
// que afasta o cartão da barra sem depender da altura exata dela. O invólucro
// é transparente e `pointer-events-none` para não capturar cliques na parte
// vazia — o aviso informa, não sequestra a vitrine.
export default function AvisoConsentimento() {
  const [escolha, setEscolha] = useAtom(escolhaAnunciosAtom)
  const [reaberto, setReaberto] = useAtom(preferenciasAnunciosAbertasAtom)

  const semResposta = escolha === null
  const visivel = anunciosAtivos && (semResposta || reaberto)

  // Esc fecha o aviso reaberto. Na primeira visita não fecha: sem resposta
  // não há o que preservar, e o Esc viraria uma saída silenciosa que não
  // registra escolha nenhuma.
  useEffect(() => {
    if (!visivel || semResposta) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setReaberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [visivel, semResposta, setReaberto])

  if (!visivel) return null

  function responder(nova: EscolhaAnuncios) {
    const mudou = !semResposta && nova !== escolha
    setEscolha(nova)
    marcarPreferenciaAnuncios(nova)
    setReaberto(false)

    // Os blocos desta página já foram pedidos com a configuração anterior, e
    // o AdSense não refaz um pedido feito. Recarregar é o que torna a mudança
    // real agora, e isso importa principalmente na retirada — a política
    // promete que ela vale "a qualquer momento", não na próxima navegação.
    //
    // Na primeira resposta não recarrega: até aqui o que apareceu foi anúncio
    // não personalizado, o lado conservador, e passar a personalizar só da
    // próxima tela em diante não contraria nada do que foi prometido.
    if (mudou) window.location.reload()
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-24 md:pb-28 print:hidden"
      role="dialog"
      aria-labelledby="aviso-anuncios-titulo"
      aria-describedby="aviso-anuncios-texto"
    >
      <div className="pointer-events-auto relative w-full max-w-2xl rounded-lg border bg-white dark:bg-neutral-900 p-4 shadow-lg md:p-5">
        {!semResposta && (
          <button
            type="button"
            onClick={() => setReaberto(false)}
            aria-label="Fechar sem mudar a escolha"
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-600 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <h2
          id="aviso-anuncios-titulo"
          className="pr-8 text-sm font-semibold text-gray-900 dark:text-neutral-100"
        >
          Anúncios nesta loja
        </h2>

        <p id="aviso-anuncios-texto" className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
          As páginas das lojas exibem anúncios fornecidos pelo Google. Com a sua
          permissão, eles podem ser escolhidos a partir da sua atividade em
          outros sites e aplicativos. Sem ela, você continua vendo anúncios —
          apenas não personalizados. Nenhum recurso da loja depende dessa
          escolha, e você pode mudá-la ou retirá-la quando quiser em{' '}
          <strong className="font-medium">Preferências de anúncios</strong>, no
          rodapé. Detalhes na{' '}
          <a
            href="/politica-de-privacidade"
            className="text-primary underline underline-offset-2"
          >
            Política de Privacidade
          </a>
          .
        </p>

        {!semResposta && (
          <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
            Sua escolha atual:{' '}
            <strong className="font-medium text-gray-700 dark:text-neutral-200">
              {escolha === 'aceito'
                ? 'anúncios personalizados permitidos'
                : 'apenas anúncios não personalizados'}
            </strong>
            .
          </p>
        )}

        {/* Os dois botões com o mesmo peso visual de propósito: a política diz
            que retirar é tão simples quanto dar, e um "recusar" escondido num
            link cinza faria dela letra morta. */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            onClick={() => responder('aceito')}
            className="flex-1"
          >
            Permitir anúncios personalizados
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => responder('recusado')}
            className="flex-1"
          >
            Apenas não personalizados
          </Button>
        </div>
      </div>
    </div>
  )
}
