'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { toast } from 'react-toastify'
import { User, Phone, Mail } from 'lucide-react'
import { api, apiError, apiErrorDetails } from '@/api'
import { userAtom, fromMeResponse } from '@/store/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import ProfileSubPage from '@/components/profile/ProfileSubPage'

// A máscara "(00) 00000-0000" é só uma ajuda visual enquanto o cliente
// digita (formatPhoneNumber, abaixo) — o telefone gravado no cadastro pode
// não estar nesse formato (o seed de demonstração grava dígitos puros), e a
// API só exige entre 8 e 20 caracteres (updateMeRequest, dto.go). Validar
// pela máscara travava a edição de qualquer conta com telefone não
// mascarado, mesmo sem tocar no campo.
function telefoneValido(v: string): boolean {
  const digitos = v.replace(/\D/g, '')
  return digitos.length >= 8 && digitos.length <= 20
}

// PATCH /users/me (updateMeRequest, em dto.go) aceita nome, telefone e
// documento — não existe edição de e-mail nem de papel nesse contrato, e a
// foto tem rota própria. O e-mail continua exibido, só que travado.
const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(120, 'O nome deve ter no máximo 120 caracteres'),
  phone: z.string().refine(telefoneValido, 'Telefone deve ter entre 8 e 20 dígitos'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const ProfileData = () => {
  const [user, setUser] = useAtom(userAtom)

  // `values` (não `defaultValues`): react-hook-form só copia `defaultValues`
  // uma vez, na montagem. Esta tela pode ficar montada e deslogada quando a
  // sessão cai (o RequireAuth abre o modal de entrada por cima dela) — nesse
  // instante `user` é nulo. Quando o cliente entra de novo sem a página
  // remontar, `user` passa a ter valor, mas com `defaultValues` o formulário
  // nunca ressincroniza: nome e telefone ficam em branco. `values`
  // ressincroniza sempre que a referência muda, cobrindo esse remonte lógico
  // sem remonte de componente.
  //
  // `resetOptions: { keepDirtyValues: true }` (confirmado no tipo instalado,
  // react-hook-form 7.56.3, `node_modules/react-hook-form/dist/types/form.d.ts`
  // — `KeepStateOptions.keepDirtyValues`): sem isso, toda ressincronização
  // de `values` reinicializa o formulário por inteiro, inclusive os campos
  // que o cliente já alterou e ainda não salvou. Como os campos de nome e
  // telefone não ficam desabilitados durante o envio (só o botão fica), uma
  // edição feita entre o clique em "Salvar Alterações" e a resposta do
  // servidor seria descartada em silêncio quando `setUser` (`onSubmit`,
  // abaixo) trocasse a referência de `user` — sem erro, sem aviso.
  // `keepDirtyValues` faz a ressincronização pular os campos "sujos",
  // preservando o que ainda não foi salvo.
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
    resetOptions: { keepDirtyValues: true },
  })

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // A API mede o telefone em caracteres (updateMeRequest, dto.go:
      // `min=8,max=20`); o cliente mede em dígitos (telefoneValido, acima).
      // Um número muito formatado (com DDI, espaços, parênteses) pode ter
      // poucos dígitos e ainda assim passar de 20 caracteres — normalizar
      // para dígitos puros antes de enviar faz as duas contagens
      // coincidirem sempre.
      const payload = { name: data.name, phone: data.phone.replace(/\D/g, '') }
      const { data: updated } = await api.patch('/users/me', payload)
      setUser(fromMeResponse(updated))
      toast.success('Perfil atualizado com sucesso!')
    } catch (erro) {
      const code = apiError(erro)
      if (code === 'VALIDATION_ERROR') {
        const detalhes = apiErrorDetails(erro)
        detalhes.forEach((d) => {
          if (d.field === 'name' || d.field === 'phone') {
            form.setError(d.field, { message: 'Valor inválido' })
          }
        })
        toast.error('Confira os dados informados.')
      } else {
        toast.error('Erro ao atualizar perfil.')
      }
    }
  }

  // Uma queda de sessão deliberada (ou reconciliada) não é resposta de envio
  // deste formulário: `form.reset()` sem argumentos (confirmado em
  // `node_modules/react-hook-form/dist/index.esm.mjs`, função `_reset`) limpa
  // `dirtyFields`/`isDirty` e não passa pelo ramo de `keepDirtyValues`, então
  // o campo deixa de estar "sujo" e volta a sincronizar com `user` na próxima
  // vez que `values` mudar. Sem isso, um campo editado e não salvo antes da
  // sessão cair ficava marcado como alterado para sempre, e a preservação
  // acima passava a proteger esse valor obsoleto por um ciclo inteiro de
  // sair-e-entrar em vez de só durante o envio em voo.
  const aoPerderSessao = () => form.reset()

  const classeCampo =
    'border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <ProfileSubPage
      titulo="Dados Pessoais"
      descricao="Atualize suas informações de contato"
      aoPerderSessao={aoPerderSessao}
    >
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-primary" />
                Nome Completo
              </Label>
              <Input
                id="name"
                placeholder="Digite seu nome completo"
                disabled={form.formState.isSubmitting}
                className={classeCampo}
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-primary" />
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                disabled={form.formState.isSubmitting}
                className={classeCampo}
                {...form.register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhoneNumber(e.target.value)
                  },
                })}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                className="border-2 border-gray-200 rounded-xl h-12 px-4 bg-gray-100/50 text-gray-500 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                Email não pode ser alterado
              </p>
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ProfileSubPage>
  )
}

export default ProfileData
