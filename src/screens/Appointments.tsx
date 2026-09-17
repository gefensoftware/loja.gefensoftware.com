'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { AlertTriangle, Ban, Calendar, Check, CheckCheck, Loader2, UserX } from 'lucide-react';
import { desmarcar, listarMeusAgendamentos } from '@/api/agenda';
import { agendaEmAberto, type Appointment, type AppointmentStatus } from '@/types/agenda';
import { authAtom } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Meus agendamentos": as horas do cliente em todas as lojas, com o estado de
// cada uma e o botão de desmarcar.
//
// `requested` e `confirmed` são estados diferentes e a tela diz isso em texto:
// pedir não é ter a hora, e um cliente que achasse o contrário apareceria na
// loja num horário que ela nunca aceitou.

const ROTULOS: Record<AppointmentStatus, { texto: string; icone: typeof Check; classe: string }> = {
  requested: { texto: 'Aguardando a loja confirmar', icone: Calendar, classe: 'text-amber-700' },
  confirmed: { texto: 'Confirmado', icone: Check, classe: 'text-blue-700' },
  completed: { texto: 'Atendimento realizado', icone: CheckCheck, classe: 'text-emerald-700' },
  canceled: { texto: 'Desmarcado', icone: Ban, classe: 'text-gray-600' },
  no_show: { texto: 'Você não compareceu', icone: UserX, classe: 'text-red-700' },
};

function formatarQuando(inicio: string, fim: string): string {
  const i = new Date(inicio);
  const f = new Date(fim);
  const dia = i.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const hora = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora(i)} às ${hora(f)}`;
}

const Appointments = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);

  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agindo, setAgindo] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const carregar = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(false);
    try {
      setAgendamentos(await listarMeusAgendamentos());
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!auth.isAuthenticated) setIsAuthModalOpen(true);
  }, [auth.isAuthenticated]);

  const cancelar = async (a: Appointment) => {
    setAgindo(a.id);
    try {
      const atualizado = await desmarcar(a.id, '');
      setAgendamentos((atuais) => atuais.map((x) => (x.id === atualizado.id ? atualizado : x)));
      toast.success('Agendamento desmarcado.');
    } catch {
      toast.error('Não foi possível desmarcar. Tente de novo.');
    } finally {
      setAgindo(null);
    }
  };

  return (
    <div className="min-h-screen bg-white mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Meus agendamentos</h1>
          </div>
          <p className="text-gray-600 text-lg">Horários pedidos e confirmados</p>
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-gray-700">Entre na sua conta para ver seus agendamentos.</p>
              <Button onClick={() => setIsAuthModalOpen(true)}>Entrar</Button>
            </CardContent>
          </Card>
        ) : carregando ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : erro ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              {/* "Você não tem horários" e "não deu para carregar" são coisas
                  diferentes; confundi-las faria o cliente achar que perdeu a
                  hora marcada. */}
              <p className="text-gray-700">Não foi possível carregar seus agendamentos.</p>
              <Button variant="outline" onClick={carregar}>
                Tentar de novo
              </Button>
            </CardContent>
          </Card>
        ) : agendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <p className="text-gray-900 font-medium">Você ainda não tem agendamentos.</p>
              <p className="text-gray-600 text-sm">
                Nos serviços com agendamento, escolha um horário livre na página do produto.
              </p>
              <Link href={`/${nameStore}`} className="underline text-gray-700 inline-block pt-2">
                Voltar à loja
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agendamentos.map((a) => {
              const { texto, icone: Icone, classe } = ROTULOS[a.status];
              const ocupado = agindo === a.id;
              return (
                <Card key={a.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/${nameStore}/product/${a.product.code}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {a.product.title}
                        </Link>
                        <p className="mt-1 text-sm text-gray-700">
                          {formatarQuando(a.startsAt, a.endsAt)}
                        </p>
                        {a.notes && (
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{a.notes}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium shrink-0 ${classe}`}
                      >
                        <Icone className="w-4 h-4 shrink-0" />
                        {texto}
                      </span>
                    </div>

                    {a.closedNote && (
                      <p className="text-sm text-gray-700 border-t pt-3">Motivo: {a.closedNote}</p>
                    )}

                    {agendaEmAberto(a.status) && (
                      <div className="border-t pt-3">
                        <Button
                          variant="outline"
                          disabled={ocupado}
                          onClick={() => cancelar(a)}
                        >
                          Desmarcar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
