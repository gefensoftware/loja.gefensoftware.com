'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { AlertTriangle, Check, Clock, FileText, Loader2, X } from 'lucide-react';
import {
  aceitarCotacao,
  cancelarPedido,
  listarMeusPedidos,
  recusarCotacao,
} from '@/api/budget';
import { emAberto, type BudgetRequest, type BudgetStatus } from '@/types/budget';
import { formatarPreco } from '@/lib/price';
import { authAtom } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Meus orçamentos": os pedidos do cliente, com a resposta da loja e os
// botões de aceitar, recusar e cancelar.
//
// A lista é do cliente em TODAS as lojas — é o que a API devolve em
// /users/me/budget-requests, e é o que faz sentido para quem pede: a pessoa
// tem um histórico só, não um por vitrine que visitou.

const ROTULOS: Record<BudgetStatus, { texto: string; icone: typeof Clock; classe: string }> = {
  pending: { texto: 'Aguardando a loja', icone: Clock, classe: 'text-amber-700' },
  quoted: { texto: 'A loja respondeu', icone: FileText, classe: 'text-blue-700' },
  accepted: { texto: 'Você aceitou', icone: Check, classe: 'text-emerald-700' },
  declined: { texto: 'Você recusou', icone: X, classe: 'text-red-700' },
  rejected: { texto: 'A loja não vai orçar', icone: X, classe: 'text-red-700' },
  canceled: { texto: 'Você cancelou', icone: X, classe: 'text-gray-600' },
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const BudgetRequests = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);

  const [pedidos, setPedidos] = useState<BudgetRequest[]>([]);
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
      setPedidos(await listarMeusPedidos({ pageSize: 100 }));
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

  const responder = async (pedido: BudgetRequest, acao: 'aceitar' | 'recusar' | 'cancelar') => {
    setAgindo(pedido.id);
    try {
      const atualizado =
        acao === 'aceitar'
          ? await aceitarCotacao(pedido.id)
          : acao === 'recusar'
            ? await recusarCotacao(pedido.id, '')
            : await cancelarPedido(pedido.id);
      // Substitui a linha no lugar, sem recarregar: a pessoa vê o que acabou
      // de fazer virar o novo estado, em vez de a lista piscar inteira.
      setPedidos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)));
      toast.success(
        acao === 'aceitar'
          ? 'Orçamento aceito. A loja entra em contato.'
          : acao === 'recusar'
            ? 'Orçamento recusado.'
            : 'Pedido cancelado.'
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-full shadow-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Meus orçamentos</h1>
          </div>
          <p className="text-gray-600 text-lg">Pedidos de preço e o que as lojas responderam</p>
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-gray-700">Entre na sua conta para ver seus orçamentos.</p>
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
              {/* Nada de lista vazia num erro de rede: "você não tem pedidos"
                  e "não deu para carregar" são coisas diferentes. */}
              <p className="text-gray-700">Não foi possível carregar seus orçamentos.</p>
              <Button variant="outline" onClick={carregar}>
                Tentar de novo
              </Button>
            </CardContent>
          </Card>
        ) : pedidos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <p className="text-gray-900 font-medium">Você ainda não pediu nenhum orçamento.</p>
              <p className="text-gray-600 text-sm">
                Nos produtos vendidos sob orçamento, use o botão &quot;Pedir orçamento&quot; para
                falar com a loja.
              </p>
              <Link href={`/${nameStore}`} className="underline text-gray-700 inline-block pt-2">
                Voltar à loja
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const { texto, icone: Icone, classe } = ROTULOS[pedido.status];
              const ocupado = agindo === pedido.id;
              return (
                <Card key={pedido.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4 min-w-0">
                        {pedido.product.image ? (
                          <img
                            src={pedido.product.image.url}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/${nameStore}/product/${pedido.product.code}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {pedido.product.title}
                          </Link>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                            {pedido.message}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${classe}`}>
                          <Icone className="w-4 h-4 shrink-0" />
                          {texto}
                        </span>
                        {pedido.quoteAmount && (
                          <p className="mt-1 text-xl font-semibold text-primary">
                            {formatarPreco(pedido.quoteAmount)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Pedido em {formatarData(pedido.createdAt)}
                        </p>
                      </div>
                    </div>

                    {pedido.quoteNote && (
                      <p className="text-sm text-gray-700 border-t pt-3 whitespace-pre-wrap">
                        Resposta da loja: {pedido.quoteNote}
                      </p>
                    )}
                    {pedido.closedNote && (
                      <p className="text-sm text-gray-700 border-t pt-3">
                        Motivo: {pedido.closedNote}
                      </p>
                    )}

                    {emAberto(pedido.status) && (
                      <div className="flex flex-wrap gap-3 border-t pt-3">
                        {/* Aceitar e recusar só existem com cotação na mesa —
                            é o que a API permite, e oferecer antes seria um
                            botão que sempre falha. */}
                        {pedido.status === 'quoted' && (
                          <>
                            <Button disabled={ocupado} onClick={() => responder(pedido, 'aceitar')}>
                              Aceitar
                            </Button>
                            <Button
                              variant="outline"
                              disabled={ocupado}
                              onClick={() => responder(pedido, 'recusar')}
                            >
                              Recusar
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          className="text-gray-600"
                          disabled={ocupado}
                          onClick={() => responder(pedido, 'cancelar')}
                        >
                          Cancelar pedido
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

export default BudgetRequests;
