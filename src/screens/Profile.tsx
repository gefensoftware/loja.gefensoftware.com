'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Pencil, User, KeyRound, Camera, FileText, Calendar, Wrench, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import { sair } from '@/api/auth'
import { userAtom } from '@/store/user'
import { authAtom } from '@/store/auth'
import { useEmpresa } from '@/store/enterprise'
import { capacidadesDe } from '@/lib/vocabulario'
import { Card } from '@/components/ui/card'
import RequireAuth from '@/components/RequireAuth'
import UserAvatar from '@/components/profile/UserAvatar'
import ProfileMenuItem from '@/components/profile/ProfileMenuItem'

/**
 * A lista de opções do perfil.
 *
 * Esta tela era o perfil inteiro — cabeçalho, formulário de dados, formulário
 * de senha e o botão de sair, tudo empilhado numa coluna. Cada parte agora
 * tem rota própria (screens/profile/), e o que sobra aqui é só o caminho
 * para elas.
 */
const Profile = () => {
  const [user] = useAtom(userAtom)
  const [auth, setAuth] = useAtom(authAtom)
  const params = useParams()
  const loja = (params?.name_store as string) ?? ''
  const { empresa } = useEmpresa(loja)
  const caps = capacidadesDe(empresa?.capabilities)
  const [saindo, setSaindo] = useState(false)

  const aoSair = async () => {
    setSaindo(true)
    try {
      // `sair` revoga o refresh token no servidor e limpa o par guardado;
      // sem ela, a pessoa volta logada ao recarregar a página.
      await sair()
      setAuth({ access_token: null, isAuthenticated: false, id_enterprise: null })
      if (typeof window !== 'undefined') window.location.reload()
    } catch {
      // `sair` já engole a falha de revogação e garante a limpeza local; se
      // ainda assim algo estourou, dizer que saiu seria mentira.
      setSaindo(false)
      toast.error('Não foi possível sair. Tente novamente.')
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-white mb-20">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Cabeçalho: foto, nome e e-mail */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              <UserAvatar user={user} />
              {/* O lápis leva à mesma tela que o item "Foto de Perfil" da
                  lista: é o gesto que a pessoa tenta primeiro, e não custa
                  nada atendê-lo além de um link. */}
              <Link
                href={`/${loja}/profile/foto`}
                aria-label="Editar foto de perfil"
                className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-white shadow-lg transition-transform hover:scale-105"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">{user?.name}</h1>
            {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
          </div>

          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="divide-y divide-gray-100">
              <ProfileMenuItem
                icon={User}
                label="Dados Pessoais"
                descricao="Nome, telefone e e-mail"
                href={`/${loja}/profile/dados`}
              />
              <ProfileMenuItem
                icon={KeyRound}
                label="Alterar Senha"
                descricao="Troque a senha da sua conta"
                href={`/${loja}/profile/senha`}
              />
              <ProfileMenuItem
                icon={Camera}
                label="Foto de Perfil"
                descricao="Escolha ou remova sua foto"
                href={`/${loja}/profile/foto`}
              />

              {/* Atalhos para o histórico do cliente. Aparecem pela mesma
                  regra da barra inferior: só onde a loja tem a capacidade
                  ligada, para não levar a uma tela que nunca terá nada. */}
              {caps.budgets && (
                <ProfileMenuItem
                  icon={FileText}
                  label="Orçamentos"
                  descricao="Seus pedidos de orçamento"
                  href={`/${loja}/orcamentos`}
                />
              )}
              {caps.appointments && (
                <ProfileMenuItem
                  icon={Calendar}
                  label="Agenda"
                  descricao="Seus agendamentos"
                  href={`/${loja}/agendamentos`}
                />
              )}
              {caps.workOrders && (
                <ProfileMenuItem
                  icon={Wrench}
                  label="Serviços"
                  descricao="Acompanhe suas ordens de serviço"
                  href={`/${loja}/ordens`}
                />
              )}

              {auth.isAuthenticated && (
                <ProfileMenuItem
                  icon={LogOut}
                  label={saindo ? 'Saindo...' : 'Sair'}
                  perigo
                  onClick={aoSair}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </RequireAuth>
  )
}

export default Profile
