import { Ban, Calendar, Check, CheckCheck, UserX } from 'lucide-react';
import type { AppointmentStatus } from '@/types/agenda';

// O texto de cada estado da hora marcada, e como escrever quando ela é —
// compartilhados entre "Meus agendamentos" e o link do pedido sem conta, para
// as duas telas dizerem a mesma coisa sobre o mesmo pedido.

export const ROTULOS: Record<AppointmentStatus, { texto: string; icone: typeof Check; classe: string }> = {
  requested: { texto: 'Aguardando a loja confirmar', icone: Calendar, classe: 'text-amber-700 dark:text-amber-300' },
  confirmed: { texto: 'Confirmado', icone: Check, classe: 'text-blue-700 dark:text-blue-300' },
  completed: { texto: 'Atendimento realizado', icone: CheckCheck, classe: 'text-emerald-700 dark:text-emerald-300' },
  canceled: { texto: 'Desmarcado', icone: Ban, classe: 'text-muted-foreground' },
  no_show: { texto: 'Você não compareceu', icone: UserX, classe: 'text-red-700 dark:text-red-300' },
};

export function formatarQuando(inicio: string, fim: string): string {
  const i = new Date(inicio);
  const f = new Date(fim);
  const dia = i.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora(i)} às ${hora(f)}`;
}
