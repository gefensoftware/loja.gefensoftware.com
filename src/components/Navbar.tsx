import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, User, ShoppingCart } from 'lucide-react';
import { useAtom } from 'jotai';
import { cartAtom } from '../store/cart';

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
    label: 'Perfil',
    to: `/${company_name}/profile`,
    icon: User,
  },
];

export const Navbar = () => {
  const location = useLocation();
  const { name_store } = useParams();
  const [cart] = useAtom(cartAtom);
  
  const cartItemsCount = cart?.items?.length || 0;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm flex justify-around md:justify-center px-4 py-2 md:py-3 md:px-8 gap-8 md:gap-4">
      {navItems(name_store ?? '').map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        const isCart = item.label === 'Carrinho';
        
        return (
          <Link
            key={item.to}
            to={item.to}
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