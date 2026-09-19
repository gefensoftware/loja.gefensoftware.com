'use client'

import  { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, apiError } from '@/api';
import { TERMOS_VERSAO, PRIVACIDADE_VERSAO } from '@/content/legal/empresa';
import { entrar, mensagemDeErroDeEntrada } from '@/api/auth';
import { useAtom } from 'jotai';
import { authAtom } from '@/store/auth';
import { userAtom } from '@/store/user';
import {toast} from 'react-toastify';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  phone: z.string().regex(phoneRegex, 'Formato de telefone inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  // Aceite explícito, não presumido do clique em "Cadastrar". O que se grava
  // é este ato: marcar a caixa é o que distingue prova de aceite de prova de
  // que a pessoa passou por uma tela.
  aceite: z.literal(true, {
    errorMap: () => ({ message: 'É preciso aceitar os Termos de Uso para criar a conta' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthModal = (props: AuthModalProps) => {
  const { isOpen, onClose } = props;
  const [activeTab, setActiveTab] = useState('login');
  const [, setAuth] = useAtom(authAtom);
  const [, setUser] = useAtom(userAtom);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    // `aceite` precisa nascer false: sem valor inicial o Controller entrega
    // undefined ao Radix, que passa a tratar a caixa como não controlada e
    // deixa de refletir o estado do formulário.
    defaultValues: { aceite: false as unknown as true },
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const { tokens, user } = await entrar(data);
      setUser(user);
      setAuth({
        access_token: tokens.accessToken,
        isAuthenticated: true,
        id_enterprise: null,
      });

      onClose()
      toast.success('Login realizado com sucesso!')
    } catch (error) {
      toast.error(mensagemDeErroDeEntrada(error));
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      // POST /users (plural) — é a rota que existe: registerUserRoutes monta
      // o grupo "/users" e registra o cadastro na raiz dele.
      //
      // Payload montado campo a campo, e não `data` inteiro: `aceite` e
      // `confirmPassword` são estado do formulário, não do cadastro. O que a
      // API precisa saber do aceite são as VERSÕES exibidas — a caixa
      // marcada já é pré-requisito para chegar aqui.
      await api.post('/users', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        termsVersion: TERMOS_VERSAO,
        privacyVersion: PRIVACIDADE_VERSAO,
      })
      await onLoginSubmit({
        email: data.email,
        password: data.password
      })
      onClose()
      toast.success('Cadastro realizado com sucesso!')
    } catch (error) {
      // O contrato novo devolve {"error":{"code",...}} com o código em
      // MAIÚSCULAS; `error.response.data.message` era do contrato antigo e
      // chegava sempre indefinido.
      const code = apiError(error);
      if (code === 'EMAIL_ALREADY_EXISTS') {
        toast.error('Este email já está cadastrado')
      } else if (code === 'VALIDATION_ERROR') {
        toast.error('Confira os dados informados')
      } else {
        toast.error('Erro ao fazer cadastro')
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl rounded-lg">
        <div className="bg-primary px-6 py-4 text-white">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold">Bem-vindo!</DialogTitle>
            <p className="text-white mt-2">Entre ou crie sua conta para continuar</p>
          </DialogHeader>
        </div>
        
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6">
              <TabsTrigger 
                value="login" 
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com"
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...loginForm.register('email')}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...loginForm.register('password')}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome
                  </Label>
                  <div className="relative">
                    <Input 
                      id="name" 
                      placeholder="Seu nome completo"
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...registerForm.register('name')}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...registerForm.register('phone', {
                        onChange: (e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          e.target.value = formatted;
                        }
                      })}
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {registerForm.formState.errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="seu@email.com"
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...registerForm.register('email')}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="register-password" 
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...registerForm.register('password')}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      {...registerForm.register('confirmPassword')}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                {/* A caixa vem ANTES do botão: é pré-requisito do cadastro,
                    não rodapé informativo. Os links abrem em nova aba de
                    propósito — o formulário está preenchido, e navegar para
                    fora o perderia.

                    A redação separa os dois documentos porque eles são
                    diferentes: os Termos são contrato, e se aceitam; a
                    Política informa como os dados são tratados com base em
                    execução de contrato e legítimo interesse, não em
                    consentimento — dizer "concordo com a Política" afirmaria
                    uma base legal que o próprio documento não usa. */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Controller
                      name="aceite"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id="aceite"
                          checked={field.value}
                          onCheckedChange={(marcado) => field.onChange(marcado === true)}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          className="mt-0.5"
                          aria-describedby="aceite-erro"
                        />
                      )}
                    />
                    <Label
                      htmlFor="aceite"
                      className="text-xs font-normal leading-relaxed text-gray-600"
                    >
                      Li e aceito os{' '}
                      <a
                        href="/termos-de-uso"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Termos de Uso
                      </a>{' '}
                      e estou ciente da{' '}
                      <a
                        href="/politica-de-privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        Política de Privacidade
                      </a>
                      .
                    </Label>
                  </div>
                  {registerForm.formState.errors.aceite && (
                    <p id="aceite-erro" className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {registerForm.formState.errors.aceite.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  disabled={registerForm.formState.isSubmitting || !registerForm.watch('aceite')}
                >
                  {registerForm.formState.isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal; 