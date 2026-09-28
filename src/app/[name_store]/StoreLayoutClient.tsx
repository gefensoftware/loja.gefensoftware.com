'use client'

import { useEffect } from 'react'
import { useEmpresa } from '@/store/enterprise'
import { useTema } from '@/store/tema'
import { contrastarCom } from '@/lib/tema'
import LoadingScreen from '@/components/LoadingScreen'
import Navbar from '@/components/Navbar'
import StoreFooter from '@/components/StoreFooter'
import ClientOnly from '@/components/ClientOnly'
import ScriptAdsense from '@/components/anuncios/ScriptAdsense'
import AvisoConsentimento from '@/components/anuncios/AvisoConsentimento'

export default function StoreLayoutClient({
  children,
  params,
}: {
  children: React.ReactNode
  params: { name_store: string }
}) {
  // A busca da empresa vive em `useEmpresa`, que lê o átomo e só vai à rede
  // quando ele está vazio. Antes, este layout e a tela que ele embrulha
  // buscavam a mesma rota no mesmo carregamento, cada um com o seu estado.
  const { empresa, carregando } = useEmpresa(params?.name_store)

  // As três paletas só viram cor de fato sob as classes `.dark` e `.black`
  // (globals.css), e quem as escreve é este gancho — num lugar só, para a
  // vitrine inteira. O `mode` do lojista entra como PADRÃO: vale enquanto
  // o visitante não escolheu no Perfil, e perde para ele quando escolheu.
  useTema(empresa?.theme?.mode)

  useEffect(() => {
    // Tema (enterprise_dto.go): { mode, light, dark, black }, cada paleta com
    // primary/secondary/background/text. Os nomes de variável CSS
    // (globals.css) continuam os mesmos de sempre.
    //
    // A paleta PRETA vem pronta da API: o lojista escolhe uma cor só e quem
    // monta as outras três é domain.BlackPalette, para a vitrine e o portal
    // pintarem o mesmo preto sem cada um refazer a conta.
    if (typeof window !== 'undefined' && empresa?.theme) {
      const root = document.documentElement
      const { light, dark, black } = empresa.theme
      root.style.setProperty('--light-primary-color', light.primary)
      root.style.setProperty('--light-secondary-color', light.secondary)
      root.style.setProperty('--light-background-color', light.background)
      root.style.setProperty('--light-text-color', light.text)
      root.style.setProperty('--dark-primary-color', dark.primary)
      root.style.setProperty('--dark-secondary-color', dark.secondary)
      root.style.setProperty('--dark-background-color', dark.background)
      root.style.setProperty('--dark-text-color', dark.text)
      // A API manda a primária, não o que se escreve em cima dela — e as duas
      // paletas do mesmo lojista costumam discordar nisso (primária escura no
      // claro, clara no escuro). Calcular aqui, junto com as variáveis, é o
      // único ponto em que as duas cores existem lado a lado.
      root.style.setProperty('--light-primary-contrast-color', contrastarCom(light.primary))
      root.style.setProperty('--dark-primary-contrast-color', contrastarCom(dark.primary))
      // `black` pode faltar: esta vitrine sobe antes ou depois da API, e
      // durante a janela entre os dois a resposta ainda é a antiga. Sem o
      // guarda, o acesso estouraria e levaria junto as duas paletas acima,
      // que já tinham sido aplicadas — a loja perderia as cores por causa de
      // um campo que ela nem usa até alguém escolher o preto. Faltando, ficam
      // valendo os padrões do globals.css.
      if (black) {
        root.style.setProperty('--black-primary-color', black.primary)
        root.style.setProperty('--black-secondary-color', black.secondary)
        root.style.setProperty('--black-background-color', black.background)
        root.style.setProperty('--black-text-color', black.text)
        root.style.setProperty('--black-primary-contrast-color', contrastarCom(black.primary))
      }
    }
  }, [empresa?.theme])

  return (
    <>
    <ScriptAdsense />
    <ClientOnly fallback={<LoadingScreen />}>
      {carregando ? (
        <LoadingScreen enterpriseName={empresa?.name} />
      ) : (
        <>
          {children}
          <StoreFooter />
          <Navbar />
          {/* Depois da Navbar: o aviso flutua sobre ela (z-[60]), e a ordem no
              DOM acompanha a ordem na tela para quem navega por teclado. */}
          <AvisoConsentimento />
        </>
      )}
    </ClientOnly>
    </>
  )
}
