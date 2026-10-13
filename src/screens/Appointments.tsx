'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { desmarcar, listarMeusAgendamentos } from '@/api/agenda';
import { agendaEmAberto, type Appointment } from '@/types/agenda';
import { ROTULOS, formatarQuando } from '@/lib/agenda-rotulos';
import { tokensGuardados } from '@/lib/agendamentos-sem-conta';
import AgendamentoSemContaCard from '@/components/AgendamentoSemContaCard';
import { authAtom } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Meus agendamentos": as horas do cliente em todas as lojas, com o estado de
// cada uma e o botão de desmarcar — e, abaixo, os pedidos feitos SEM conta
// neste aparelho, lidos pelos tokens guardados (lib/agendamentos-sem-conta).
// Quem só pediu sem conta vê os seus sem precisar entrar.
//
// `requested` e `confirmed` são estados diferentes e a tela diz isso em texto:
// pedir não é ter a hora, e um cliente que achasse o contrário apareceria na
// loja num horário que ela nunca aceitou.

const Appointments = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);

  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agindo, setAgindo] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Lido depois de montar: o localStorage não existe no servidor.
  const [tokens, setTokens] = useState<string[] | null>(null);

  useEffect(() => {
    setTokens(tokensGuardados(nameStore));
  }, [nameStore]);

  const esquecer = useCallback(
    (token: string) => setTokens((atuais) => (atuais ?? []).filter((t) => t !== token)),
    []
  );

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

  // Sem conta e sem nada pedido neste aparelho, entrar é o único caminho, e o
  // modal abre sozinho. Com pedidos sem conta guardados, abrir o modal por
  // cima deles esconderia justamente o que a cliente veio ver.
  useEffect(() => {
    if (tokens !== null && !auth.isAuthenticated && tokens.length === 0) setIsAuthModalOpen(true);
  }, [auth.isAuthenticated, tokens]);

  const semConta = tokens && tokens.length > 0 && (
    <div className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pedidos sem conta neste aparelho</h2>
        <p className="text-sm text-muted-foreground">
          Os horários que você pediu só com nome e telefone.
        </p>
      </div>
      {tokens.map((t) => (
        <AgendamentoSemContaCard key={t} nameStore={nameStore} token={t} onSumiu={() => esquecer(t)} />
      ))}
    </div>
  );

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
    <div className="min-h-screen bg-background mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-full shadow-sm">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Meus agendamentos</h1>
          </div>
          <p className="text-muted-foreground text-lg">Horários pedidos e confirmados</p>
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-foreground">
                {tokens && tokens.length > 0
                  ? 'Tem conta? Entre para ver também os horários pedidos por ela.'
                  : 'Entre na sua conta para ver seus agendamentos.'}
              </p>
              <Button onClick={() => setIsAuthModalOpen(true)}>Entrar</Button>
            </CardContent>
          </Card>
        ) : carregando ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : erro ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              {/* "Você não tem horários" e "não deu para carregar" são coisas
                  diferentes; confundi-las faria o cliente achar que perdeu a
                  hora marcada. */}
              <p className="text-foreground">Não foi possível carregar seus agendamentos.</p>
              <Button variant="outline" onClick={carregar}>
                Tentar de novo
              </Button>
            </CardContent>
          </Card>
        ) : agendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <p className="text-foreground font-medium">Você ainda não tem agendamentos.</p>
              <p className="text-muted-foreground text-sm">
                Nos serviços com agendamento, escolha um horário livre na página do produto.
              </p>
              <Link href={`/${nameStore}`} className="underline text-foreground inline-block pt-2">
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
                        {/* O horário livre, marcado pela loja fora do
                            catálogo, não tem página de produto para onde ir:
                            vira texto, e não um link quebrado. */}
                        {a.product ? (
                          <Link
                            href={`/${nameStore}/product/${a.product.code}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {a.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-foreground">{a.title}</p>
                        )}
                        <p className="mt-1 text-sm text-foreground">
                          {formatarQuando(a.startsAt, a.endsAt)}
                          {a.technicianName && ` · com ${a.technicianName}`}
                        </p>
                        {a.notes && (
                          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.notes}</p>
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
                      <p className="text-sm text-foreground border-t pt-3">Motivo: {a.closedNote}</p>
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
        {semConta}
      </div>
    </div>
  );
};

export default Appointments;
