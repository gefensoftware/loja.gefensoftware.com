'use client'

import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface Base {
  icon: LucideIcon
  label: string
  descricao?: string
  /** Vermelho, para a ação destrutiva no fim da lista (sair). */
  perigo?: boolean
}

type Props = Base &
  (
    | { href: string; onClick?: never; ligado?: never }
    | {
        onClick: () => void
        href?: never
        /**
         * Presente = a linha é um interruptor, não uma ação de mão única.
         * Troca o chevron por uma chave e anuncia `role="switch"` — sem isso
         * um leitor de tela diria só "botão Aparência" e a pessoa não teria
         * como saber se está ligado.
         */
        ligado?: boolean
      }
  )

/**
 * Uma linha da lista de opções do perfil: ícone, rótulo e o chevron.
 *
 * Link ou botão, nunca os dois: quem navega vira `<Link>` de verdade (o
 * Next pré-busca a rota, o botão voltar do aparelho funciona, e a linha
 * abre em nova aba com o clique do meio); quem executa uma ação vira
 * `<button>`. Um `<div onClick>` cobriria os dois casos e não seria
 * alcançável pelo teclado nem anunciado corretamente por leitor de tela.
 *
 * O chevron só acompanha quem navega — numa ação ele prometeria uma tela
 * seguinte que não existe.
 */
export default function ProfileMenuItem({ icon: Icon, label, descricao, perigo, href, onClick, ligado }: Props) {
  const cor = perigo ? 'text-red-600 dark:text-red-400' : 'text-foreground'
  const corIcone = perigo ? 'text-red-500 dark:text-red-400' : 'text-primary'
  const ehInterruptor = ligado !== undefined

  const conteudo = (
    <>
      <span className={`shrink-0 ${corIcone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-left">
        <span className={`block text-sm font-medium ${cor}`}>{label}</span>
        {descricao && <span className="block text-xs text-muted-foreground">{descricao}</span>}
      </span>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
      {ehInterruptor && (
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            ligado ? 'bg-primary' : 'bg-muted'
          }`}
        >
          {/* Ligada, a chave é da cor primária da loja — que no tema escuro
              costuma ser clara. A bolinha usa então a cor que se lê SOBRE a
              primária: branca sobre primária branca ela sumia, e a chave
              ligada ficava idêntica à desligada. */}
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full shadow transition-all ${
              ligado ? 'left-[22px] bg-on-primary' : 'left-0.5 bg-white'
            }`}
          />
        </span>
      )}
    </>
  )

  const classe =
    'flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none'

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classe}
      role={ehInterruptor ? 'switch' : undefined}
      aria-checked={ehInterruptor ? ligado : undefined}
    >
      {conteudo}
    </button>
  )
}
