'use client'

import { Moon, Sun } from 'lucide-react'
import { useTema } from '@/store/tema'
import type { Tema } from '@/lib/tema'

/**
 * O interruptor de tema do cabeçalho da loja.
 *
 * Duas posições, no lugar onde o visitante anônimo consegue alcançá-las: o
 * Perfil está atrás de `RequireAuth`, e quem chega por um link de produto e
 * nunca cria conta não tem como abrir aquela lista.
 *
 * As três opções do Perfil não cabem num botão de um ícone só. O que este
 * botão oferece é claro ↔ o escuro DESTA loja, que é o preto quando foi o
 * preto que ela escolheu — ver useTema.
 *
 * O ícone mostra para ONDE o clique leva (sol no escuro, lua no claro), que é
 * o que um botão de um símbolo só consegue dizer. O estado quem conta é o
 * `aria-checked` — sem ele, um leitor de tela anunciaria apenas "botão" e a
 * pessoa teria de clicar para descobrir onde está.
 *
 * @param padraoDaLoja `enterprise.theme.mode`. Mesmo valor que o layout da
 *   loja passa ao gancho: os dois precisam concordar, senão o botão mostraria
 *   um sol numa página clara.
 */
export function BotaoTema({
  padraoDaLoja,
  className = '',
}: {
  padraoDaLoja?: Tema
  className?: string
}) {
  const { escuro, alternar } = useTema(padraoDaLoja)
  const Icone = escuro ? Sun : Moon

  return (
    <button
      type="button"
      onClick={alternar}
      role="switch"
      aria-checked={escuro}
      aria-label="Tema escuro"
      title={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full md:h-9 md:w-9 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${className}`}
    >
      <Icone className="h-5 w-5" />
    </button>
  )
}

export default BotaoTema
