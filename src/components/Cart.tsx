'use client'

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  MessageCircle,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { formatarPreco } from '@/lib/price';
import {
  linkDoWhatsApp,
  linhasDoPedido,
  montarMensagemDoPedido,
  telefoneDeWhatsApp,
} from '@/lib/pedido';
import {
  QUANTIDADE_MAXIMA,
  QUANTIDADE_MINIMA,
  textoDoDescarte,
  type DescarteExibido,
  type EstadoDoCarrinho,
  type LinhaDoCarrinho,
} from '@/store/cart';
import type { Enterprise } from '@/types/catalog';

/**
 * A moldura dos avisos do carrinho: faixa âmbar, ícone, título, corpo e o X
 * que dispensa. Duas situações diferentes a usam — o que a mesclagem
 * descartou e o que não chegou a ser mesclado — e as duas dizem ao cliente a
 * mesma classe de coisa: o carrinho não é bem o que ele deixou.
 */
const AvisoDoCarrinho: React.FC<{
  titulo: string;
  onDispensar: () => void;
  children?: React.ReactNode;
}> = ({ titulo, onDispensar, children }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-medium text-amber-900">{titulo}</p>
      {children}
    </div>
    <button
      type="button"
      onClick={onDispensar}
      aria-label="Dispensar aviso"
      className="text-amber-700 hover:text-amber-900"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

/**
 * Aviso do que a mesclagem descartou.
 *
 * `dropped` existe para o carrinho não encolher em silêncio ao entrar na
 * conta: sem este aviso, o cliente monta um carrinho anônimo, faz login e
 * simplesmente vê menos itens do que tinha. Um aviso só, listando cada linha
 * com o motivo traduzido.
 */
export const AvisoDeDescarte: React.FC<{
  descartes: DescarteExibido[];
  onDispensar: () => void;
}> = ({ descartes, onDispensar }) => {
  if (descartes.length === 0) return null;

  return (
    <AvisoDoCarrinho
      onDispensar={onDispensar}
      titulo={
        descartes.length === 1
          ? 'Um item do seu carrinho não pôde ser mantido'
          : `${descartes.length} itens do seu carrinho não puderam ser mantidos`
      }
    >
      <ul className="mt-1 space-y-1">
        {descartes.map((d) => (
          <li key={`${d.productId}::${d.priceId}`} className="text-sm text-amber-800">
            {d.titulo ? <strong>{d.titulo}</strong> : 'Um produto'}
            {' — '}
            {textoDoDescarte(d.reason)}.
          </li>
        ))}
      </ul>
    </AvisoDoCarrinho>
  );
};

/**
 * Aviso de que o carrinho anônimo não subiu no login.
 *
 * Quando o navegador não oferece a trava entre abas, a mesclagem é pulada de
 * propósito: ela soma, e duas abas mandando a mesma lista dobrariam o
 * carrinho do cliente em silêncio. A decisão está certa — o que faltava era
 * dizer isso a ele. Sem este aviso, os itens que ele montou antes de entrar
 * continuam guardados e invisíveis, e a tela não explica nada.
 */
export const AvisoDeNaoMesclado: React.FC<{
  visivel: boolean;
  onDispensar: () => void;
}> = ({ visivel, onDispensar }) => {
  if (!visivel) return null;

  return (
    <AvisoDoCarrinho
      onDispensar={onDispensar}
      titulo="Os itens que você montou antes de entrar continuam guardados"
    >
      <p className="mt-1 text-sm text-amber-800">
        Este navegador não permitiu somá-los com segurança ao carrinho da sua
        conta, então eles não foram somados — e nenhum foi perdido. Você pode
        adicioná-los de novo aqui, ou abrir a loja no navegador do seu
        celular para encontrá-los.
      </p>
    </AvisoDoCarrinho>
  );
};

const ItemDoCarrinho: React.FC<{
  linha: LinhaDoCarrinho;
  ocupado: boolean;
  onAlterar: (quantidade: number) => void;
  onRemover: () => void;
}> = ({ linha, ocupado, onAlterar, onRemover }) => (
  <li
    className={`flex gap-3 py-4 ${linha.foraDoCardapio ? 'opacity-60' : ''}`}
    data-testid="linha-do-carrinho"
  >
    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
      {linha.product.image ? (
        <img
          src={linha.product.image.url}
          alt={linha.product.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Tag className="w-6 h-6 text-gray-400" />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 truncate">{linha.product.title}</p>
      {linha.price.name && (
        <p className="text-xs text-gray-500">{linha.price.name}</p>
      )}
      <p className="text-sm text-gray-600">
        {formatarPreco(linha.effectiveValue)} cada
      </p>

      {linha.foraDoCardapio ? (
        <p className="mt-1 text-xs text-amber-700 flex items-start gap-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Saiu do cardápio depois de entrar no carrinho. Não entra no total —
          remova para seguir com o pedido.
        </p>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            aria-label="Diminuir quantidade"
            disabled={ocupado || linha.quantity <= QUANTIDADE_MINIMA}
            onClick={() => onAlterar(linha.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{linha.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            aria-label="Aumentar quantidade"
            disabled={ocupado || linha.quantity >= QUANTIDADE_MAXIMA}
            onClick={() => onAlterar(linha.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>

    <div className="flex flex-col items-end justify-between">
      {/* O valor de linha vem calculado do servidor. Enquanto anônimo ele não
          existe, e a tela mostra a quantidade em vez de inventar uma conta. */}
      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
        {linha.lineTotal ? formatarPreco(linha.lineTotal) : `${linha.quantity} un.`}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-400 hover:text-red-600"
        aria-label="Remover item"
        disabled={ocupado}
        onClick={onRemover}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </li>
);

/** Lista de itens, aviso de descarte e total. Usada pelo painel lateral e
 *  pela página do carrinho. */
export const ListaDoCarrinho: React.FC<{ carrinho: EstadoDoCarrinho }> = ({ carrinho }) => {
  const [ocupada, setOcupada] = useState<string | null>(null);

  const executar = async (chave: string, acao: () => Promise<void>, erro: string) => {
    try {
      setOcupada(chave);
      await acao();
    } catch (e) {
      console.error(erro, e);
      toast.error(erro);
    } finally {
      setOcupada(null);
    }
  };

  if (carrinho.carregando && carrinho.linhas.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (carrinho.erro && carrinho.linhas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Não foi possível carregar o carrinho
        </h3>
        <p className="text-gray-600 max-w-sm mb-6">
          Houve uma falha ao falar com o servidor. Seus itens continuam na sua
          conta.
        </p>
        <Button onClick={carrinho.recarregar}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <AvisoDeDescarte
        descartes={carrinho.descartes}
        onDispensar={carrinho.dispensarDescartes}
      />

      <AvisoDeNaoMesclado
        visivel={carrinho.naoMesclado}
        onDispensar={carrinho.dispensarNaoMesclado}
      />

      {carrinho.linhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
          <p className="text-gray-600 max-w-sm">
            Escolha um produto no cardápio para começar o seu pedido.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {carrinho.linhas.map((linha) => (
              <ItemDoCarrinho
                key={linha.chave}
                linha={linha}
                ocupado={ocupada === linha.chave}
                onAlterar={(quantidade) =>
                  executar(
                    linha.chave,
                    () => carrinho.alterarQuantidade(linha, quantidade),
                    'Não foi possível alterar a quantidade.',
                  )
                }
                onRemover={() =>
                  executar(
                    linha.chave,
                    () => carrinho.remover(linha),
                    'Não foi possível remover o item.',
                  )
                }
              />
            ))}
          </ul>

          <div className="border-t pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              {/* Sempre o total do servidor, nunca a soma das linhas na tela:
                  produto fora do cardápio tem valor de linha e mesmo assim
                  não entra no total. */}
              <span className="text-lg font-bold text-primary">
                {carrinho.total ? formatarPreco(carrinho.total) : '—'}
              </span>
            </div>
            {!carrinho.total && (
              <p className="text-xs text-gray-500">
                O total é calculado pela loja quando você entra na sua conta.
                Até lá, o pedido vai com as quantidades e os valores unitários.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Botão de enviar o pedido pelo WhatsApp.
 *
 * Não exige login: o pedido não é gravado em lugar nenhum, e pedir cadastro
 * para abrir uma conversa era atrito sem contrapartida. Continua bloqueado
 * com a loja fechada — aí o pedido não teria para onde ir.
 */
export const EnviarPedido: React.FC<{
  carrinho: EstadoDoCarrinho;
  enterprise: Enterprise | null;
  aberta: boolean;
  name_store: string;
}> = ({ carrinho, enterprise, aberta, name_store }) => {
  const itens = linhasDoPedido(carrinho.linhas);
  const telefone = telefoneDeWhatsApp(enterprise?.phones);
  const bloqueado = !aberta || itens.length === 0 || !telefone;

  const enviar = () => {
    if (!telefone) return;
    const mensagem = montarMensagemDoPedido({
      linhas: carrinho.linhas,
      total: carrinho.total,
      // O cardápio da loja, não a página de onde o cliente mandou: enviada
      // da tela do carrinho, `window.location.href` apontava para o carrinho
      // de quem mandou, que não abre para mais ninguém.
      urlDaLoja:
        typeof window !== 'undefined' ? `${window.location.origin}/${name_store}` : '',
    });
    if (typeof window !== 'undefined') {
      window.open(linkDoWhatsApp(telefone, mensagem), '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={enviar}
        disabled={bloqueado}
        className="w-full text-white"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        Enviar pedido pelo WhatsApp
      </Button>
      {!aberta && (
        <p className="text-xs text-gray-600 text-center">
          A loja está fechada agora. O pedido pode ser enviado quando ela
          reabrir.
        </p>
      )}
      {aberta && !telefone && (
        <p className="text-xs text-gray-600 text-center">
          Esta loja não cadastrou um número de WhatsApp.
        </p>
      )}
    </div>
  );
};

/**
 * Painel lateral do carrinho, na grade de produtos. A página completa fica em
 * `/{loja}/cart`.
 */
export const Cart: React.FC<{
  carrinho: EstadoDoCarrinho;
  enterprise: Enterprise | null;
  aberta: boolean;
  name_store: string;
}> = ({ carrinho, enterprise, aberta, name_store }) => (
  <div className="flex-1 min-h-0 flex flex-col">
    <div className="flex-1 overflow-y-auto">
      <ListaDoCarrinho carrinho={carrinho} />
    </div>
    <div className="border-t p-4 space-y-3">
      <EnviarPedido
        carrinho={carrinho}
        enterprise={enterprise}
        aberta={aberta}
        name_store={name_store}
      />
      <Link
        href={`/${name_store}/cart`}
        className="block text-center text-sm text-primary hover:underline"
      >
        Ver carrinho completo
      </Link>
    </div>
  </div>
);
