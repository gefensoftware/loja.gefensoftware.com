'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Clock, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  aceitarCotacao,
  cancelarPedido,
  criarPedidoDeOrcamento,
  listarMeusPedidos,
  recusarCotacao,
} from '@/api/budget';
import { emAberto, type BudgetRequest } from '@/types/budget';
import { formatarPreco } from '@/lib/price';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// O pedido de orçamento na tela do produto.
//
// Substitui o aviso de "temporariamente indisponível" que estava aqui: o
// `POST /request-budget` do contrato NestJS nunca existiu na API Go, e o
// caminho ficou desligado até esta fatia.
//
// O painel mostra UM pedido — o desta pessoa para ESTE produto — porque é
// isso que a API permite ter em aberto por vez. O histórico dos demais fica
// em /{loja}/orcamentos.

type Props = {
  enterpriseId?: string;
  productId: string;
  nameStore: string;
  autenticado: boolean;
  onPrecisaEntrar: () => void;
};

const ROTULOS: Record<BudgetRequest['status'], { texto: string; icone: typeof Clock }> = {
  pending: { texto: 'Enviado — aguardando a loja responder', icone: Clock },
  quoted: { texto: 'A loja respondeu com um valor', icone: FileText },
  accepted: { texto: 'Você aceitou este orçamento', icone: Check },
  declined: { texto: 'Você recusou este orçamento', icone: X },
  rejected: { texto: 'A loja não vai orçar este item', icone: X },
  canceled: { texto: 'Você cancelou este pedido', icone: X },
};

export default function BudgetRequestPanel({
  enterpriseId,
  productId,
  nameStore,
  autenticado,
  onPrecisaEntrar,
}: Props) {
  const [pedido, setPedido] = useState<BudgetRequest | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Falha de leitura é estado próprio: sem ele, uma rede instável mostraria o
  // formulário em branco a quem já tem pedido aberto, e o envio tomaria 409.
  const [erroDeLeitura, setErroDeLeitura] = useState(false);

  const carregar = useCallback(async () => {
    if (!autenticado) return;
    setCarregando(true);
    setErroDeLeitura(false);
    try {
      const meus = await listarMeusPedidos({ productId, pageSize: 1 });
      setPedido(meus[0] ?? null);
    } catch {
      setErroDeLeitura(true);
    } finally {
      setCarregando(false);
    }
  }, [autenticado, productId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviar = async () => {
    if (!enterpriseId) return;
    setEnviando(true);
    try {
      setPedido(await criarPedidoDeOrcamento(enterpriseId, productId, mensagem.trim()));
      setMensagem('');
      toast.success('Pedido enviado. A loja responde por aqui.');
    } catch (e) {
      const codigo = (e as { response?: { data?: { error?: { code?: string } } } })?.response?.data
        ?.error?.code;
      if (codigo === 'BUDGET_REQUEST_ALREADY_OPEN') {
        // Aconteceu em outra aba ou antes de esta tela carregar: recarregar
        // mostra o pedido que já existe, em vez de repetir um erro que a
        // pessoa não tem como resolver.
        toast.info('Você já tem um pedido em aberto para este produto.');
        carregar();
      } else {
        toast.error('Não foi possível enviar seu pedido. Tente de novo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const responder = async (acao: 'aceitar' | 'recusar' | 'cancelar') => {
    if (!pedido) return;
    setEnviando(true);
    try {
      const atualizado =
        acao === 'aceitar'
          ? await aceitarCotacao(pedido.id)
          : acao === 'recusar'
            ? await recusarCotacao(pedido.id, '')
            : await cancelarPedido(pedido.id);
      setPedido(atualizado);
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
      setEnviando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Este item é vendido sob orçamento. Entre na sua conta para pedir um preço à loja e
          acompanhar a resposta por aqui.
        </p>
        <Button onClick={onPrecisaEntrar} className="w-full">
          Entrar e pedir orçamento
        </Button>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando seu pedido…
      </div>
    );
  }

  if (erroDeLeitura) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Não deu para verificar se você já tem um pedido para este item.
          </p>
        </div>
        <Button variant="outline" onClick={carregar} className="w-full">
          Tentar de novo
        </Button>
      </div>
    );
  }

  // Sem pedido, ou com o anterior já fechado: pedir de novo é legítimo — o
  // limite da API é um EM ABERTO por produto.
  if (!pedido || !emAberto(pedido.status)) {
    return (
      <div className="space-y-4">
        {pedido && <ResumoFechado pedido={pedido} nameStore={nameStore} />}
        <div>
          <label htmlFor="mensagem-orcamento" className="block text-sm font-medium text-gray-900 mb-2">
            {pedido ? 'Pedir outro orçamento' : 'Conte o que você precisa'}
          </label>
          <Textarea
            id="mensagem-orcamento"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Medidas, material, prazo, quantidade…"
            className="min-h-[96px]"
          />
        </div>
        <Button
          onClick={enviar}
          disabled={enviando || mensagem.trim() === '' || !enterpriseId}
          className="w-full"
        >
          {enviando ? 'Enviando…' : 'Pedir orçamento'}
        </Button>
      </div>
    );
  }

  const { texto, icone: Icone } = ROTULOS[pedido.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
        <Icone className="w-4 h-4 flex-shrink-0" />
        {texto}
      </div>

      <div className="text-sm text-gray-700">
        <p className="font-medium text-gray-900">Seu pedido</p>
        <p className="whitespace-pre-wrap">{pedido.message}</p>
      </div>

      {pedido.status === 'quoted' && pedido.quoteAmount && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <p className="text-2xl font-semibold text-primary">
            {formatarPreco(pedido.quoteAmount)}
          </p>
          {pedido.quoteNote && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.quoteNote}</p>
          )}
          <div className="flex gap-3">
            <Button onClick={() => responder('aceitar')} disabled={enviando} className="flex-1">
              Aceitar
            </Button>
            <Button
              onClick={() => responder('recusar')}
              disabled={enviando}
              variant="outline"
              className="flex-1"
            >
              Recusar
            </Button>
          </div>
        </div>
      )}

      {/* Cancelar vale enquanto o pedido está em aberto — antes ou depois da
          cotação. Fica secundário, longe dos botões de resposta, para não ser
          clicado no lugar de "Recusar". */}
      <Button
        variant="ghost"
        onClick={() => responder('cancelar')}
        disabled={enviando}
        className="text-sm text-gray-600"
      >
        Cancelar pedido
      </Button>

      <p className="text-sm text-gray-600">
        Todos os seus pedidos ficam em{' '}
        <Link href={`/${nameStore}/orcamentos`} className="underline">
          Meus orçamentos
        </Link>
        .
      </p>
    </div>
  );
}

// ResumoFechado explica por que o formulário voltou: o pedido anterior
// terminou, e como terminou.
function ResumoFechado({ pedido, nameStore }: { pedido: BudgetRequest; nameStore: string }) {
  const { texto } = ROTULOS[pedido.status];
  return (
    <div className="rounded-lg border bg-white p-4 text-sm">
      <p className="font-medium text-gray-900">{texto}</p>
      {pedido.quoteAmount && (
        <p className="text-gray-700">Valor orçado: {formatarPreco(pedido.quoteAmount)}</p>
      )}
      {pedido.closedNote && <p className="text-gray-700">Motivo: {pedido.closedNote}</p>}
      <Link href={`/${nameStore}/orcamentos`} className="underline text-gray-600">
        Ver meus orçamentos
      </Link>
    </div>
  );
}
