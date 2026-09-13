'use client'

import { Provider } from 'jotai'
import { useCallback, useEffect } from 'react'
import { useAtom } from 'jotai'
import { authAtom } from '@/store/auth'
import { userAtom, fromMeResponse } from '@/store/user'
import { api, apiError, getAuth, aoFimDeSessao } from '@/api'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useAtom(authAtom)
  const [, setUser] = useAtom(userAtom)

  // O par de tokens é a verdade; o átomo é só o espelho para a UI. Quando os
  // dois divergem, quem cede é o átomo — **nas duas direções**. Só a de
  // deslogar existia, e o estado persistido ficava preso em "deslogado"
  // mesmo com token válido: nada o restaurava, nem recarregando.
  const marcarDeslogado = useCallback(() => {
    setAuth({
      access_token: null,
      isAuthenticated: false,
      id_enterprise: null
    })
    setUser(null)
  }, [setAuth, setUser])

  // A direção que faltava. Devolve o átomo inalterado quando já está certo,
  // para não disparar um render (e uma reexecução do efeito abaixo) a cada
  // identificação bem sucedida.
  const marcarLogado = useCallback((accessToken: string) => {
    setAuth((atual) =>
      atual.isAuthenticated && atual.access_token === accessToken
        ? atual
        : { ...atual, access_token: accessToken, isAuthenticated: true },
    )
  }, [setAuth])

  // Fim de sessão involuntário: a renovação falhou, o interceptor já apagou o
  // par de tokens e emitiu o sinal. Sem ouvir isso, a interface continuaria
  // mostrando o menu do usuário enquanto toda requisição sai anônima.
  useEffect(() => aoFimDeSessao(marcarDeslogado), [marcarDeslogado])

  useEffect(() => {
    // Sem token guardado, a verdade é "deslogado": reconcilia o átomo em vez
    // de deixar o estado persistido mentir. É o caminho de quem teve o
    // armazenamento limpo pelo interceptor numa sessão anterior — sem esta
    // reconciliação, o cabeçalho volta mostrando o menu do usuário.
    const guardado = getAuth()
    if (!guardado) {
      if (auth.isAuthenticated) marcarDeslogado()
      return
    }

    api.get('/auth/me').then(({ data }) => {
      // Token guardado + identificação bem sucedida = autenticado. Sem esta
      // linha o átomo podia ficar preso em falso para sempre: o carrinho do
      // servidor sumia da tela, a limpeza de saída rodava, e toda alteração
      // seguinte ia parar no carrinho anônimo local — que no login seguinte
      // entra pela mesclagem, que SOMA. Perder o carrinho de vista era o
      // sintoma; quantidade errada depois era o estrago.
      marcarLogado(guardado.accessToken)
      setUser(fromMeResponse(data))
    }).catch((e) => {
      // Só recusa de autenticação encerra a sessão.
      //
      // O discriminador é o código do envelope, não o status: o middleware de
      // autenticação da API emite SEMPRE `UNAUTHORIZED`
      // (internal/adapters/in/http/middleware.go), nunca outro código. A
      // segunda condição cobre o caso em que o interceptor já concluiu que a
      // sessão morreu e apagou o par de tokens.
      //
      // Queda de rede, API reiniciando e 5xx não dizem nada sobre a sessão e
      // não podem tocá-la: antes, qualquer um deles deslogava em definitivo,
      // gravando num átomo persistido que nada restaurava.
      if (apiError(e) === 'UNAUTHORIZED' || !getAuth()) marcarDeslogado()
    })
  }, [auth.isAuthenticated, marcarDeslogado, marcarLogado, setUser])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Provider>
  )
}
