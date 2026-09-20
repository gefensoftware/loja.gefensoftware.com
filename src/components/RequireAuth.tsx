'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { authAtom } from '@/store/auth'
import AuthModal from '@/components/AuthModal'

interface Props {
  children: React.ReactNode
  /**
   * Chamado quando a sessão cai. Existe para o que é da tela e não deste
   * componente: limpar um formulário meio preenchido, por exemplo. Recebe o
   * mesmo disparo único que abre o modal, o que evita cada tela derivar por
   * conta própria "a sessão caiu" e as derivações divergirem com o tempo.
   */
  aoPerderSessao?: () => void
}

/**
 * Embrulha as telas de perfil, que só fazem sentido com sessão.
 *
 * Isto era um `useEffect` dentro do `Profile.tsx`, quando o perfil era uma
 * tela só. Com a lista e as três sub-rotas seriam quatro cópias — e quatro
 * cópias de um tratamento de sessão é como elas passam a divergir: uma
 * ganha correção, as outras não, e o comportamento depende de por qual
 * caminho a pessoa entrou.
 *
 * A dependência é `auth.isAuthenticated`, não a montagem: toda queda de
 * sessão passa por ela — a troca de senha (que revoga tudo no servidor), o
 * botão de sair, e o fim de sessão involuntário que o interceptor do axios
 * emite e o AuthProvider reflete no átomo. Com dependência vazia, a sessão
 * caía no meio da página e a tela seguia mostrando o formulário como se
 * nada tivesse acontecido.
 */
export default function RequireAuth({ children, aoPerderSessao }: Props) {
  const [auth] = useAtom(authAtom)
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setModalAberto(true)
      aoPerderSessao?.()
    } else {
      setModalAberto(false)
    }
    // `aoPerderSessao` fica fora das dependências de propósito: a tela
    // costuma passar uma função nova a cada render, e incluí-la faria o
    // efeito rodar em todo render — reabrindo o modal que a pessoa acabou
    // de fechar. O que deve disparar este efeito é a mudança de sessão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated])

  return (
    <>
      <AuthModal isOpen={modalAberto} onClose={() => setModalAberto(false)} />
      {children}
    </>
  )
}
