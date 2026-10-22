import { Suspense } from 'react'
import ProfileHistorico from '@/screens/profile/ProfileHistorico'

// Suspense porque a tela lê ?aba= com useSearchParams, e o Next exige o
// limite para não renderizar a página inteira só no cliente.
export default function ProfileHistoricoPage() {
  return (
    <Suspense>
      <ProfileHistorico />
    </Suspense>
  )
}
