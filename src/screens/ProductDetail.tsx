'use client'

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, MessageCircle, ChevronLeft, ChevronRight, ShoppingCart, AlertTriangle } from 'lucide-react';
import type { Price, Product } from '@/types/catalog';
import { valorEfetivo, temPromocaoVigente, formatarPreco } from '@/lib/price';
import { api } from '@/api';
import { useAtom } from 'jotai';
import { authAtom } from '@/store/auth';
import { CarrinhoNaoCarregado, useCarrinho } from '@/store/cart';
import { useEmpresa } from '@/store/enterprise';
import { capacidadesDe, vocabularioDe } from '@/lib/vocabulario';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AuthModal from '@/components/AuthModal';
import BudgetRequestPanel from '@/components/BudgetRequestPanel';
import SchedulePanel from '@/components/SchedulePanel';
import EspacoAnuncio from '@/components/anuncios/EspacoAnuncio';
import { toast } from 'react-toastify';

/** Distingue "não existe" de "não deu para saber": 404 é produto inexistente;
 *  qualquer outra falha (rede, 500, timeout) é erro e merece tentar de novo. */
function ehNaoEncontrado(erro: unknown): boolean {
  const axiosLike = erro as { response?: { status?: number } };
  return axiosLike?.response?.status === 404;
}

const ProductDetail = () => {
  const params = useParams();
  // A rota de produto é por código, não por id.
  const code = params?.code as string;
  const name_store = params?.name_store as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Três desfechos distintos, não dois: carregando, não encontrado (404) e
  // erro de leitura. Antes, qualquer falha virava "Produto não encontrado".
  const [productNotFound, setProductNotFound] = useState(false);
  const [productError, setProductError] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [includeService, setIncludeService] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [auth] = useAtom(authAtom);
  // A empresa é pré-requisito do carrinho e do WhatsApp: sem ela o botão
  // ficava habilitado e o clique não fazia nada (a guarda retornava em
  // silêncio). A falha é visível e o botão só habilita com a empresa
  // carregada. A busca em si vem do gancho compartilhado, que lê o átomo e
  // só vai à rede quando ele está vazio — 404 e falha de leitura entram
  // juntos aqui, porque as duas deixam a tela sem os dados da loja.
  const {
    empresa: enterprise,
    naoEncontrada: lojaNaoEncontrada,
    erro: erroDaLoja,
    recarregar: recarregarLoja,
  } = useEmpresa(name_store);
  const enterpriseError = lojaNaoEncontrada || erroDaLoja;
  const [tentativa, setTentativa] = useState(0);

  // O carrinho da loja assim que a empresa é conhecida: local enquanto
  // anônimo, do servidor depois do login.
  const carrinho = useCarrinho(enterprise?.id);

  // O que esta loja tem ligado, e como ela chama as coisas.
  const caps = capacidadesDe(enterprise?.capabilities);
  const v = vocabularioDe(enterprise?.mode);

  // As marcações do produto só valem DENTRO do que a loja ligou. Um produto
  // marcado "sob orçamento" numa loja que desligou o módulo mantém a
  // marcação gravada — religar devolve tudo como estava —, mas a vitrine não
  // oferece um botão que levaria a uma tela que a loja não atende.
  const agendavel = !!product?.forSchedule && caps.appointments;
  const sobOrcamento = !!product?.isBudget && caps.budgets;

  // O título da aba acompanha a empresa assim que ela chega, venha da rede ou
  // do átomo já preenchido pela tela anterior.
  useEffect(() => {
    if (typeof window !== 'undefined' && enterprise) {
      document.title = ` loja | ${enterprise.name}`;
    }
  }, [enterprise]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setProductNotFound(false);
        setProductError(false);
        const { data } = await api.get<Product>(`/enterprises/by-slug/${name_store}/products/${code}`);
        setProduct(data);
        if (data.prices.length > 0) {
          setSelectedPrice(data.prices[0]);
        }
      } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        setProduct(null);
        if (ehNaoEncontrado(erro)) {
          setProductNotFound(true);
        } else {
          setProductError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (name_store && code) fetchProduct();
  }, [name_store, code, tentativa]);

  // A categoria vem embutida no produto (categoryRefDTO); não há mais
  // requisição própria para ela.
  const allImages = [...(product?.images ?? [])].sort((a, b) => a.position - b.position);

  const handleWhatsAppOrder = async () => {
    if (!auth.isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!enterprise) {
      toast.error('Não foi possível carregar os dados da loja. Tente novamente.');
      return;
    }

    // Orçamento e agendamento são subsistemas próprios, sem rota nenhuma
    // nesta API (confira registerEnterpriseRoutes/registerProductRoutes no
    // repositório Go): não há requisição a fazer aqui, só o WhatsApp abaixo.

    // Só usar window se estivermos no cliente
    const productUrl = typeof window !== 'undefined' ? window.location.href : '';
    let message = `Olá! Gostaria de saber mais sobre o produto: *${product?.title}*.`;

    const contact = enterprise.phones.find(p => p.isWhatsapp)?.phone;

    if (product?.service && includeService) {
      message += `\nGostaria de incluir o serviço: *${product.service.title}*.`;
    }

    message += `\n\nLink do produto:\n${productUrl}`;
    const whatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  };

  // Adicionar ao carrinho não exige login: enquanto anônimo a linha fica no
  // armazenamento local (nenhuma requisição sai) e sobe numa única mesclagem
  // quando o cliente entrar na conta.
  const handleAddToCart = async () => {
    if (!enterprise) {
      toast.error('Não foi possível carregar os dados da loja. Tente novamente.');
      return;
    }

    if (!product || !selectedPrice) {
      toast.error(`Escolha uma opção de preço antes de adicionar.`);
      return;
    }

    try {
      setIsAddingToCart(true);
      // A linha local guarda o suficiente de produto e preço para a tela do
      // carrinho se desenhar sem rede; só productId/priceId/quantity sobem na
      // mesclagem.
      const resultado = await carrinho.adicionar({
        productId: product.id,
        priceId: selectedPrice.id,
        quantity: 1,
        product: {
          id: product.id,
          code: product.code,
          title: product.title,
          status: product.status,
          image: product.images.find((i) => i.isMain) ?? product.images[0] ?? null,
        },
        price: selectedPrice,
      });
      // A mensagem diz o que o servidor gravou, não o que o clique pediu.
      toast.success(
        `${product.title} no carrinho: ${resultado.quantidade} un.` +
          (resultado.total ? ` Total: ${formatarPreco(resultado.total)}.` : ''),
      );
    } catch (erro) {
      console.error('Erro ao adicionar item ao carrinho:', erro);
      if (erro instanceof CarrinhoNaoCarregado) {
        // Recusa deliberada: sem o carrinho do servidor em mãos, a quantidade
        // nova sairia de um chute, e `POST .../items` substitui em vez de
        // somar — o carrinho do cliente encolheria.
        toast.error(
          'Não foi possível ler o seu carrinho nesta loja. O produto não foi ' +
            'adicionado — tente novamente.',
        );
      } else {
        toast.error('Erro ao adicionar produto ao carrinho!');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (!isLoading && productNotFound) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
        <Link href={`/${name_store}`} className="text-primary hover:text-primary/90 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a lista de produtos
        </Link>
      </div>
    );
  }

  if (!isLoading && productError) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Não foi possível carregar o produto</h2>
        <p className="text-gray-600 mb-6">
          Houve uma falha ao falar com o servidor. O produto pode continuar disponível.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => setTentativa((n) => n + 1)}>Tentar novamente</Button>
          <Link href={`/${name_store}`} className="text-primary hover:text-primary/90 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-white">
      <div className=" overflow-hidden max-w-6xl">
        <div className="p-6  border-b ">
          <Link href={`/${name_store}`} className="text-primary hover:text-primary/90 flex items-center mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista de produtos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{product?.title || 'Loading...'}</h1>
        </div>

        {enterpriseError && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Não foi possível carregar os dados da loja.
              </p>
              <p className="text-sm text-red-700">
                Sem eles não dá para adicionar ao carrinho nem abrir o WhatsApp.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={recarregarLoja}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* A tela do carrinho mostra o erro de leitura; esta também precisa
            mostrar, porque é daqui que se adiciona — e é a adição que a
            leitura falha impede. */}
        {carrinho.erro && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Não foi possível carregar o seu carrinho nesta loja.
              </p>
              <p className="text-sm text-red-700">
                Sem ele não dá para adicionar o produto sem arriscar o que já
                está no carrinho. Seus itens continuam na sua conta.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={carrinho.recarregar}>
              Tentar novamente
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          <div className="space-y-6">
            {isLoading ? (
              <div className="relative rounded-lg overflow-hidden">
                <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
                <div className="absolute top-4 right-4">
                  <div className="w-20 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <div className="w-24 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                </div>
              </div>
            ) : allImages.length > 0 ? (
              <div
                className="relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setShowGallery(true)}
              >
                <img
                  src={allImages.find(img => img.isMain)?.url || allImages[0]?.url || 'https://placehold.co/600x400'}
                  alt={product?.title || 'Produto'}
                  className="w-full h-auto object-cover"
                />

                {/* A imagem em exibição não conta como "mais uma". */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-sm">
                    +{allImages.length - 1}{' '}
                    {allImages.length - 1 === 1 ? 'imagem' : 'imagens'}
                  </div>
                )}
              </div>
            ) : null}

            <div className="bg-gray-50 rounded-lg p-6 ">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Características do produto</h3>
              <ul className="space-y-3">
                {product?.detailsPoint.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Descrição</h2>
              <p className="text-gray-700">{product?.description}</p>
            </div>

            <EspacoAnuncio posicao="produto" />

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {product && product.prices.length === 1 ? 'Opção de preço' : 'Opções de preço'}
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                {
                  agendavel ? (
                    <div className="flex justify-between gap-4 flex-col">
                      <p>
                        <span className="text-primary text-2xl font-semibold">
                          {product.prices[0] ? (
                            <>
                              {temPromocaoVigente(product.prices[0]) && (
                                <span className="text-base text-gray-400 line-through mr-2">
                                  {formatarPreco(product.prices[0].value)}
                                </span>
                              )}
                              {formatarPreco(valorEfetivo(product.prices[0]))}
                            </>
                          ) : 'Preço não disponível'}
                        </span>
                      </p>
                      {/* O agendamento voltou: a API Go ganhou a tabela e as
                          rotas que faltavam. Os horários são calculados pelo
                          servidor a partir do expediente menos o que já está
                          confirmado — esta tela nunca vê a agenda da loja. */}
                      <SchedulePanel
                        enterpriseId={enterprise?.id}
                        nameStore={name_store}
                        productId={product.id}
                        productCode={product.code}
                        autenticado={auth.isAuthenticated}
                        onPrecisaEntrar={() => setIsAuthModalOpen(true)}
                      />
                      <Button
                        onClick={handleWhatsAppOrder}
                        variant="outline"
                        className="flex-1"
                        disabled={!enterprise}
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  ) :
                    sobOrcamento ? (
                      <>
                        {/* O pedido de orçamento voltou: a API Go ganhou a
                            tabela e as rotas que o contrato NestJS antigo
                            tinha e a migração ainda não. O painel cuida dos
                            dois lados da conversa — pedir, e responder à
                            cotação quando a loja mandar o valor. */}
                        <BudgetRequestPanel
                          enterpriseId={enterprise?.id}
                          productId={product.id}
                          nameStore={name_store}
                          autenticado={auth.isAuthenticated}
                          onPrecisaEntrar={() => setIsAuthModalOpen(true)}
                        />
                        <div className="flex gap-4">
                          <Button
                            onClick={handleWhatsAppOrder}
                            variant="outline"
                            className="flex-1"
                            disabled={!enterprise}
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                        {product.service && (
                          <div className="mt-6 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviço Vinculado</h3>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center gap-4">
                                <div className="flex-grow">
                                  <h4 className="font-medium text-gray-900">{product.service.title}</h4>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox
                                    id="include-service"
                                    checked={includeService}
                                    onCheckedChange={(checked: boolean) => setIncludeService(checked)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {product && product.prices.length === 1 ? (
                          <div className="text-2xl font-semibold text-gray-900 mb-4">
                            {product.prices[0] ? (
                              <>
                                {product.prices[0].name && (
                                  <span className="block text-sm font-normal text-gray-600 mb-1">
                                    {product.prices[0].name}
                                  </span>
                                )}
                                {temPromocaoVigente(product.prices[0]) && (
                                  <span className="text-base text-gray-400 line-through mr-2">
                                    {formatarPreco(product.prices[0].value)}
                                  </span>
                                )}
                                {formatarPreco(valorEfetivo(product.prices[0]))}
                              </>
                            ) : 'Preço não disponível'}
                          </div>
                        ) : (
                          <Select
                            value={selectedPrice?.id}
                            onValueChange={(value: string) => {
                              const price = product?.prices.find(p => p.id === value);
                              if (price) setSelectedPrice(price);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Escolha uma opção de preço" />
                            </SelectTrigger>
                            <SelectContent>
                              {product?.prices.map((price) => (
                                <SelectItem key={price.id} value={price.id}>
                                  {price.name} - {formatarPreco(valorEfetivo(price))}
                                  {temPromocaoVigente(price) ? ` (de ${formatarPreco(price.value)})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {
                          product?.type === 'service' ? (
                            <div className="flex gap-4">
                              <Button
                                onClick={handleWhatsAppOrder}
                                className="flex-1"
                                disabled={!enterprise}
                              >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Solicitar Serviço
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-4 max-md:flex-col">
                              {/* Loja sem carrinho não mostra o botão de
                                  adicionar: o WhatsApp ao lado continua
                                  sendo o caminho, e era o que já acontecia
                                  em produto do tipo serviço. */}
                              {caps.cart && (
                              <Button
                                onClick={handleAddToCart}
                                className="flex-1 text-white"
                                disabled={
                                  isAddingToCart ||
                                  !enterprise ||
                                  // Sem o carrinho desta loja carregado, a
                                  // adição seria recusada: o botão espera em
                                  // vez de prometer o que não pode cumprir.
                                  !carrinho.pronto ||
                                  (!selectedPrice && !!product && product.prices.length > 1)
                                }
                              >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                {carrinho.carregando && !carrinho.pronto
                                  ? `Carregando ${v.lista.toLowerCase()}...`
                                  : v.adicionar}
                              </Button>
                              )}
                              <Button
                                onClick={handleWhatsAppOrder}
                                variant="outline"
                                className="flex-1"
                                disabled={!enterprise}
                              >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                WhatsApp
                              </Button>
                            </div>
                          )
                        }
                        {product?.service && (
                          <div className="mt-6 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviço Vinculado</h3>
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center gap-4">
                                <div className="flex-grow">
                                  <h4 className="font-medium text-gray-900">{product.service.title}</h4>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox
                                    id="include-service"
                                    checked={includeService}
                                    onCheckedChange={(checked: boolean) => setIncludeService(checked)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detalhes do produto</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Categoria</dt>
                  <dd className="text-gray-900 font-medium">
                    {product?.category?.name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Adicionado em</dt>
                  <dd className="text-gray-900 font-medium">
                    {product ? new Date(product.createdAt).toLocaleDateString() : ''}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Atualizado em</dt>
                  <dd className="text-gray-900 font-medium">
                    {product ? new Date(product.updatedAt).toLocaleDateString() : ''}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      {showGallery && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-6xl mx-4">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative">
              <img
                src={allImages[currentImageIndex].url}
                alt={`Product image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>

            <div className="flex justify-center mt-4 gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-500'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default ProductDetail;
