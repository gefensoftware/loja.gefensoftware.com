'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { agendamentoPeloLink, desmarcarPeloLink, type AgendamentoSemConta } from '@/api/agenda';
import { esquecerToken } from '@/lib/agendamentos-sem-conta';
import { ROTULOS, formatarQuando } from '@/lib/agenda-rotulos';
import { agendaEmAberto } from '@/types/agenda';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Um pedido feito sem conta, lido pelo token do link.
//
// Serve à página do link e à lista de "Meus agendamentos" deste aparelho.
// Token que o servidor não reconhece (404) some da lista guardada: é um link
// velho de outra loja ou de uma base de testes, e mostrá-lo como erro para
// sempre não ajuda ninguém.

type Props = {
  nameStore: string;
  token: string;
  /** Chamado quando o token não existe mais no servidor. */
  onSumiu?: () => void;
};

export default function AgendamentoSemContaCard({ nameStore, token, onSumiu }: Props) {
  const [a, setA] = useState<AgendamentoSemConta | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro' | 'sumiu'>('carregando');
  const [confirmando, setConfirmando] = useState(false);
  const [agindo, setAgindo] = useState(false);

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      setA(await agendamentoPeloLink(nameStore, token));
      setEstado('ok');
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 404) {
        esquecerToken(nameStore, token);
        setEstado('sumiu');
        onSumiu?.();
        return;
      }
      setEstado('erro');
    }
  }, [nameStore, token, onSumiu]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const desmarcar = async () => {
    setAgindo(true);
    try {
      setA(await desmarcarPeloLink(nameStore, token, ''));
      setConfirmando(false);
      toast.success('Agendamento desmarcado.');
    } catch {
      toast.error('Não foi possível desmarcar. Tente de novo.');
    } finally {
      setAgindo(false);
    }
  };

  if (estado === 'sumiu') return null;

  if (estado === 'carregando') {
    return (
      <Card>
        <CardContent className="p-5 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando…
        </CardContent>
      </Card>
    );
  }

  if (estado === 'erro' || !a) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Não foi possível carregar este agendamento.
          </p>
          <Button variant="outline" onClick={carregar}>
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { texto, icone: Icone, classe } = ROTULOS[a.status];
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {a.productCode !== null ? (
              <Link
                href={`/${nameStore}/product/${a.productCode}`}
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
            <p className="mt-1 text-sm text-muted-foreground">Em nome de {a.customerName}</p>
            {a.notes && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.notes}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium shrink-0 ${classe}`}>
            <Icone className="w-4 h-4 shrink-0" />
            {texto}
          </span>
        </div>

        {a.closedNote && (
          <p className="text-sm text-foreground border-t pt-3">Motivo: {a.closedNote}</p>
        )}

        {/* Dois passos para desmarcar: o botão fica ao lado de quem só veio
            conferir o horário, e um toque sem querer não tem volta. */}
        {agendaEmAberto(a.status) && (
          <div className="border-t pt-3 flex flex-wrap items-center gap-2">
            {confirmando ? (
              <>
                <span className="text-sm text-foreground">Desmarcar este horário?</span>
                <Button variant="outline" disabled={agindo} onClick={desmarcar}>
                  Sim, desmarcar
                </Button>
                <Button variant="ghost" disabled={agindo} onClick={() => setConfirmando(false)}>
                  Manter
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setConfirmando(true)}>
                Desmarcar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
