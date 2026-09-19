'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, apiError, apiErrorDetails } from '@/api';
import { sair } from '@/api/auth';
import { useAtom } from 'jotai';
import { userAtom, fromMeResponse } from '@/store/user';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Mail, Settings, KeyRound } from 'lucide-react';
import { authAtom } from '@/store/auth';
import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';

// A máscara "(00) 00000-0000" é só uma ajuda visual enquanto o cliente
// digita (formatPhoneNumber, abaixo) — o telefone gravado no cadastro pode
// não estar nesse formato (o seed de demonstração grava dígitos puros), e a
// API só exige entre 8 e 20 caracteres (updateMeRequest, dto.go). Validar
// pela máscara travava a edição de qualquer conta com telefone não
// mascarado, mesmo sem tocar no campo.
function telefoneValido(v: string): boolean {
  const digitos = v.replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 20;
}

// PATCH /users/me (updateMeRequest, em dto.go) só aceita nome e telefone —
// não existe edição de e-mail nem de papel nesse contrato. O e-mail
// continua exibido, só que travado.
const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(120, 'O nome deve ter no máximo 120 caracteres'),
  phone: z.string().refine(telefoneValido, 'Telefone deve ter entre 8 e 20 dígitos'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// PATCH /users/me/password (changePasswordRequest, em dto.go): a confirmação
// existe só no cliente, para pegar erro de digitação antes de gastar uma ida
// ao servidor — a API não recebe esse campo.
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres').max(72, 'A nova senha deve ter no máximo 72 caracteres'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmNewPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile = () => {
  const [user, setUser] = useAtom(userAtom);
  const [auth, setAuth] = useAtom(authAtom);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // `values` (não `defaultValues`): react-hook-form só copia `defaultValues`
  // uma vez, na montagem. Esta tela monta deslogada sempre que a troca de
  // senha (mais abaixo) derruba a sessão e abre o modal de entrada nela
  // mesma — nesse instante `user` é nulo. Quando o cliente entra de novo
  // sem a página remontar, `user` passa a ter valor, mas com
  // `defaultValues` o formulário nunca ressincroniza: nome e telefone
  // ficam em branco enquanto o cabeçalho (que lê `user` direto, não pelo
  // formulário) já mostra os dados certos. `values` resssincroniza sempre
  // que a referência muda, cobrindo esse remonte lógico sem remonte de
  // componente.
  //
  // `resetOptions: { keepDirtyValues: true }` (confirmado no tipo instalado,
  // react-hook-form 7.56.3, `node_modules/react-hook-form/dist/types/form.d.ts`
  // — `KeepStateOptions.keepDirtyValues`): sem isso, toda ressincronização
  // de `values` reinicializa o formulário por inteiro, inclusive os campos
  // que o cliente já alterou e ainda não salvou. Como os campos de nome e
  // telefone não ficam desabilitados durante o envio (só o botão fica, logo
  // abaixo), uma edição feita entre o clique em "Salvar Alterações" e a
  // resposta do servidor seria descartada em silêncio quando `setUser`
  // (`onSubmit`, abaixo) trocasse a referência de `user` — sem erro, sem
  // aviso. `keepDirtyValues` faz a ressincronização pular os campos
  // "sujos" (tocados pelo cliente), preservando o que ainda não foi salvo.
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
    resetOptions: { keepDirtyValues: true },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // A API mede o telefone em caracteres (updateMeRequest, dto.go:
      // `min=8,max=20`); o cliente mede em dígitos (telefoneValido, acima).
      // Um número muito formatado (com DDI, espaços, parênteses) pode ter
      // poucos dígitos e ainda assim passar de 20 caracteres — normalizar
      // para dígitos puros antes de enviar faz as duas contagens
      // coincidirem sempre.
      const payload = { name: data.name, phone: data.phone.replace(/\D/g, '') };
      const { data: updated } = await api.patch('/users/me', payload);
      setUser(fromMeResponse(updated));
      toast.success('Perfil atualizado com sucesso!');
    } catch (erro) {
      const code = apiError(erro);
      if (code === 'VALIDATION_ERROR') {
        const detalhes = apiErrorDetails(erro);
        detalhes.forEach((d) => {
          if (d.field === 'name' || d.field === 'phone') {
            form.setError(d.field, { message: 'Valor inválido' });
          }
        });
        toast.error('Confira os dados informados.');
      } else {
        toast.error('Erro ao atualizar perfil.');
      }
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
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
      });

      toast.success(
        'Senha alterada com sucesso. Por segurança, todas as sessões foram encerradas — entre novamente.',
      );

      passwordForm.reset();

      // `sair` tenta revogar o refresh token guardado e depois limpa o
      // armazenamento local; a tentativa de revogação falha em silêncio
      // porque o token já foi derrubado no servidor pela troca de senha —
      // o que importa é a limpeza local, que nunca falha.
      await sair();
      setAuth({ access_token: null, isAuthenticated: false, id_enterprise: null });
      setUser(null);
      // Abrir o modal aqui é redundante desde que o efeito abaixo passou a
      // depender de `auth.isAuthenticated`: o `setAuth` acima já muda essa
      // dependência para `false` e o efeito abre o modal sozinho. Mantido
      // fora só reintroduziria a mesma duplicidade que o I1 apontou.
    } catch (erro) {
      const code = apiError(erro);
      if (code === 'INVALID_CREDENTIALS') {
        passwordForm.setError('currentPassword', { message: 'Senha atual incorreta' });
        toast.error('Senha atual incorreta.');
      } else if (code === 'VALIDATION_ERROR') {
        toast.error('Confira os dados informados.');
      } else {
        toast.error('Erro ao trocar a senha.');
      }
    }
  };

  // Dependência vazia era o bug: quando a sessão cai no meio da página (o
  // interceptor do axios limpa os tokens e emite o fim de sessão, o
  // AuthProvider zera `authAtom`), este efeito nunca rodava de novo e a
  // tela continuava mostrando o formulário como se estivesse logada — sem
  // modal de entrada, sem o botão de sair sumir. Dependendo de
  // `auth.isAuthenticated`, o efeito reage a qualquer mudança de sessão,
  // não só à montagem.
  //
  // `form.reset()` aqui (rodada 3): toda queda de sessão passa por este
  // efeito — `setAuth({ isAuthenticated: false, ... })` é chamado pela
  // troca de senha (abaixo), pelo botão "Sair" (mais abaixo) e por
  // `marcarDeslogado` em `providers.tsx` (fim de sessão involuntário via
  // `aoFimDeSessao`, e a reconciliação de token ausente) — os três casos
  // batem neste mesmo `auth.isAuthenticated`, então tratar aqui cobre os
  // três sem duplicar a chamada em cada um. É uma queda de sessão
  // deliberada (ou reconciliada), não uma resposta de envio do próprio
  // formulário: `form.reset()` sem argumentos (confirmado em
  // `node_modules/react-hook-form/dist/index.esm.mjs`, função `_reset`)
  // limpa `dirtyFields`/`isDirty` e não passa pelo ramo de
  // `keepDirtyValues`, então o campo deixa de estar "sujo" e volta a
  // sincronizar com `user` na próxima vez que `values` mudar — sem isso,
  // um campo editado e não salvo antes da sessão cair ficava marcado como
  // alterado para sempre, e a preservação (rodada 2) passava a proteger
  // esse valor obsoleto por um ciclo inteiro de sair-e-entrar em vez de só
  // durante o envio em voo.
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
      form.reset();
    } else {
      setIsAuthModalOpen(false);
    }
  }, [auth.isAuthenticated, form]);

  return (
    <div className="min-h-screen bg-white mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">
              Meu Perfil
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Gerencie suas informações pessoais</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Header Card */}
          <Card className="border-0 bg-white overflow-hidden">
            <CardHeader className="relative space-y-6 pb-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-4 ring-primary">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}&background=random&size=128&bold=true`} />
                    <AvatarFallback className="text-3xl font-bold bg-primary text-white">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center space-y-2">
                  <CardTitle className="text-3xl font-bold text-gray-800">{user?.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Form Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-gray-600">
                Atualize suas informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-60"
                    {...form.register('phone', {
                      onChange: (e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        e.target.value = formatted;
                      }
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

          {/* Password Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Trocar Senha
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ao trocar a senha, todas as sessões são encerradas e você
                precisará entrar novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                    Senha atual
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    {...passwordForm.register('currentPassword')}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    Nova senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700">
                    Confirmar nova senha
                  </Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    {...passwordForm.register('confirmNewPassword')}
                  />
                  {passwordForm.formState.errors.confirmNewPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {passwordForm.formState.errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {passwordForm.formState.isSubmitting ? 'Trocando...' : 'Trocar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {auth.isAuthenticated && (
            <Button
              onClick={async () => {
                // `sair` revoga o refresh token e limpa o par de tokens; sem
                // ela o usuário volta logado ao recarregar a página.
                await sair();
                setAuth({ access_token: null, isAuthenticated: false, id_enterprise: null });
                setUser(null);

                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              type="button"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              Sair
            </Button>
          )}

          {/* Único ponto fixo da vitrine em que os documentos ficam sempre
              alcançáveis: a barra de navegação é só ícones de catálogo, e o
              aviso do cadastro some depois que a conta existe. */}
          <div className="flex items-center justify-center gap-3 pb-4 text-xs text-gray-500">
            <a href="/termos-de-uso" className="hover:text-primary hover:underline">
              Termos de Uso
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/politica-de-privacidade"
              className="hover:text-primary hover:underline"
            >
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
