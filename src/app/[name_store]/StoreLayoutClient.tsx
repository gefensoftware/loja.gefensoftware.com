'use client'

import { useEffect } from 'react'
import { useEmpresa } from '@/store/enterprise'
import LoadingScreen from '@/components/LoadingScreen'
import Navbar from '@/components/Navbar'
import ClientOnly from '@/components/ClientOnly'

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

  useEffect(() => {
    // Tema novo (enterprise_dto.go): { isDark, light: Palette, dark: Palette
    // }, cada paleta com primary/secondary/background/text. Os nomes de
    // variável CSS (globals.css) continuam os mesmos de sempre.
    if (typeof window !== 'undefined' && empresa?.theme) {
      const root = document.documentElement
      const { light, dark, isDark } = empresa.theme
      root.style.setProperty('--light-primary-color', light.primary)
      root.style.setProperty('--light-secondary-color', light.secondary)
      root.style.setProperty('--light-background-color', light.background)
      root.style.setProperty('--light-text-color', light.text)
      root.style.setProperty('--dark-primary-color', dark.primary)
      root.style.setProperty('--dark-secondary-color', dark.secondary)
      root.style.setProperty('--dark-background-color', dark.background)
      root.style.setProperty('--dark-text-color', dark.text)

      // As duas paletas só viram cor de fato sob a classe `.dark`
      // (globals.css) — sem isto, `isDark` chega da API e nunca é
      // aplicado, e a loja fica presa na paleta clara mesmo quando o
      // lojista declarou preferência por escuro.
      root.classList.toggle('dark', isDark)
    }
  }, [empresa?.theme])

  return (
    <ClientOnly fallback={<LoadingScreen />}>
      {carregando ? (
        <LoadingScreen enterpriseName={empresa?.name} />
      ) : (
        <>
          {children}
          <Navbar />
        </>
      )}
    </ClientOnly>
  )
}
