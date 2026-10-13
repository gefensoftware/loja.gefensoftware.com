'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import AgendamentoSemContaCard from '@/components/AgendamentoSemContaCard';
import { guardarToken } from '@/lib/agendamentos-sem-conta';

// O link de acompanhamento do pedido feito sem conta.
//
// Quem abre o link vê o estado do pedido e pode desmarcar — e o token passa a
// ficar guardado neste aparelho, para o pedido aparecer em "Agenda" mesmo que
// o link tenha sido aberto em outro celular.
const GuestAppointment = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const token = (params?.token as string) ?? '';

  useEffect(() => {
    if (nameStore && token) guardarToken(nameStore, token);
  }, [nameStore, token]);

  return (
    <div className="min-h-screen bg-background mb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-full shadow-sm">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Seu agendamento</h1>
          </div>
          <p className="text-muted-foreground">
            Pedir não é ter a hora: ela só fica garantida quando a loja confirmar.
          </p>
        </div>

        <AgendamentoSemContaCard nameStore={nameStore} token={token} />

        <p className="text-sm text-muted-foreground">
          Este link mostra só este pedido.{' '}
          <Link href={`/${nameStore}/agendamentos`} className="underline">
            Ver todos os horários deste aparelho
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default GuestAppointment;
