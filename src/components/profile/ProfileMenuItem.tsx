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
    | { href: string; onClick?: never }
    | { onClick: () => void; href?: never }
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
export default function ProfileMenuItem({ icon: Icon, label, descricao, perigo, href, onClick }: Props) {
  const cor = perigo ? 'text-red-600' : 'text-gray-800'
  const corIcone = perigo ? 'text-red-500' : 'text-primary'

  const conteudo = (
    <>
      <span className={`shrink-0 ${corIcone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-left">
        <span className={`block text-sm font-medium ${cor}`}>{label}</span>
        {descricao && <span className="block text-xs text-gray-500">{descricao}</span>}
      </span>
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />}
    </>
  )

  const classe =
    'flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none'

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  )
}
