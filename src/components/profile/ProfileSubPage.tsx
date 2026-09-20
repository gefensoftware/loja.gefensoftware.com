'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import RequireAuth from '@/components/RequireAuth'

interface Props {
  titulo: string
  descricao?: string
  children: React.ReactNode
  aoPerderSessao?: () => void
}

/**
 * O invólucro das três telas sob /profile: voltar, título e a guarda de
 * sessão. Sem ele, cada uma repetiria o mesmo cabeçalho e o mesmo
 * RequireAuth — e é repetindo que elas passariam a divergir.
 *
 * O "voltar" é um link para a lista, não `router.back()`: quem chega por um
 * endereço colado ou por uma notificação não tem para onde voltar, e a seta
 * sairia da loja. Apontando para a lista, ela sempre faz o que desenha.
 */
export default function ProfileSubPage({ titulo, descricao, children, aoPerderSessao }: Props) {
  const params = useParams()
  const loja = (params?.name_store as string) ?? ''

  return (
    <RequireAuth aoPerderSessao={aoPerderSessao}>
      <div className="min-h-screen bg-white mb-20">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href={`/${loja}/profile`}
              aria-label="Voltar para o perfil"
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">{titulo}</h1>
              {descricao && <p className="text-sm text-gray-600">{descricao}</p>}
            </div>
          </div>
          {children}
        </div>
      </div>
    </RequireAuth>
  )
}
