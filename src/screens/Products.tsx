'use client'

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/api';
import { sair } from '@/api/auth';
import { searchTermAtom } from '@/store/products';
import { useAtom } from 'jotai';
import { CategorySidebar } from '@/components/CategorySidebar';

import { AlertTriangle, Tag } from 'lucide-react';
import { ProductSkeletonGrid } from '@/components/ProductSkeleton';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { User, LogOut, ShoppingCart, X, MapPin } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

import { authAtom } from '@/store/auth';
import { userAtom } from '@/store/user';
import { useCarrinho } from '@/store/cart';
import { useEmpresa } from '@/store/enterprise';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cart } from '@/components/Cart';
import { openStoreAtom, estaAberta } from '@/store/open-store';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { StatusStore } from '@/components/StatusStore';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Category, Paged, Product } from '@/types/catalog';

// Teto do servidor para `pageSize` (page.go). A listagem de produtos pede uma
// página por vez e oferece "carregar mais" quando o total do servidor é maior
// que o que já veio; as categorias vêm todas de uma vez, porque a barra
// lateral não tem paginação e uma loja não chega perto de cem categorias.
const TAMANHO_DA_PAGINA = 100;

const Products = () => {
  const params = useParams();
  const name_store = params?.name_store as string;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalDeProdutos, setTotalDeProdutos] = useState(0);
  const [paginaCarregada, setPaginaCarregada] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [loading, setLoading] = useState(true);
  // Falha ao ler produtos não pode virar "nenhum produto disponível": uma API
  // fora do ar e uma loja sem produtos precisam ser distinguíveis.
  const [productsError, setProductsError] = useState(false);
  // Falha do "carregar mais" é um estado à parte de `productsError`: a grade
  // já carregada não pode ser derrubada por uma falha que só afeta a próxima
  // página. Mostrado junto ao botão, não no lugar da grade.
  const [erroCarregarMais, setErroCarregarMais] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const [, setUser] = useAtom(userAtom);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  // A empresa vem do gancho compartilhado: ele lê o átomo e só vai à rede
  // quando ele está vazio, em vez de esta tela reimplementar dados,
  // carregando, erro e "tentar novamente" por conta própria.
  const {
    empresa: loja,
    carregando: lojaLoading,
    naoEncontrada: lojaNaoEncontrada,
    erro: lojaError,
    recarregar: recarregarLoja,
  } = useEmpresa(name_store);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  // O carrinho da loja: local enquanto anônimo, do servidor depois do login.
  // É aqui, na primeira tela que conhece o id da empresa, que a mesclagem
  // dispara quando o cliente entra na conta.
  const carrinho = useCarrinho(loja?.id);
  const cartItemsCount = carrinho.contagem;

  useEffect(() => {
    // Só adicionar event listeners se estivermos no cliente
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const fetchCategories = useCallback(async () => {
    if (!name_store) return;
    try {
      setCategoriesLoading(true);
      setCategoriesError(false);
      // Sem `pageSize` a rota cai no padrão de vinte (page.go), enquanto os
      // produtos já pedem cem: numa loja com mais de vinte categorias, as
      // demais sumiam da barra lateral sem nada indicar que faltava algo.
      const { data } = await api.get<Paged<Category>>(`/enterprises/by-slug/${name_store}/categories`, {
        params: { pageSize: TAMANHO_DA_PAGINA }
      });
      setCategories(data.data);
    } catch (erro) {
      console.error('Erro ao buscar categorias:', erro);
      setCategories([]);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  }, [name_store]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Função para scroll até a categoria na página de produtos
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (!categoryId || typeof window === 'undefined') return;
    setTimeout(() => {
      const el = document.getElementById(`category-${categoryId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Atualizar o select conforme o scroll
  useEffect(() => {
    // Só adicionar event listeners se estivermos no cliente
    if (typeof window === 'undefined') return;

    const onScroll = () => {
      if (!categories.length) return;
      let current: string | null = null;
      for (const cat of categories) {
        const el = document.getElementById(`category-${cat.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = cat.id;
          }
        }
      }
      setSelectedCategory(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [categories]);

  const handleLogout = async () => {
    // `sair` revoga o refresh token e limpa o par de tokens; sem ela o
    // usuário volta logado ao recarregar a página.
    await sair();
    setAuth({
      access_token: null,
      isAuthenticated: false,
      id_enterprise: null
    });
    setUser(null);
  };

  const [isOpen, setIsOpen] = useAtom(openStoreAtom);

  // O estado de aberta/fechada vem de `hours`, devolvido pela rota pública
  // da empresa — não é mais um booleano solto sem ninguém escrevendo nele.
  useEffect(() => {
    if (!loja) return;
    setIsOpen(estaAberta(loja.hours));
  }, [loja, setIsOpen]);

  // A listagem pública já devolve preço e imagem principal de cada produto —
  // uma requisição por página. `active`/`paused` já vêm filtrados pelo
  // servidor; produto inativo nunca aparece aqui.
  const buscarPagina = useCallback(async (pagina: number) => {
    const { data } = await api.get<Paged<Product>>(`/enterprises/by-slug/${name_store}/products`, {
      params: { page: pagina, pageSize: TAMANHO_DA_PAGINA }
    });
    return data;
  }, [name_store]);

  const fetchProducts = useCallback(async () => {
    if (!name_store) return;
    try {
      setLoading(true);
      setProductsError(false);
      setErroCarregarMais(false);
      const data = await buscarPagina(1);
      setProducts(data.data);
      // O total do servidor é o que diz se sobrou produto fora da página.
      setTotalDeProdutos(data.total);
      setPaginaCarregada(1);
    } catch (erro) {
      console.error('Erro ao buscar produtos:', erro);
      setProducts([]);
      setTotalDeProdutos(0);
      setPaginaCarregada(0);
      setProductsError(true);
    } finally {
      setLoading(false);
    }
  }, [name_store, buscarPagina]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const carregarMais = async () => {
    if (carregandoMais) return;
    try {
      setCarregandoMais(true);
      // Limpa uma falha anterior ao tentar de novo; se esta tentativa também
      // falhar, `paginaCarregada` não avança, então o próximo clique refaz a
      // mesma página, não recomeça da primeira.
      setErroCarregarMais(false);
      const proxima = paginaCarregada + 1;
      const data = await buscarPagina(proxima);
      setProducts((anteriores) => [...anteriores, ...data.data]);
      setTotalDeProdutos(data.total);
      setPaginaCarregada(proxima);
    } catch (erro) {
      console.error('Erro ao carregar mais produtos:', erro);
      // Não usa `productsError`: essa falha não pode substituir a grade que
      // já está carregada e visível.
      setErroCarregarMais(true);
    } finally {
      setCarregandoMais(false);
    }
  };

  // Filtrar produtos por termo de pesquisa
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar produtos por categoria
  const productsByCategory = categories.reduce((acc: Record<string, { category: Category; products: Product[] }>, category) => {
    const categoryProducts = filteredProducts.filter(product => product.category?.id === category.id);
    if (categoryProducts.length > 0) {
      acc[category.id] = {
        category,
        products: categoryProducts
      };
    }
    return acc;
  }, {});

  // O resto vai para "Outros Produtos" por diferença, não por "categoria
  // nula": um produto COM categoria cuja categoria não esteja na lista
  // carregada (lista vazia por falha, categoria criada depois, paginação de
  // categorias) não caía em grupo nenhum e sumia da grade inteira.
  const idsAgrupados = new Set(
    Object.values(productsByCategory).flatMap(grupo => grupo.products.map(p => p.id))
  );
  const uncategorizedProducts = filteredProducts.filter(product => !idsAgrupados.has(product.id));

  const produtosExibidos = products.length;
  const temMaisProdutos = totalDeProdutos > produtosExibidos;

  if (loading || lojaLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
              <p className="text-gray-600 mt-1">Explore nossos produtos e serviços</p>
            </div>
          </div>
        </div>
        <ProductSkeletonGrid count={8} />
      </div>
    );
  }

  // Loja inexistente: o slug está errado, e a página precisa dizer isso em
  // vez de renderizar um cabeçalho sem nome e uma grade vazia.
  if (lojaNaoEncontrada) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        <p className="text-gray-600 max-w-md">
          Não existe nenhuma loja com o endereço <strong>{name_store}</strong>. Confira o
          link com quem o enviou.
        </p>
      </div>
    );
  }

  if (lojaError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Não foi possível carregar a loja</h1>
        <p className="text-gray-600 max-w-md mb-6">
          Houve uma falha ao falar com o servidor. A loja pode continuar no ar.
        </p>
        <Button onClick={recarregarLoja}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Scroll Header - aparece quando há scroll */}
    <div className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b py-3 transition-all duration-300 ease-out transform ${
      isScrolled ? 'translate-y-0 opacity-100 shadow-lg' : '-translate-y-full opacity-0 shadow-none'
    }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Logo pequeno */}
            {loja?.logoUrl && (
              <img
                src={loja.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            )}

            {/* Nome da empresa */}
            <h3 className="font-medium text-gray-900 text-sm truncate flex-shrink-0 max-md:hidden">
              {loja?.name}
            </h3>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              {/* Input de pesquisa */}
              <div className="relative flex-1 max-w-md min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm"
                />
              </div>

              {/* Select de categorias */}
              {categories.length > 0 && (
                <Select value={selectedCategory || ''} onValueChange={handleCategorySelect}>
                  <SelectTrigger className="w-40 flex-shrink-0 max-md:w-32">
                    <SelectValue placeholder="Categorias..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Status da loja */}
            <StatusStore isOpen={isOpen} />
          </div>
        </div>
      </div>

    {/* Hero Section with Banner */}
    {loja?.bannerUrl && (
      <div className={`relative transition-all duration-300 ${isScrolled ? 'h-24' : 'h-64 max-md:h-40'}`}>
        <div className={`absolute top-0 left-0  w-full overflow-hidden transition-all duration-300 ${isScrolled ? 'h-24' : 'h-64 max-md:h-40'}`}>
          <img
            src={loja.bannerUrl}
            alt="Banner do estabelecimento"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )}

    {/* Fixed Header */}
    <header className={`sticky bg-white shadow-sm border-b max-md:rounded-t-xl -mt-4 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Store Info */}
          <div className="flex items-center gap-3 max-md:gap-1 max-md:flex-col max-md:items-center max-md:w-full">
            {loja?.logoUrl && (
              <img
                src={loja.logoUrl}
                alt="Logo"
                className="w-16 h-16 rounded-full object-cover max-md:w-24 max-md:h-24 max-md:-mt-14"
              />
            )}
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2 justify-center md:justify-start'>

              <h2 className="font-semibold text-gray-900 max-md:text-2xl max-md:text-center">{loja?.name}</h2>

              <StatusStore isOpen={isOpen} />

              </div>
              <div className="flex items-center gap-2 text-sm max-md:flex-col">
              {loja?.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {` ${loja.address.city} - ${loja.address.state}`}
                  <div className='w-1.5 h-1.5 mx-2.5 bg-gray-700 rounded-full flex-shrink-0'></div>
                  <p className=' text-zinc-700 font-bold text-sm '>
                    Mais informações
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 max-md:flex-col-reverse max-md:hidden">
            {/* Select de Categorias */}
            {categories.length > 0 && (
              <Select value={selectedCategory || ''} onValueChange={handleCategorySelect}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ir para categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Cart Button */}
            <div className="flex items-center max-md:justify-between max-md:w-full md:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="relative border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrinho
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            {auth.isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-100">
                    <User className="h-4 w-4 mr-2" />
                    Conta
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(`/profile`)}>
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Entrar
              </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isScrolled ? 'pt-20' : ''}`}>
    <div className="space-y-10 pb-20">

      {categoriesError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Não foi possível carregar as categorias.
            </p>
            <p className="text-sm text-amber-800">
              Os produtos continuam abaixo, sem a separação por categoria.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCategories}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Categorias e Produtos */}
      <div className="space-y-10">
        {productsError ? (
          // Falha de leitura tem cara de falha, não de loja sem produtos.
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Não foi possível carregar os produtos
              </h3>
              <p className="text-gray-600 mb-6">
                Houve uma falha ao falar com o servidor. A loja pode ter produtos
                disponíveis.
              </p>
              <Button onClick={fetchProducts}>Tentar novamente</Button>
            </div>
          </div>
        ) : Object.keys(productsByCategory).length === 0 && uncategorizedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `Não encontramos produtos para "${searchTerm}"`
                  : 'Não há produtos disponíveis no momento'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Produtos por Categoria */}
            {Object.entries(productsByCategory).map(([categoryId, data]) => {
              const { category, products: categoryProducts } = data;
              return (
                <div key={categoryId} id={`category-${categoryId}`}>
                  {/* Título da Categoria */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
                  {/* Grid de Produtos */}
                  <div className="grid  gap-6 grid-cols-1 sm:grid-cols-2 ">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Produtos que não caíram em nenhum grupo de categoria */}
            {uncategorizedProducts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Outros Produtos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {uncategorizedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* O servidor diz quantos produtos existem; quando sobra produto
                fora do que veio, o cliente precisa ver isso e ter como pedir
                o resto. */}
            {temMaisProdutos && (
              <div className="flex flex-col items-center gap-3 pt-4">
                <p className="text-sm text-gray-600">
                  Exibindo {produtosExibidos} de {totalDeProdutos} produtos
                </p>
                {erroCarregarMais && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Não foi possível carregar mais produtos. Os que já estão na
                    tela continuam aqui.
                  </p>
                )}
                <Button variant="outline" onClick={carregarMais} disabled={carregandoMais}>
                  {carregandoMais
                    ? 'Carregando...'
                    : erroCarregarMais
                      ? 'Tentar novamente'
                      : 'Carregar mais produtos'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Category Sidebar */}
      <CategorySidebar
        categories={categories}
        loading={categoriesLoading}
        error={categoriesError}
        onRetry={fetchCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
    </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className={`hidden lg:block fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Seu Pedido</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Cart
            carrinho={carrinho}
            enterprise={loja}
            aberta={isOpen}
            name_store={name_store}
          />
        </div>
      </div>

      {/* Cart Sidebar - Mobile */}
      <div className={`lg:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Seu Pedido</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Cart
            carrinho={carrinho}
            enterprise={loja}
            aberta={isOpen}
            name_store={name_store}
          />
        </div>
      </div>

      {/* Overlay for mobile cart */}
      {isCartOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsCartOpen(false)}
        />
      )}
    </div>
  );
};

export default Products;
