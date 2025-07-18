'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { enterprisesAtom } from '@/store/atoms/enterprises'
import { api } from '@/api'
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
  const [isLoading, setIsLoading] = useState(true)
  const [enterprise, setEnterprise] = useAtom(enterprisesAtom)

  const getEnterprise = async () => {
    try {
      const { data } = await api.get(`/enterprise/${params?.name_store}`)
      setEnterprise(data)
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    getEnterprise()
  }, [params?.name_store])

  useEffect(() => {
    // Só aplicar o tema se estivermos no cliente
    if (typeof window !== 'undefined' && enterprise?.theme) {
      const root = document.documentElement
      root.style.setProperty('--light-primary-color', enterprise.theme.light_primary_color)
      root.style.setProperty('--light-secondary-color', enterprise.theme.light_secondary_color)
      root.style.setProperty('--light-background-color', enterprise.theme.light_background_color)
      root.style.setProperty('--light-text-color', enterprise.theme.light_text_color)
    }
  }, [enterprise?.theme])

  return (
    <ClientOnly fallback={<LoadingScreen />}>
      {isLoading ? (
        <LoadingScreen enterpriseName={enterprise?.name} />
      ) : (
        <>
          {children}
          <Navbar />
        </>
      )}
    </ClientOnly>
  )
} 