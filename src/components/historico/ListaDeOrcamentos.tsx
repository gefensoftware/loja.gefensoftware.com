'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { AlertTriangle, Check, Clock, FileText, Loader2, Store, X } from 'lucide-react';
import {
  aceitarCotacao,
  cancelarPedido,
  listarMeusPedidos,
  recusarCotacao,
} from '@/api/budget';
import { emAberto, type BudgetRequest, type BudgetStatus } from '@/types/budget';
import { formatarPreco } from '@/lib/price';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Os pedidos de orçamento do cliente, com a resposta da loja e os botões de
// aceitar, recusar e cancelar.
//
// Serve às duas telas que mostram esses pedidos: a da vitrine, que passa o
// `enterpriseId` da loja e vê só o que foi pedido nela, e a do perfil, que
// não passa nada e vê o histórico em todas as lojas. Na segunda, cada cartão
// diz de que loja é e leva à vitrine dela — sem isso, uma lista misturada de
// "Troca de tela" não diria onde cada uma foi pedida.
//
// Quem usa garante a sessão: a lista assume que há alguém logado.

const ROTULOS: Record<BudgetStatus, { texto: string; icone: typeof Clock; classe: string }> = {
  pending: { texto: 'Aguardando a loja', icone: Clock, classe: 'text-amber-700 dark:text-amber-300' },
  quoted: { texto: 'A loja respondeu', icone: FileText, classe: 'text-blue-700 dark:text-blue-300' },
  accepted: { texto: 'Você aceitou', icone: Check, classe: 'text-emerald-700 dark:text-emerald-300' },
  declined: { texto: 'Você recusou', icone: X, classe: 'text-red-700 dark:text-red-300' },
  rejected: { texto: 'A loja não vai orçar', icone: X, classe: 'text-red-700 dark:text-red-300' },
  canceled: { texto: 'Você cancelou', icone: X, classe: 'text-muted-foreground' },
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function ListaDeOrcamentos({ enterpriseId }: { enterpriseId?: string }) {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const todasAsLojas = !enterpriseId;

  const [pedidos, setPedidos] = useState<BudgetRequest[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agindo, setAgindo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      setPedidos(await listarMeusPedidos({ enterpriseId, pageSize: 100 }));
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [enterpriseId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
      // de fazer virar o novo estado, em vez de a lista piscar inteira. A
      // loja fica a que já estava na linha, se a resposta vier sem ela.
      setPedidos((atuais) =>
        atuais.map((p) => (p.id === atualizado.id ? { ...atualizado, store: atualizado.store ?? p.store } : p))
      );
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
          {/* Nada de lista vazia num erro de rede: "você não tem pedidos"
              e "não deu para carregar" são coisas diferentes. */}
          <p className="text-foreground">Não foi possível carregar seus orçamentos.</p>
          <Button variant="outline" onClick={carregar}>
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-2">
          <p className="text-foreground font-medium">
            {todasAsLojas
              ? 'Você ainda não pediu nenhum orçamento.'
              : 'Você ainda não pediu nenhum orçamento nesta loja.'}
          </p>
          <p className="text-muted-foreground text-sm">
            Na página de um item sob orçamento, peça o preço por lá: a loja responde com o
            valor, e ele aparece aqui.
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
      {pedidos.map((pedido) => {
        const { texto, icone: Icone, classe } = ROTULOS[pedido.status];
        const ocupado = agindo === pedido.id;
        // O produto mora na vitrine da loja do pedido, não necessariamente
        // na que está aberta agora.
        const vitrine = pedido.store?.slug ?? nameStore;
        return (
          <Card key={pedido.id}>
            <CardContent className="p-5 space-y-4">
              {todasAsLojas && pedido.store && (
                <Link
                  href={`/${pedido.store.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
                >
                  <Store className="w-4 h-4 shrink-0" />
                  {pedido.store.name}
                </Link>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4 min-w-0">
                  {pedido.product.image ? (
                    <img
                      src={pedido.product.image.url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/${vitrine}/product/${pedido.product.code}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {pedido.product.title}
                    </Link>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pedido em {formatarData(pedido.createdAt)}
                  </p>
                </div>
              </div>

              {pedido.quoteNote && (
                <p className="text-sm text-foreground border-t pt-3 whitespace-pre-wrap">
                  Resposta da loja: {pedido.quoteNote}
                </p>
              )}
              {pedido.closedNote && (
                <p className="text-sm text-foreground border-t pt-3">
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
                    className="text-muted-foreground"
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
  );
}
