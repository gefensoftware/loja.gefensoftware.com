'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Home, User, ShoppingCart, FileText, Calendar } from 'lucide-react'
import { useAtom } from 'jotai'
import { cartCountAtom } from '@/store/cart'

const navItems = (company_name: string) => [
  {
    label: 'Home',
    to: `/${company_name}`,
    icon: Home,
  },
  {
    label: 'Carrinho',
    to: `/${company_name}/cart`,
    icon: ShoppingCart,
  },
  {
    label: 'Orçamentos',
    to: `/${company_name}/orcamentos`,
    icon: FileText,
  },
  {
    label: 'Agenda',
    to: `/${company_name}/agendamentos`,
    icon: Calendar,
  },
  {
    label: 'Perfil',
    to: `/${company_name}/profile`,
    icon: User,
  },
];

export const Navbar = () => {
  const pathname = usePathname();
  const params = useParams();
  const name_store = params?.name_store as string;
  // Contagem do carrinho do servidor, escrita por quem conhece o id da
  // empresa (a grade e o detalhe do produto). Esta barra não busca sozinha:
  // ela não tem o id, só o slug.
  const [cartItemsCount] = useAtom(cartCountAtom);


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm flex justify-around md:justify-center px-4 py-2 md:py-3 md:px-8 gap-8 md:gap-4">
      {navItems(name_store ?? '').map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.to;
        const isCart = item.label === 'Carrinho';
        
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
            {isCart && cartItemsCount > 0 && (
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