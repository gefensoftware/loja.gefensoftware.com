'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Clock,
  Loader2,
  PackageCheck,
  Printer,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { aprovarOrdem, listarMinhasOrdens, recusarOrdem } from '@/api/work-order';
import { aguardandoVoce, type WorkOrder, type WorkOrderStatus } from '@/types/work-order';
import { formatarPreco } from '@/lib/price';
import { authAtom } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Minhas ordens de serviço": o que o cliente deixou numa oficina, em que
// ponto está, e a decisão que só ele pode tomar — aprovar ou recusar o
// orçamento.
//
// A lista é do cliente em TODAS as lojas, como "meus orçamentos": a pessoa
// tem um histórico só, não um por vitrine que visitou. É também por isso que
// esta tela continua de pé numa loja que desligou o módulo — ela pode ter
// ordens em outra oficina.

const ROTULOS: Record<WorkOrderStatus, { texto: string; icone: typeof Clock; classe: string }> = {
  received: { texto: 'Recebido pela loja', icone: ClipboardList, classe: 'text-gray-600' },
  quoted: { texto: 'Aguardando sua aprovação', icone: Clock, classe: 'text-amber-700' },
  approved: { texto: 'Aprovado, em execução', icone: Wrench, classe: 'text-blue-700' },
  ready: { texto: 'Pronto para retirada', icone: PackageCheck, classe: 'text-emerald-700' },
  delivered: { texto: 'Entregue', icone: Truck, classe: 'text-gray-600' },
  declined: { texto: 'Você recusou o orçamento', icone: X, classe: 'text-red-700' },
  canceled: { texto: 'Cancelado pela loja', icone: X, classe: 'text-gray-600' },
};

function formatarData(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
}

const WorkOrders = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);

  const [ordens, setOrdens] = useState<WorkOrder[]>([]);
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
      setOrdens(await listarMinhasOrdens());
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

  const responder = async (ordem: WorkOrder, acao: 'aprovar' | 'recusar') => {
    setAgindo(ordem.id);
    try {
      const atualizada =
        acao === 'aprovar' ? await aprovarOrdem(ordem.id) : await recusarOrdem(ordem.id, '');
      // Substitui a linha no lugar: a pessoa vê o que acabou de fazer virar o
      // novo estado, em vez de a lista piscar inteira.
      setOrdens((atuais) => atuais.map((o) => (o.id === atualizada.id ? atualizada : o)));
      toast.success(
        acao === 'aprovar'
          ? 'Serviço aprovado. A loja já pode começar.'
          : 'Orçamento recusado. Combine com a loja a retirada.'
      );
    } catch {
      toast.error('Não foi possível registrar sua resposta. Tente de novo.');
    } finally {
      setAgindo(null);
    }
  };

  return (
    <div className="min-h-screen bg-white mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minhas ordens de serviço</h1>
          <p className="text-sm text-gray-600 mt-1">
            O que você deixou na loja, em que ponto está e quanto vai custar.
          </p>
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-700">Entre na sua conta para ver suas ordens de serviço.</p>
              <Button className="mt-4" onClick={() => setIsAuthModalOpen(true)}>
                Entrar
              </Button>
            </CardContent>
          </Card>
        ) : carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : erro ? (
          <Card>
            <CardContent className="py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-gray-700">Não foi possível carregar suas ordens.</p>
              <Button variant="outline" className="mt-4" onClick={carregar}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : ordens.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700">Você ainda não tem nenhuma ordem de serviço.</p>
              <p className="text-sm text-gray-500 mt-1">
                Elas aparecem aqui quando a loja registra o que você deixou lá.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/${nameStore}`}>Voltar para a loja</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ordens.map((ordem) => {
              const rotulo = ROTULOS[ordem.status];
              const Icone = rotulo.icone;
              const decidir = aguardandoVoce(ordem);

              return (
                <Card key={ordem.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {ordem.equipment?.label ?? 'Equipamento'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Ordem nº {ordem.number} · aberta em {formatarData(ordem.createdAt)}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-sm ${rotulo.classe}`}>
                        <Icone className="w-4 h-4 shrink-0" />
                        {rotulo.texto}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-700">
                      <span className="text-gray-500">O que você relatou: </span>
                      {ordem.reportedIssue}
                    </p>
                    {ordem.diagnosis && (
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="text-gray-500">Laudo da loja: </span>
                        {ordem.diagnosis}
                      </p>
                    )}

                    {/* O orçamento discriminado: é o que permite decidir
                        sabendo quanto foi peça e quanto foi trabalho. */}
                    {ordem.items.length > 0 && (
                      <div className="mt-4 rounded-md border">
                        <ul className="divide-y">
                          {ordem.items.map((item, i) => (
                            <li key={item.id ?? i} className="flex justify-between gap-4 px-3 py-2 text-sm">
                              <span className="min-w-0">
                                <span className="text-gray-500">
                                  {item.kind === 'part' ? 'Peça' : 'Mão de obra'}:{' '}
                                </span>
                                {item.description}
                                {item.quantity > 1 && (
                                  <span className="text-gray-500"> ({item.quantity}x)</span>
                                )}
                              </span>
                              <span className="shrink-0 text-gray-900">
                                {formatarPreco(item.total ?? item.unitAmount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex justify-between px-3 py-2 text-sm font-semibold">
                          <span>Total</span>
                          <span>{formatarPreco(ordem.total)}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* A nota fica disponível desde a abertura, e não só
                          no fim: o cliente que deixou o equipamento quer o
                          comprovante do que entregou, não só do que pagou. */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${nameStore}/ordens/${ordem.id}/nota`}>
                          <Printer className="w-4 h-4 mr-2" />
                          Ver nota
                        </Link>
                      </Button>
                    </div>

                    {decidir && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          disabled={agindo === ordem.id}
                          onClick={() => responder(ordem, 'aprovar')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Aprovar o serviço
                        </Button>
                        <Button
                          variant="outline"
                          disabled={agindo === ordem.id}
                          onClick={() => responder(ordem, 'recusar')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                      </div>
                    )}

                    {ordem.status === 'ready' && (
                      <p className="mt-3 text-sm text-emerald-700">
                        Pronto para retirada. Passe na loja para buscar.
                      </p>
                    )}
                    {ordem.closedNote && (
                      <p className="mt-3 border-t pt-2 text-sm text-gray-600">
                        Observação: {ordem.closedNote}
                      </p>
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

export default WorkOrders;
