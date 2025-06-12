import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Menu, User, LogOut, ShoppingCart, X } from 'lucide-react';
import { api } from '../api';
import { Enterprise } from '../types/enterprise';
import AuthModal from './AuthModal';

import { useAtom } from 'jotai';
import { authAtom } from '../store/auth';
import { userAtom } from '../store/user';
import { cartAtom } from '../store/cart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Cart } from './Cart';

const Layout = () => {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const [_, setUser] = useAtom(userAtom);
  const [cart] = useAtom(cartAtom);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { name_store } = useParams();

  const getEnterprise = async () => {
    const { data } = await api.get(`/enterprise/${name_store}`);
    setEnterprise(data);
  }

  useEffect(() => {
    getEnterprise();


  }, [name_store]);

  useEffect(() => {
    document.title = `loja | ${enterprise?.name}`;
  }, [enterprise]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (enterprise?.theme) {
      const root = document.documentElement;
      console.log(enterprise.theme);
      root.style.setProperty('--light-primary-color', enterprise.theme.light_primary_color);
      root.style.setProperty('--light-secondary-color', enterprise.theme.light_secondary_color);
      root.style.setProperty('--light-background-color', enterprise.theme.light_background_color);
      root.style.setProperty('--light-text-color', enterprise.theme.light_text_color);
    }
  }, [enterprise?.theme]);

  const handleLogout = () => {
    setAuth({
      access_token: null,
      isAuthenticated: false,
      id_enterprise: null
    });
    setUser(null);
  };

  const cartItemsCount = cart.items.length;
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentDayBusinessHours = enterprise?.business_days.find(day => day.day_of_week === currentDay.toLowerCase() && !day.is_closed);

  const isOpen = !!currentDayBusinessHours?.business_hours.find(day => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHours, openMinutes] = day.open_time.split(':').map(Number);
    const [closeHours, closeMinutes] = day.close_time.split(':').map(Number);

    const openTimeInMinutes = openHours * 60 + openMinutes;
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;

    return currentTime >= openTimeInMinutes && currentTime <= closeTimeInMinutes;
  });


  return (
    <div className="min-h-screen bg-background">
      {enterprise?.banner && (
        <Card className={`rounded-none border-0 transition-all duration-300 ${isScrolled ? 'h-24' : 'h-48'}`}>
          <CardContent className="p-0">
            <div className={`w-full overflow-hidden transition-all duration-300 ${isScrolled ? 'h-24' : 'h-48'}`}>
              <img
                src={enterprise?.banner.location}
                alt="Enterprise Banner"
                className="w-full h-full object-cover rounded-none"
              />
            </div>
          </CardContent>
        </Card>
      )}
      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="w-full flex items-center gap-4 justify-between">
              <div
                className="flex items-center"
              >
                {enterprise?.logo && (

                  <img
                    src={enterprise.logo.location}
                    alt="Enterprise Logo"
                    className="rounded-full w-24 h-24 max-md:w-12 max-md:h-12"
                  />
                )}
                <span className="ml-2 text-xl font-semibold text-foreground">
                  {enterprise?.name}
                </span>
              </div>
                <button className={`border-2 border-green-500 text-green-500 px-4 py-2 rounded-md ${isOpen ? ' border-green-500' : 'border-red-500'}`}>
                  <span className={`text-sm   font-bold ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
                    {isOpen ? `Aberto` : 'Fechado'}
                  </span>
                </button>

            </div>
            <div className="flex items-center gap-2 max-md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-primary/10 relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute text-white -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
              {auth.isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-primary/20">
                    <DropdownMenuItem onClick={() => navigate(`/profile`)} className="text-foreground hover:bg-primary/10">
                      <User className="mr-2 h-4 w-4" />
                      <span>Configurar Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-foreground hover:bg-primary/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-foreground hover:bg-primary/10"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Cart Sidebar - Desktop */}
      <div className={`hidden lg:block z-50 fixed inset-y-0 right-0 w-96 bg-background shadow-lg transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Carrinho</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(false)}
            >
              <span className="sr-only">Fechar carrinho</span>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Cart
              enterprise={enterprise}
            />
          </div>
        </div>
      </div>

      {/* Cart Sidebar - Mobile */}
      <div className={`lg:hidden fixed inset-0 bg-background z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Carrinho
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(false)}
            >
              <span className="sr-only">Fechar carrinho</span>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Cart
              enterprise={enterprise}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;