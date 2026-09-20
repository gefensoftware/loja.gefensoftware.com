'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { toast } from 'react-toastify'
import { api, apiError } from '@/api'
import { sair } from '@/api/auth'
import { authAtom } from '@/store/auth'
import { userAtom } from '@/store/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import ProfileSubPage from '@/components/profile/ProfileSubPage'

// PATCH /users/me/password (changePasswordRequest, em dto.go): a confirmação
// existe só no cliente, para pegar erro de digitação antes de gastar uma ida
// ao servidor — a API não recebe esse campo.
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter no mínimo 6 caracteres')
      .max(72, 'A nova senha deve ter no máximo 72 caracteres'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

const ProfilePassword = () => {
  const [, setAuth] = useAtom(authAtom)
  const [, setUser] = useAtom(userAtom)

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const onSubmit = async (data: PasswordFormData) => {
    try {
      // PATCH /users/me/password (user_handler.go) troca a senha e —
      // confirmado em UserService.ChangePassword, internal/core/service/
      // user_service.go — revoga todas as sessões do usuário no mesmo golpe.
      // O token de acesso atual, por ser um JWT sem consulta ao servidor a
      // cada requisição, continua "válido" até expirar sozinho; por isso a
      // sessão local é encerrada aqui mesmo, sem esperar o próximo 401.
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      toast.success(
        'Senha alterada com sucesso. Por segurança, todas as sessões foram encerradas — entre novamente.',
      )

      form.reset()

      // `sair` tenta revogar o refresh token guardado e depois limpa o
      // armazenamento local; a tentativa de revogação falha em silêncio
      // porque o token já foi derrubado no servidor pela troca de senha —
      // o que importa é a limpeza local, que nunca falha.
      await sair()
      // Este `setAuth` é o que faz o RequireAuth abrir o modal de entrada:
      // ele observa `auth.isAuthenticated`, então não há nada a abrir aqui.
      setAuth({ access_token: null, isAuthenticated: false, id_enterprise: null })
      setUser(null)
    } catch (erro) {
      const code = apiError(erro)
      if (code === 'INVALID_CREDENTIALS') {
        form.setError('currentPassword', { message: 'Senha atual incorreta' })
        toast.error('Senha atual incorreta.')
      } else if (code === 'VALIDATION_ERROR') {
        toast.error('Confira os dados informados.')
      } else {
        toast.error('Erro ao trocar a senha.')
      }
    }
  }

  const classeCampo =
    'border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm'

  const campos = [
    { nome: 'currentPassword' as const, rotulo: 'Senha atual' },
    { nome: 'newPassword' as const, rotulo: 'Nova senha' },
    { nome: 'confirmNewPassword' as const, rotulo: 'Confirmar nova senha' },
  ]

  return (
    <ProfileSubPage
      titulo="Alterar Senha"
      descricao="Ao trocar a senha, todas as sessões são encerradas e você precisará entrar novamente."
      aoPerderSessao={() => form.reset()}
    >
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {campos.map(({ nome, rotulo }) => (
              <div key={nome} className="space-y-3">
                <Label htmlFor={nome} className="text-sm font-medium text-gray-700">
                  {rotulo}
                </Label>
                <Input
                  id={nome}
                  type="password"
                  autoComplete={nome === 'currentPassword' ? 'current-password' : 'new-password'}
                  className={classeCampo}
                  {...form.register(nome)}
                />
                {form.formState.errors[nome] && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {form.formState.errors[nome]?.message}
                  </p>
                )}
              </div>
            ))}

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {form.formState.isSubmitting ? 'Trocando...' : 'Trocar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ProfileSubPage>
  )
}

export default ProfilePassword
