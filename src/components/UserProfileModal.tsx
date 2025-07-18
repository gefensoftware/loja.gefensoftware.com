'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/api';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/user';
import {toast} from 'react-toastify';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;

const profileSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  phone: z.string().regex(phoneRegex, 'Formato de telefone inválido'),
  email: z.string().email('Email inválido'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const [user, setUser] = useAtom(userAtom);

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
      const { data: updatedUser } = await api.put(`/user/${user?.id_user}`, data);
      setUser(updatedUser);
      onClose();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              {...form.register('phone', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  e.target.value = formatted;
                }
              })}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal; 