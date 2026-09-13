'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import { atom, useAtomValue, useSetAtom, type Setter } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import {
  addCartItem,
  clearCart,
  getCart,
  mergeCart,
  removeCartItem,
  setCartItemQuantity,
} from '@/api/cart';
import { authAtom } from '@/store/auth';
import { valorEfetivo } from '@/lib/price';
import type { Cart, CartItem, CartLine, DroppedLine, Price } from '@/types/catalog';

// ---------------------------------------------------------------------------
// O ciclo do carrinho
//
// Quatro estados, e é o login que muda entre eles:
//
// 1. Anônimo — tudo em `localCartsAtom`, nenhuma chamada à API.
// 2. Ao entrar na conta — UMA chamada a `mergeCart` com o conteúdo local; a
//    resposta vira o estado, o local é limpo e `dropped` vira aviso.
// 3. Autenticado — cada alteração chama a API e a resposta vira o estado.
// 4. Ao sair — o local volta a valer, e o do servidor continua no servidor.
//
// Dinheiro é sempre `string` e nunca passa por aritmética aqui: `lineTotal` e
// `total` vêm calculados do servidor. Enquanto anônimo não existe total —
// somar `effectiveValue` × quantidade no navegador é exatamente o que esta
// fatia existe para eliminar.
// ---------------------------------------------------------------------------

/** Espelha domain.CartMinQuantity / domain.CartMaxQuantity. */
export const QUANTIDADE_MINIMA = 1;
export const QUANTIDADE_MAXIMA = 99;

function limitarQuantidade(q: number): number {
  if (q < QUANTIDADE_MINIMA) return QUANTIDADE_MINIMA;
  if (q > QUANTIDADE_MAXIMA) return QUANTIDADE_MAXIMA;
  return Math.trunc(q);
}

/** O resumo de produto que a linha do carrinho carrega (cartProductDTO). */
export type ResumoDeProduto = CartItem['product'];

/**
 * Uma linha do carrinho local. Além dos três campos que vão para a mesclagem
 * (`productId`, `priceId`, `quantity`), guarda o suficiente de produto e de
 * preço para desenhar a tela sem rede: enquanto anônimo não há requisição
 * nenhuma para buscar título, imagem ou valor.
 */
export interface LocalCartLine {
  productId: string;
  priceId: string;
  quantity: number;
  product: ResumoDeProduto;
  price: Price;
}

/** Só os três campos do contrato sobem na mesclagem. */
function paraCartLine(l: LocalCartLine): CartLine {
  return { productId: l.productId, priceId: l.priceId, quantity: l.quantity };
}

/**
 * A linha como a tela desenha, venha ela do servidor ou do armazenamento
 * local. `itemId` é nulo enquanto anônimo (o item ainda não existe no
 * servidor) e `lineTotal` é nulo pelo mesmo motivo: o valor de linha é
 * calculado pelo servidor.
 */
export interface LinhaDoCarrinho {
  chave: string;
  itemId: string | null;
  quantity: number;
  product: ResumoDeProduto;
  price: Price;
  effectiveValue: string;
  lineTotal: string | null;
  /** Produto que ficou indisponível depois de entrar no carrinho. Não entra
   *  no total do servidor. */
  foraDoCardapio: boolean;
}

/** Lista vazia estável, para o hook não devolver um array novo a cada render. */
const SEM_DESCARTES: DescarteExibido[] = [];

/** Um descarte da mesclagem, já com o título que o cliente reconhece. */
export interface DescarteExibido {
  productId: string;
  priceId: string;
  /** A união do contrato, não texto livre: com ela o compilador cobra uma
   *  tradução nova quando o servidor passar a descartar por outro motivo. */
  reason: DroppedLine['reason'];
  titulo: string | null;
}

const TEXTO_DO_DESCARTE: Record<DroppedLine['reason'], string> = {
  'produto-inativo': 'saiu do cardápio da loja',
  'produto-de-outra-empresa': 'não pertence a esta loja',
  'preco-inexistente': 'a opção de preço escolhida não existe mais',
};

/** Traduz o motivo do descarte para texto que o cliente entende. */
export function textoDoDescarte(reason: DroppedLine['reason']): string {
  return TEXTO_DO_DESCARTE[reason];
}

function chaveDaLinha(productId: string, priceId: string): string {
  return `${productId}::${priceId}`;
}

// --- Estado ----------------------------------------------------------------

const CHAVE_LOCAL = 'cart-local';

/**
 * Os carrinhos enquanto anônimo, um por empresa. A separação por empresa não
 * é enfeite: o carrinho de uma loja não pode aparecer na vitrine de outra, e
 * mandar as linhas da loja A na mesclagem da loja B faria o servidor
 * descartar todas por "produto-de-outra-empresa".
 */
const localCartsAtom = atomWithStorage<Record<string, LocalCartLine[]>>(
  CHAVE_LOCAL,
  {},
  undefined,
  { getOnInit: true },
);

type MapaLocal = Record<string, LocalCartLine[]>;

/** Lê o mapa direto do armazenamento, sem passar pela cópia em memória. */
function lerMapaCru(): MapaLocal {
  if (typeof window === 'undefined') return {};
  try {
    const cru = localStorage.getItem(CHAVE_LOCAL);
    return cru ? (JSON.parse(cru) as MapaLocal) : {};
  } catch {
    return {};
  }
}

function gravarMapaCru(mapa: MapaLocal) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(mapa));
  } catch {
    // Armazenamento cheio ou bloqueado: o estado em memória ainda vale para
    // esta aba, e não há o que fazer além de seguir.
  }
}

/**
 * A trava entre abas, quando o navegador oferece uma.
 *
 * Ler o armazenamento e gravá-lo de volta não é atômico entre abas: elas
 * podem estar em processos diferentes, e as duas leem antes de qualquer uma
 * escrever. Medido no navegador, é o que acontece — entrar na conta com duas
 * abas da mesma loja abertas dispara a mesclagem nas duas ao mesmo tempo, as
 * duas mandam a mesma lista, e como a mesclagem soma, o carrinho dobra em
 * silêncio. `navigator.locks` serializa isso de verdade: a segunda aba
 * espera, encontra o local vazio e cai na leitura simples.
 *
 * **`navigator.locks` exige contexto seguro.** Em qualquer origem sem TLS que
 * não seja o próprio `localhost` a API simplesmente não existe. O caso mais
 * provável no ramo não é homologação sem certificado nem navegador antigo: é
 * o **navegador embutido de aplicativo** — o que abre quando o cliente toca
 * no link do cardápio dentro do WhatsApp, do Instagram ou do Facebook, que é
 * exatamente como o cliente de uma cafeteria chega aqui. Alguns desses não
 * expõem `navigator.locks` mesmo sob HTTPS.
 *
 * Ver `sincronizarAtom`: sem trava, não se mescla — e o cliente é avisado de
 * que os itens que ele montou antes de entrar continuam guardados, em vez de
 * ficarem invisíveis sem explicação.
 */
function travaEntreAbas(): LockManager | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.locks ?? null;
}

/**
 * Tira as linhas locais desta empresa do armazenamento e devolve.
 *
 * Síncrono e direto no `localStorage` de propósito: é o único ponto que todas
 * as abas da mesma origem enxergam. Chamado sempre dentro da trava acima —
 * sozinho, ele não basta.
 */
function reivindicarLinhasLocais(enterpriseId: string): LocalCartLine[] {
  const mapa = lerMapaCru();
  const linhas = mapa[enterpriseId] ?? [];
  if (linhas.length > 0) gravarMapaCru({ ...mapa, [enterpriseId]: [] });
  return linhas;
}

/** Devolve ao armazenamento linhas reivindicadas cuja mesclagem falhou. Some
 *  com o que tiver entrado no meio-tempo, em vez de sobrescrever. */
function devolverLinhasLocais(enterpriseId: string, linhas: LocalCartLine[]) {
  const mapa = lerMapaCru();
  const atuais = [...(mapa[enterpriseId] ?? [])];
  for (const linha of linhas) {
    const i = atuais.findIndex(
      (l) => l.productId === linha.productId && l.priceId === linha.priceId,
    );
    if (i >= 0) {
      atuais[i] = {
        ...atuais[i],
        quantity: limitarQuantidade(atuais[i].quantity + linha.quantity),
      };
    } else {
      atuais.push(linha);
    }
  }
  gravarMapaCru({ ...mapa, [enterpriseId]: atuais });
}

/**
 * Os carrinhos vindos do servidor, depois do login — **um por empresa**, como
 * o local.
 *
 * Um carrinho global só valia enquanto a vitrine não mudasse de loja. Como o
 * registro de sincronizações é por empresa e nunca é invalidado, ir da loja A
 * para a B e voltar para a A encontrava a promessa antiga de A já resolvida e
 * devolvia sem requisição nenhuma — só que o carrinho em memória era o de B, a
 * guarda de empresa derrubava tudo, e a loja A aparecia vazia com itens no
 * servidor. Guardando por empresa, a volta reencontra o carrinho de A.
 */
const serverCartsAtom = atom<Record<string, Cart>>({});

function gravarCarrinho(set: Setter, enterpriseId: string, cart: Cart) {
  set(serverCartsAtom, (mapa) => ({ ...mapa, [enterpriseId]: cart }));
}

/**
 * O que a última mesclagem descartou, para avisar o cliente uma vez —
 * **por empresa**, como o carrinho.
 *
 * Guardado na sessão da aba, não só em memória: a mesclagem acontece na tela
 * da loja e o aviso aparece na do carrinho. Se o cliente chegar lá por um
 * recarregamento em vez de um clique, um átomo só de memória já teria perdido
 * o aviso — e o carrinho teria encolhido em silêncio, que é justamente o que
 * `dropped` existe para evitar. Sai quando o cliente dispensa.
 *
 * Global, ele vazava nos dois sentidos: o aviso da loja A aparecia na tela do
 * carrinho da loja B, e a mesclagem de B sobrescrevia com lista vazia um aviso
 * de A que o cliente ainda não tinha lido — o mesmo encolhimento silencioso
 * que o campo existe para impedir.
 */
/**
 * `sessionStorage` não existe na renderização de servidor, e `getOnInit` lê já
 * na criação do átomo: sem esta guarda a página inteira quebra antes de
 * chegar ao navegador.
 */
function armazenamentoDaSessao<T>() {
  return createJSONStorage<T>(() =>
    typeof window === 'undefined'
      ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      : sessionStorage,
  );
}

const droppedAtom = atomWithStorage<Record<string, DescarteExibido[]>>(
  'cart-dropped',
  {},
  armazenamentoDaSessao<Record<string, DescarteExibido[]>>(),
  { getOnInit: true },
);

/**
 * Empresas cujo carrinho anônimo NÃO subiu, por falta da trava entre abas —
 * por empresa, como o carrinho e o aviso de descarte.
 *
 * A decisão de não mesclar sem trava está certa e não muda (ver
 * `sincronizarAtom`). O que faltava era o cliente ficar sabendo: ele entra na
 * conta, o carrinho anônimo não sobe, as linhas continuam guardadas em
 * `localCartsAtom` — e invisíveis, porque autenticado a tela lê o carrinho do
 * servidor — e nada na tela dizia isso. Um carrinho que encolhe em silêncio é
 * exatamente o que `dropped` existe para impedir; este ramo produzia o mesmo
 * sintoma por outro caminho.
 *
 * Na sessão da aba pelo mesmo motivo do aviso de descarte: a sincronização
 * acontece na tela da loja e o aviso aparece na do carrinho.
 */
const naoMescladoAtom = atomWithStorage<Record<string, boolean>>(
  'cart-nao-mesclado',
  {},
  armazenamentoDaSessao<Record<string, boolean>>(),
  { getOnInit: true },
);

/**
 * Contagem de itens para os indicadores (cabeçalho e barra inferior). Fica em
 * átomo próprio porque a barra inferior conhece só o slug da loja, não o id
 * da empresa — quem tem o id escreve aqui.
 */
export const cartCountAtom = atom<number>(0);

// --- Sincronização ao entrar na conta --------------------------------------

/**
 * Mesclagens/leituras já feitas nesta sessão de página, por empresa.
 *
 * Vive fora do jotai de propósito: a mesclagem **não é idempotente** (mandar
 * a mesma lista duas vezes soma duas vezes), e um efeito do React remontado —
 * modo estrito em desenvolvimento, navegação entre telas da mesma loja —
 * dispararia a segunda chamada antes de qualquer estado reativo ter mudado.
 * Um registro no módulo é a única barreira que sobrevive a isso.
 */
const sincronizacoes = new Map<string, Promise<void>>();

/**
 * Gerações de mutação, por empresa. Uma leitura lenta (o GET de entrada) não
 * pode sobrescrever o carrinho que uma alteração posterior já devolveu — e
 * uma alteração na loja A não tem por que cancelar a leitura da loja B.
 */
const geracoes = new Map<string, number>();

function geracaoDe(enterpriseId: string): number {
  return geracoes.get(enterpriseId) ?? 0;
}

/** Marca uma mutação desta empresa, invalidando leituras em voo. */
function novaGeracao(enterpriseId: string): number {
  const n = geracaoDe(enterpriseId) + 1;
  geracoes.set(enterpriseId, n);
  return n;
}

function esquecerSincronizacoes() {
  sincronizacoes.clear();
}

function descrever(dropped: DroppedLine[], locais: LocalCartLine[]): DescarteExibido[] {
  return dropped.map((d) => {
    const origem = locais.find(
      (l) => l.productId === d.productId && l.priceId === d.priceId,
    );
    return {
      productId: d.productId,
      priceId: d.priceId,
      reason: d.reason,
      titulo: origem?.product.title ?? null,
    };
  });
}

/**
 * Põe o carrinho do servidor no estado, uma vez por empresa por sessão de
 * página.
 *
 * Com carrinho local, sobe tudo numa mesclagem e **limpa o local logo depois
 * que ela responde** — é isso, e não outra coisa, que impede a soma repetida.
 * Sem carrinho local não há o que mesclar: uma leitura simples basta e evita
 * um POST que só existiria para mandar uma lista vazia.
 *
 * **Sem trava entre abas, não se mescla**: cai na leitura simples. A
 * mesclagem soma de propósito, e sem `navigator.locks` (contexto não seguro,
 * navegador antigo) duas abas mandam a mesma lista e o carrinho do cliente
 * dobra em silêncio. Perder uma vez o carrinho anônimo é visível e
 * explicável; dobrar o carrinho do cliente é silencioso e errado.
 */
const sincronizarAtom = atom(null, (_get, set, enterpriseId: string): Promise<void> => {
  const emCurso = sincronizacoes.get(enterpriseId);
  if (emCurso) return emCurso;

  const ler = async () => {
    const minhaGeracao = geracaoDe(enterpriseId);
    const cart = await getCart(enterpriseId);
    if (geracaoDe(enterpriseId) === minhaGeracao) gravarCarrinho(set, enterpriseId, cart);
  };

  const mesclarOuLer = async () => {
    // A reivindicação já esvazia o local: o que sobe para o servidor sai
    // daqui no mesmo instante, antes da requisição, e não há segunda lista
    // para ninguém mandar de novo.
    const locais = reivindicarLinhasLocais(enterpriseId);
    set(localCartsAtom, lerMapaCru());

    if (locais.length === 0) return ler();

    const minhaGeracao = geracaoDe(enterpriseId);
    let resultado;
    try {
      resultado = await mergeCart(enterpriseId, locais.map(paraCartLine));
    } catch (e) {
      // A mesclagem não aconteceu: as linhas voltam para o local em vez de
      // sumirem entre o armazenamento e o servidor.
      devolverLinhasLocais(enterpriseId, locais);
      set(localCartsAtom, lerMapaCru());
      throw e;
    }
    if (geracaoDe(enterpriseId) === minhaGeracao) {
      const descartes = descrever(resultado.dropped, locais);
      set(droppedAtom, (mapa) => ({ ...mapa, [enterpriseId]: descartes }));
      gravarCarrinho(set, enterpriseId, resultado.cart);
    }
  };

  const trava = travaEntreAbas();
  let promessa: Promise<void>;
  if (trava) {
    // Com trava, a mesclagem acontece: um aviso de sincronização anterior
    // (outra aba, outro navegador na mesma sessão) deixa de valer aqui. Sem
    // esta limpeza ele sobreviveria na sessão e diria ao cliente que os
    // itens não subiram depois de eles terem subido.
    set(naoMescladoAtom, (mapa) => ({ ...mapa, [enterpriseId]: false }));
    promessa = trava.request(`carrinho:${enterpriseId}`, mesclarOuLer) as Promise<void>;
  } else {
    // Sem trava, só leitura — e o cliente é avisado quando havia algo local
    // para subir, em vez de as linhas ficarem guardadas e invisíveis. A
    // marca é gravada antes da leitura porque não depende dela: o que ela
    // registra é a decisão de não mesclar, que já está tomada aqui.
    const locais = lerMapaCru()[enterpriseId] ?? [];
    set(naoMescladoAtom, (mapa) => ({ ...mapa, [enterpriseId]: locais.length > 0 }));
    promessa = ler();
  }

  // Uma falha não pode marcar a empresa como sincronizada: sem isto, uma
  // queda de rede no login deixaria o carrinho local preso para sempre.
  promessa.catch(() => sincronizacoes.delete(enterpriseId));
  sincronizacoes.set(enterpriseId, promessa);
  return promessa;
});

/** Ao sair: o do servidor sai da tela (continua no servidor) e o registro de
 *  sincronização zera, para o próximo login mesclar de novo. */
const aoSairAtom = atom(null, (_get, set) => {
  esquecerSincronizacoes();
  set(serverCartsAtom, {});
  set(droppedAtom, {});
  // Deslogado, as linhas locais voltam a aparecer sozinhas: o aviso de que
  // elas não subiram deixa de ter o que avisar.
  set(naoMescladoAtom, {});
});

// --- Ações -----------------------------------------------------------------

/**
 * A adição foi recusada porque o carrinho do servidor não está em mãos.
 * Recusar é o ponto: sem o carrinho não há como saber a quantidade nova, e
 * chutar uma encolhe o carrinho do cliente.
 */
export class CarrinhoNaoCarregado extends Error {
  /** A falha original da leitura, quando houve uma. (`Error.cause` pede
   *  lib ES2022, que este projeto não usa.) */
  readonly causa?: unknown;

  constructor(mensagem: string, causa?: unknown) {
    super(mensagem);
    this.name = 'CarrinhoNaoCarregado';
    this.causa = causa;
  }
}

interface ArgsDeAdicao {
  enterpriseId: string;
  linha: LocalCartLine;
}

/** O que a adição de fato deixou no carrinho, para a tela dizer a verdade. */
export interface ResultadoDaAdicao {
  /** A quantidade daquela linha depois da adição. Autenticado, é a que o
   *  servidor devolveu — não a que o navegador pediu. */
  quantidade: number;
  /** O total do servidor, como veio. Nulo enquanto anônimo. */
  total: string | null;
}

/**
 * Adiciona (ou soma) uma linha. Autenticado vai ao servidor; anônimo fica no
 * armazenamento local, sem tocar na rede.
 *
 * A soma é feita aqui, no cliente, também no caminho autenticado: o servidor
 * faz *upsert* com a quantidade recebida (cart_repo.go, `Upsert` com
 * `DoUpdates quantity = line.Quantity`), então mandar 1 para um item que já
 * está com 3 no carrinho **reduziria** a quantidade em vez de somar.
 *
 * É justamente por isso que o caminho autenticado **espera a sincronização
 * daquela empresa antes de somar**, e recusa a operação se ela falhou. Um
 * padrão de zero para "não achei a linha" tratava três situações como a mesma
 * coisa: o item não está no carrinho, o carrinho ainda não carregou, e o
 * carregamento falhou. Nos dois últimos casos saía `quantity: 1` para um item
 * que estava com 4, o upsert substituía, e o carrinho encolhia de N para um —
 * com a tela dizendo que o produto tinha sido adicionado.
 */
const adicionarAtom = atom(
  null,
  async (get, set, args: ArgsDeAdicao): Promise<ResultadoDaAdicao> => {
    const { enterpriseId, linha } = args;
    const autenticado = get(authAtom).isAuthenticated;

    if (!autenticado) {
      let quantidadeFinal = limitarQuantidade(linha.quantity);
      set(localCartsAtom, (mapa) => {
        const atuais = mapa[enterpriseId] ?? [];
        const existente = atuais.find(
          (l) => l.productId === linha.productId && l.priceId === linha.priceId,
        );
        if (existente) {
          quantidadeFinal = limitarQuantidade(existente.quantity + linha.quantity);
        }
        const proximas = existente
          ? atuais.map((l) =>
              l === existente ? { ...l, quantity: quantidadeFinal } : l,
            )
          : [...atuais, { ...linha, quantity: quantidadeFinal }];
        return { ...mapa, [enterpriseId]: proximas };
      });
      // Anônimo não tem total: quem calcula dinheiro é o servidor.
      return { quantidade: quantidadeFinal, total: null };
    }

    // Esperar a sincronização desta empresa, aproveitando o registro de
    // promessas: se já houve uma, esta linha não custa requisição nenhuma; se
    // ela falhou, o registro já apagou a entrada e uma nova tentativa sai
    // daqui. Se falhar de novo, o erro sobe e a adição **não acontece**.
    try {
      await set(sincronizarAtom, enterpriseId);
    } catch (e) {
      throw new CarrinhoNaoCarregado(
        'não foi possível ler o carrinho desta loja antes de adicionar',
        e,
      );
    }

    const atual = get(serverCartsAtom)[enterpriseId];
    if (!atual) {
      // A sincronização resolveu sem deixar carrinho (uma mutação mais nova
      // invalidou a leitura, por exemplo). Mandar uma quantidade derivada do
      // nada é o que encolhia o carrinho: melhor recusar.
      throw new CarrinhoNaoCarregado('o carrinho desta loja não está carregado');
    }

    const jaNoCarrinho = atual.items.find(
      (i) => i.product.id === linha.productId && i.price.id === linha.priceId,
    );
    const quantidade = limitarQuantidade((jaNoCarrinho?.quantity ?? 0) + linha.quantity);

    novaGeracao(enterpriseId);
    const cart = await addCartItem(enterpriseId, {
      productId: linha.productId,
      priceId: linha.priceId,
      quantity: quantidade,
    });
    gravarCarrinho(set, enterpriseId, cart);

    // A mensagem de sucesso sai do que voltou do servidor, não do que o
    // navegador pediu.
    const gravada = cart.items.find(
      (i) => i.product.id === linha.productId && i.price.id === linha.priceId,
    );
    return { quantidade: gravada?.quantity ?? quantidade, total: cart.total };
  },
);

interface ArgsDeQuantidade {
  enterpriseId: string;
  linha: LinhaDoCarrinho;
  quantidade: number;
}

/** Altera a quantidade de uma linha. Autenticado: a resposta da API vira o
 *  estado. */
const alterarQuantidadeAtom = atom(
  null,
  async (get, set, { enterpriseId, linha, quantidade }: ArgsDeQuantidade) => {
    const autenticado = get(authAtom).isAuthenticated;
    const alvo = limitarQuantidade(quantidade);

    if (!autenticado) {
      set(localCartsAtom, (mapa) => ({
        ...mapa,
        [enterpriseId]: (mapa[enterpriseId] ?? []).map((l) =>
          chaveDaLinha(l.productId, l.priceId) === linha.chave
            ? { ...l, quantity: alvo }
            : l,
        ),
      }));
      return;
    }

    if (!linha.itemId) return;
    novaGeracao(enterpriseId);
    const cart = await setCartItemQuantity(enterpriseId, linha.itemId, alvo);
    gravarCarrinho(set, enterpriseId, cart);
  },
);

interface ArgsDeRemocao {
  enterpriseId: string;
  linha: LinhaDoCarrinho;
}

const removerAtom = atom(
  null,
  async (get, set, { enterpriseId, linha }: ArgsDeRemocao) => {
    const autenticado = get(authAtom).isAuthenticated;

    if (!autenticado) {
      set(localCartsAtom, (mapa) => ({
        ...mapa,
        [enterpriseId]: (mapa[enterpriseId] ?? []).filter(
          (l) => chaveDaLinha(l.productId, l.priceId) !== linha.chave,
        ),
      }));
      return;
    }

    if (!linha.itemId) return;
    novaGeracao(enterpriseId);
    const cart = await removeCartItem(enterpriseId, linha.itemId);
    gravarCarrinho(set, enterpriseId, cart);
  },
);

const esvaziarAtom = atom(null, async (get, set, enterpriseId: string) => {
  const autenticado = get(authAtom).isAuthenticated;

  if (!autenticado) {
    set(localCartsAtom, (mapa) => ({ ...mapa, [enterpriseId]: [] }));
    return;
  }

  novaGeracao(enterpriseId);
  await clearCart(enterpriseId);
  // `DELETE /users/me/carts/{id}` responde 204 sem corpo. O estado vem de uma
  // leitura, não de um carrinho vazio montado aqui: inventar `total: "0.00"`
  // seria escrever dinheiro no cliente, que é justamente o que não se faz.
  const cart = await getCart(enterpriseId);
  gravarCarrinho(set, enterpriseId, cart);
});

// --- Leitura ---------------------------------------------------------------

function linhasDoServidor(cart: Cart): LinhaDoCarrinho[] {
  return cart.items.map((item) => ({
    chave: item.id,
    itemId: item.id,
    quantity: item.quantity,
    product: item.product,
    price: item.price,
    effectiveValue: item.effectiveValue,
    lineTotal: item.lineTotal,
    foraDoCardapio: item.product.status === 'inactive',
  }));
}

function linhasLocais(linhas: LocalCartLine[]): LinhaDoCarrinho[] {
  return linhas.map((l) => ({
    chave: chaveDaLinha(l.productId, l.priceId),
    itemId: null,
    quantity: l.quantity,
    product: l.product,
    price: l.price,
    effectiveValue: valorEfetivo(l.price),
    // Sem servidor não há valor de linha: multiplicar preço por quantidade
    // no navegador é a aritmética que esta fatia proíbe.
    lineTotal: null,
    foraDoCardapio: l.product.status === 'inactive',
  }));
}

export interface EstadoDoCarrinho {
  linhas: LinhaDoCarrinho[];
  /** O total do servidor, como veio. Nulo enquanto anônimo. */
  total: string | null;
  contagem: number;
  autenticado: boolean;
  carregando: boolean;
  /** A leitura do carrinho do servidor falhou. */
  erro: boolean;
  /**
   * O carrinho desta empresa está em mãos e pode receber uma adição.
   * Enquanto anônimo é sempre verdade — não há o que carregar. Autenticado,
   * só depois que o carrinho do servidor chegou: adicionar antes disso
   * mandaria uma quantidade derivada de um carrinho que não existe.
   */
  pronto: boolean;
  descartes: DescarteExibido[];
  dispensarDescartes: () => void;
  /** O carrinho anônimo desta loja não subiu no login: este navegador não
   *  oferece a trava entre abas. As linhas continuam guardadas. */
  naoMesclado: boolean;
  dispensarNaoMesclado: () => void;
  recarregar: () => void;
  adicionar: (linha: LocalCartLine) => Promise<ResultadoDaAdicao>;
  alterarQuantidade: (linha: LinhaDoCarrinho, quantidade: number) => Promise<void>;
  remover: (linha: LinhaDoCarrinho) => Promise<void>;
  esvaziar: () => Promise<void>;
}

/**
 * O carrinho da empresa dada, com as ações que o alteram. Chamado por quem
 * conhece o id da empresa (a grade, o detalhe do produto e a tela do
 * carrinho).
 */
export function useCarrinho(enterpriseId: string | null | undefined): EstadoDoCarrinho {
  const autenticado = useAtomValue(authAtom).isAuthenticated;
  const carrinhosDoServidor = useAtomValue(serverCartsAtom);
  const carrinhoDoServidor = enterpriseId ? carrinhosDoServidor[enterpriseId] ?? null : null;
  const mapaLocal = useAtomValue(localCartsAtom);
  const mapaDeDescartes = useAtomValue(droppedAtom);
  const descartes =
    (enterpriseId ? mapaDeDescartes[enterpriseId] : undefined) ?? SEM_DESCARTES;
  const definirDescartes = useSetAtom(droppedAtom);
  const mapaNaoMesclado = useAtomValue(naoMescladoAtom);
  const definirNaoMesclado = useSetAtom(naoMescladoAtom);
  // Só faz sentido autenticado: deslogado as linhas locais voltam à tela e
  // não há nada de invisível para avisar.
  const naoMesclado =
    autenticado && !!enterpriseId && !!mapaNaoMesclado[enterpriseId];
  const definirContagem = useSetAtom(cartCountAtom);

  const sincronizar = useSetAtom(sincronizarAtom);
  const aoSair = useSetAtom(aoSairAtom);
  const adicionarLinha = useSetAtom(adicionarAtom);
  const alterar = useSetAtom(alterarQuantidadeAtom);
  const removerLinha = useSetAtom(removerAtom);
  const esvaziarTudo = useSetAtom(esvaziarAtom);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!autenticado) {
      // O local volta a valer; o do servidor continua lá e reaparece no
      // próximo login.
      aoSair();
      setErro(false);
      setCarregando(false);
      return;
    }
    if (!enterpriseId) return;

    let vivo = true;
    setCarregando(true);
    setErro(false);
    sincronizar(enterpriseId)
      .catch(() => {
        if (vivo) setErro(true);
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [autenticado, enterpriseId, sincronizar, aoSair, tentativa]);

  const linhas = useMemo(() => {
    if (!enterpriseId) return [];
    // O mapa já é endereçado pelo id da empresa; não há carrinho de outra
    // loja para vazar para esta.
    if (autenticado) {
      return carrinhoDoServidor ? linhasDoServidor(carrinhoDoServidor) : [];
    }
    return linhasLocais(mapaLocal[enterpriseId] ?? []);
  }, [autenticado, carrinhoDoServidor, mapaLocal, enterpriseId]);

  // O total é sempre o do servidor, como veio. Enquanto anônimo não há total:
  // somar as linhas na tela ignoraria a regra de produto fora do cardápio e
  // seria aritmética de dinheiro no navegador.
  const total = autenticado && carrinhoDoServidor ? carrinhoDoServidor.total : null;
  const pronto = !!enterpriseId && (!autenticado || !!carrinhoDoServidor);

  // O selo conta só o que entra no total: a linha fora do cardápio é a que a
  // própria tela manda remover para seguir com o pedido, e contá-la faria o
  // indicador prometer um item que o pedido não leva.
  const contagem = useMemo(
    () => linhas.filter((l) => !l.foraDoCardapio).length,
    [linhas],
  );

  useEffect(() => {
    if (!enterpriseId) return;
    definirContagem(contagem);
  }, [contagem, enterpriseId, definirContagem]);

  const exigirEmpresa = useCallback(() => {
    if (!enterpriseId) throw new Error('carrinho sem empresa resolvida');
    return enterpriseId;
  }, [enterpriseId]);

  return {
    linhas,
    total,
    contagem,
    autenticado,
    carregando,
    erro,
    pronto,
    descartes,
    dispensarDescartes: useCallback(() => {
      if (!enterpriseId) return;
      definirDescartes((mapa) => ({ ...mapa, [enterpriseId]: [] }));
    }, [definirDescartes, enterpriseId]),
    naoMesclado,
    dispensarNaoMesclado: useCallback(() => {
      if (!enterpriseId) return;
      definirNaoMesclado((mapa) => ({ ...mapa, [enterpriseId]: false }));
    }, [definirNaoMesclado, enterpriseId]),
    recarregar: useCallback(() => {
      if (enterpriseId) sincronizacoes.delete(enterpriseId);
      setTentativa((n) => n + 1);
    }, [enterpriseId]),
    adicionar: useCallback(
      (linha: LocalCartLine) => adicionarLinha({ enterpriseId: exigirEmpresa(), linha }),
      [adicionarLinha, exigirEmpresa],
    ),
    alterarQuantidade: useCallback(
      (linha: LinhaDoCarrinho, quantidade: number) =>
        alterar({ enterpriseId: exigirEmpresa(), linha, quantidade }),
      [alterar, exigirEmpresa],
    ),
    remover: useCallback(
      (linha: LinhaDoCarrinho) => removerLinha({ enterpriseId: exigirEmpresa(), linha }),
      [removerLinha, exigirEmpresa],
    ),
    esvaziar: useCallback(
      () => esvaziarTudo(exigirEmpresa()),
      [esvaziarTudo, exigirEmpresa],
    ),
  };
}
