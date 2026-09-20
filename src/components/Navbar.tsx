'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Home, User, ShoppingCart, ClipboardList, FileText, Calendar, Wrench } from 'lucide-react'
import { useAtom } from 'jotai'
import { cartCountAtom } from '@/store/cart'
import { useEmpresa } from '@/store/enterprise'
import { capacidadesDe, vocabularioDe } from '@/lib/vocabulario'
import type { Capabilities, OperationMode } from '@/types/catalog'

// A barra é montada a partir do que a loja tem ligado, e não de uma lista
// fixa. Antes, toda vitrine mostrava os cinco itens: a loja que só vende
// produto exibia "Orçamentos" e "Agenda" que nunca teriam nada dentro, e o
// cliente clicava para encontrar uma tela vazia.
//
// Home e Perfil não dependem de capacidade nenhuma — existem em qualquer
// loja, inclusive na que só expõe catálogo.
const navItems = (
  company_name: string,
  mode: OperationMode | null,
  caps: Capabilities,
) => {
  const v = vocabularioDe(mode);
  return [
    { label: 'Home', to: `/${company_name}`, icon: Home, mostrar: true },
    {
      label: v.lista,
      to: `/${company_name}/cart`,
      // O ícone acompanha a palavra: um carrinho de supermercado ao lado de
      // "Solicitação" diria a coisa errada sobre a loja.
      icon: mode === 'products' || mode == null ? ShoppingCart : ClipboardList,
      mostrar: caps.cart,
      contador: true,
    },
    // Orçamentos, Agenda e Serviços somem da barra desta loja, mas as PÁGINAS
    // continuam de pé: as duas listam o histórico do cliente em todas as
    // lojas (/users/me/...), e travá-las aqui esconderia de alguém os
    // pedidos que ele fez em outra vitrine.
    {
      label: 'Orçamentos',
      to: `/${company_name}/orcamentos`,
      icon: FileText,
      mostrar: caps.budgets,
    },
    {
      label: 'Agenda',
      to: `/${company_name}/agendamentos`,
      icon: Calendar,
      mostrar: caps.appointments,
    },
    {
      label: 'Serviços',
      to: `/${company_name}/ordens`,
      icon: Wrench,
      mostrar: caps.workOrders,
    },
    { label: 'Perfil', to: `/${company_name}/profile`, icon: User, mostrar: true },
  ].filter((item) => item.mostrar);
};

export const Navbar = () => {
  const pathname = usePathname();
  const params = useParams();
  const name_store = params?.name_store as string;
  // Lê a loja do átomo — o layout já a buscou. Sem ela (primeiro quadro ou
  // falha de leitura), o padrão é o de hoje: carrinho ligado, vocabulário de
  // produtos. É a escolha que não faz a barra piscar itens inexistentes.
  const { empresa } = useEmpresa(name_store);
  // Contagem do carrinho do servidor, escrita por quem conhece o id da
  // empresa (a grade e o detalhe do produto). Esta barra não busca sozinha:
  // ela não tem o id, só o slug.
  const [cartItemsCount] = useAtom(cartCountAtom);

  const itens = navItems(name_store ?? '', empresa?.mode ?? null, capacidadesDe(empresa?.capabilities));

  return (
    // print:hidden porque a nota da ordem de serviço é uma página desta
    // mesma vitrine: sem isso, a barra de navegação sairia impressa no pé
    // do papel que o cliente guarda.
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm flex justify-around md:justify-center px-4 py-2 md:py-3 md:px-8 gap-8 md:gap-4 print:hidden">
      {itens.map((item) => {
        const Icon = item.icon;
        // Prefixo, não igualdade: o Perfil ganhou sub-rotas
        // (/profile/dados, /senha, /foto) e com comparação exata o item
        // apagava assim que a pessoa entrava numa delas — a barra deixava
        // de dizer onde ela estava.
        //
        // A Home é a exceção, e é por isso que não dá para trocar a
        // comparação para todos: `/${name_store}` é prefixo de TODAS as outras
        // rotas da vitrine, então por prefixo ela ficaria acesa o tempo
        // todo, inclusive junto com o item realmente ativo.
        const isActive =
          item.to === `/${name_store}`
            ? pathname === item.to
            : pathname === item.to || pathname?.startsWith(`${item.to}/`);

        return (
          <Link
            key={item.to}
            href={item.to}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors duration-150 relative ${
              isActive ? 'text-primary font-bold' : 'text-gray-500 hover:text-primary'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs md:text-sm">{item.label}</span>
            {item.contador && cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;
