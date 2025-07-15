import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api';
import { useAtom } from 'jotai';
import { userAtom } from '../store/user';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Phone, Mail, Settings, Calendar } from 'lucide-react';
import { Tabs, TabsContent } from '../components/ui/tabs';
import Appointments from '../components/Appointments';
import { authAtom } from '../store/auth';
import { useEffect, useState } from 'react';
import AuthModal from '../components/AuthModal';

const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;

const profileSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  phone: z.string().regex(phoneRegex, 'Formato de telefone inválido'),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const [user, setUser] = useAtom(userAtom);
  const [auth, setAuth] = useAtom(authAtom);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
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
      const { data: updatedUser } = await api.patch(`/user/${user?.id_user}`, data);
      setUser(updatedUser);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setIsAuthModalOpen(false);
    }
  }, []);

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
          <p className="text-gray-600 text-lg">Gerencie suas informações pessoais e agendamentos</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          {/* <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1 shadow-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2  rounded-lg transition-all duration-200">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2  rounded-lg transition-all duration-200">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </TabsTrigger>
          </TabsList> */}
          <TabsContent value="profile" className="mt-2">
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
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl h-12 px-4 transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
                        placeholder="seu@email.com"
                        className="border-2 border-gray-200 rounded-xl h-12 px-4 bg-gray-100/50 text-gray-500 cursor-not-allowed"
                        {...form.register('email')}
                        disabled
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        Email não pode ser alterado por questões de segurança
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Salvar Alterações
                      </Button>
                     {
                      auth.isAuthenticated && (
                        <Button
                        onClick={() => {
                          
                          setAuth({
                            isAuthenticated: false,
                            access_token: null,
                            id_enterprise: null,
                          });

                          setUser({
                            id_user: '',
                            name: '',
                            email: '',
                            phone: '',
                            active: false,
                            avatar: '',
                            role: '',
                          });

                          window.location.reload();
                        }}
                        type="button"
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                      >
                        Sair
                      </Button> 
                      )
                     }
                    </div>
                  </form>

                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Meus Agendamentos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Visualize e gerencie seus agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Appointments />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default Profile; 