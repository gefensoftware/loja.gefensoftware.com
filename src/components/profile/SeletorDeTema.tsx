'use client'

import { Moon, Sun, Circle } from 'lucide-react'
import type { Tema } from '@/lib/tema'

const OPCOES: { valor: Tema; rotulo: string; Icone: typeof Sun }[] = [
  { valor: 'light', rotulo: 'Claro', Icone: Sun },
  { valor: 'dark', rotulo: 'Escuro', Icone: Moon },
  { valor: 'black', rotulo: 'Preto', Icone: Circle },
]

/**
 * A escolha de tema do Perfil: três opções, uma linha.
 *
 * Substitui o interruptor "Tema escuro" que havia aqui. Um interruptor tem
 * duas posições e agora são três temas — e mesmo que o preto coubesse num
 * segundo clique, escondê-lo atrás de uma chave que diz "escuro" seria não
 * contar que ele existe.
 *
 * `radiogroup` e não uma fila de botões: é uma escolha entre opções que se
 * excluem, e é assim que um leitor de tela anuncia "3 de 3, Preto,
 * selecionado" em vez de três botões soltos.
 */
export default function SeletorDeTema({
  tema,
  aoEscolher,
}: {
  tema: Tema
  aoEscolher: (tema: Tema) => void
}) {
  return (
    <div className="px-4 py-4">
      <span className="block text-sm font-medium text-gray-800 dark:text-neutral-100">Aparência</span>
      <span className="mt-0.5 block text-xs text-gray-500 dark:text-neutral-400">
        Vale para esta loja neste aparelho
      </span>
      <div role="radiogroup" aria-label="Aparência" className="mt-3 flex gap-2">
        {OPCOES.map(({ valor, rotulo, Icone }) => {
          const ativo = tema === valor
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => aoEscolher(valor)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                ativo
                  ? // A borda e a letra na cor da loja: é a mesma primária que
                    // pinta o botão de comprar, e é o que diz "escolhido" sem
                    // precisar de um preenchimento que competiria com ela.
                    'border-primary text-primary'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <Icone className={`h-4 w-4 ${valor === 'black' && ativo ? 'fill-current' : ''}`} aria-hidden="true" />
              {rotulo}
            </button>
          )
        })}
      </div>
    </div>
  )
}
