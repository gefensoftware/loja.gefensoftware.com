'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { AlertTriangle, Loader2, Store } from 'lucide-react';
import { desmarcar, listarMeusAgendamentos } from '@/api/agenda';
import { agendaEmAberto, type Appointment } from '@/types/agenda';
import { ROTULOS, formatarQuando } from '@/lib/agenda-rotulos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// As horas do cliente com conta, com o estado de cada uma e o botão de
// desmarcar.
//
// Como em ListaDeOrcamentos: com `enterpriseId`, só as desta vitrine; sem
// ele (o perfil), as de todas as lojas, cada cartão dizendo de qual é.
//
// `requested` e `confirmed` são estados diferentes e a tela diz isso em texto:
// pedir não é ter a hora, e um cliente que achasse o contrário apareceria na
// loja num horário que ela nunca aceitou.

export default function ListaDeAgendamentos({ enterpriseId }: { enterpriseId?: string }) {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const todasAsLojas = !enterpriseId;

  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agindo, setAgindo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      setAgendamentos(await listarMeusAgendamentos(enterpriseId));
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [enterpriseId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const cancelar = async (a: Appointment) => {
    setAgindo(a.id);
    try {
      const atualizado = await desmarcar(a.id, '');
      setAgendamentos((atuais) =>
        atuais.map((x) => (x.id === atualizado.id ? { ...atualizado, store: atualizado.store ?? x.store } : x))
      );
      toast.success('Agendamento desmarcado.');
    } catch {
      toast.error('Não foi possível desmarcar. Tente de novo.');
    } finally {
      setAgindo(null);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando…
      </div>
    );
  }

  if (erro) {
    return (
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
    );
  }

  if (agendamentos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-2">
          <p className="text-foreground font-medium">
            {todasAsLojas
              ? 'Você ainda não tem agendamentos.'
              : 'Você ainda não tem agendamentos nesta loja.'}
          </p>
          <p className="text-muted-foreground text-sm">
            Nos serviços com agendamento, escolha um horário livre na página do serviço.
          </p>
          <Link href={`/${nameStore}`} className="underline text-foreground inline-block pt-2">
            Voltar à loja
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {agendamentos.map((a) => {
        const { texto, icone: Icone, classe } = ROTULOS[a.status];
        const ocupado = agindo === a.id;
        const vitrine = a.store?.slug ?? nameStore;
        return (
          <Card key={a.id}>
            <CardContent className="p-5 space-y-3">
              {todasAsLojas && a.store && (
                <Link
                  href={`/${a.store.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
                >
                  <Store className="w-4 h-4 shrink-0" />
                  {a.store.name}
                </Link>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {/* O horário livre, marcado pela loja fora do
                      catálogo, não tem página de produto para onde ir:
                      vira texto, e não um link quebrado. */}
                  {a.product ? (
                    <Link
                      href={`/${vitrine}/product/${a.product.code}`}
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
                  <Button variant="outline" disabled={ocupado} onClick={() => cancelar(a)}>
                    Desmarcar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
