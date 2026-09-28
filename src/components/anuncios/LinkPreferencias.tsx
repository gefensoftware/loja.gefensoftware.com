'use client'

import { useSetAtom } from 'jotai'
import { anunciosAtivos } from '@/lib/anuncios'
import { preferenciasAnunciosAbertasAtom } from '@/store/anuncios'

// O link "Preferências de anúncios" do rodapé das lojas.
//
// O nome é citado ao pé da letra pela Política de Privacidade (duas vezes: em
// "Cookies e armazenamento local" e na revogação do consentimento, na seção de
// direitos). Renomeá-lo aqui deixa a política apontando para um link que não
// existe — mude os dois juntos ou nenhum.
//
// Vive num componente separado só para o `StoreFooter` seguir renderizando no
// servidor: o que precisa de cliente é este botão, não o rodapé inteiro.
export default function LinkPreferencias() {
  const abrir = useSetAtom(preferenciasAnunciosAbertasAtom)

  // Com os anúncios desligados não há escolha a preferir — e a política, nessa
  // versão, não menciona este link.
  if (!anunciosAtivos) return null

  return (
    <>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        onClick={() => abrir(true)}
        className="hover:text-primary hover:underline"
      >
        Preferências de anúncios
      </button>
    </>
  )
}
