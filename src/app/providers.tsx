'use client'

import { Provider } from 'jotai'
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { authAtom } from '@/store/auth'
import { userAtom } from '@/store/user'
import { cartAtom } from '@/store/cart'
import { api } from '@/api'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useAtom(authAtom)
  const [_, setUser] = useAtom(userAtom)
  const [__, setCart] = useAtom(cartAtom)

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      setUser(res.data)
      setCart(res.data.cart[0] || {
        id_cart: null,
        id_user: res.data.id_user,
        items: []
      })
    }).catch(() => {
      setAuth({
        access_token: null,
        isAuthenticated: false,
        id_enterprise: null
      })
    })
  }, [auth.isAuthenticated])

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