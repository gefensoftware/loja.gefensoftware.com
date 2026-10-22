'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileSubPage from '@/components/profile/ProfileSubPage'
import ListaDeOrcamentos from '@/components/historico/ListaDeOrcamentos'
import ListaDeAgendamentos from '@/components/historico/ListaDeAgendamentos'

// O histórico do cliente em TODAS as lojas, em duas abas.
//
// As telas de orçamentos e de agenda da vitrine mostram só o que foi feito
// naquela loja; este é o único lugar com tudo junto, e por isso fica no
// perfil, que é da pessoa e não da loja. Cada cartão diz de que loja é.
//
// As duas abas aparecem sempre, mesmo que a loja aberta agora não tenha
// orçamento ou agenda ligados: o histórico é de outras lojas também.
//
// A aba vai no endereço (?aba=) para o link "ver os de todas as lojas" das
// telas da vitrine abrir direto na aba certa.

type Aba = 'orcamentos' | 'agenda'

export default function ProfileHistorico() {
  const params = useParams()
  const loja = (params?.name_store as string) ?? ''
  const router = useRouter()
  const busca = useSearchParams()
  const aba: Aba = busca?.get('aba') === 'agenda' ? 'agenda' : 'orcamentos'

  const trocar = (nova: string) => {
    router.replace(`/${loja}/profile/historico?aba=${nova}`, { scroll: false })
  }

  return (
    <ProfileSubPage titulo="Meu histórico" descricao="Orçamentos e agendamentos em todas as lojas">
      <Tabs value={aba} onValueChange={trocar}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        <TabsContent value="orcamentos">
          <ListaDeOrcamentos />
        </TabsContent>
        <TabsContent value="agenda">
          <ListaDeAgendamentos />
        </TabsContent>
      </Tabs>
    </ProfileSubPage>
  )
}
