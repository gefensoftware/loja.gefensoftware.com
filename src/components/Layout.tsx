import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { User, LogOut, ShoppingCart, X, MapPin } from 'lucide-react';
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
import { openStoreAtom } from '../store/open-store';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { StatusStore } from './StatusStore';
import { Navbar } from './Navbar';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { searchTermAtom } from '../store/products';

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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  const getEnterprise = async () => {
    const { data } = await api.get(`/enterprise/${name_store}`);
    setEnterprise(data);
  }

  useEffect(() => {
    getEnterprise();
  }, [name_store]);

  useEffect(() => {
    document.title = `${enterprise?.name} | Cardápio Digital`;
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
      root.style.setProperty('--light-primary-color', enterprise.theme.light_primary_color);
      root.style.setProperty('--light-secondary-color', enterprise.theme.light_secondary_color);
      root.style.setProperty('--light-background-color', enterprise.theme.light_background_color);
      root.style.setProperty('--light-text-color', enterprise.theme.light_text_color);
    }
  }, [enterprise?.theme]);

  // Buscar categorias se estiver na página de produtos
  useEffect(() => {
    const fetchCategories = async () => {
      if (!name_store) return;
      try {
        const { data } = await api.get(`/category/enterprise/${name_store}`);
        setCategories(data);
      } catch (e) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, [name_store]);

  // Função para scroll até a categoria na página de produtos
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (!categoryId) return;
    setTimeout(() => {
      const el = document.getElementById(`category-${categoryId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Atualizar o select conforme o scroll
  useEffect(() => {
    const onScroll = () => {
      if (!categories.length) return;
      let current: string | null = null;
      for (const cat of categories) {
        const el = document.getElementById(`category-${cat.id_category}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = cat.id_category;
          }
        }
      }
      setSelectedCategory(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [categories]);

  const handleLogout = () => {
    setAuth({
      access_token: null,
      isAuthenticated: false,
      id_enterprise: null
    });
    setUser(null);
  };

  const cartItemsCount = cart.items.length;
  const [isOpen, setIsOpen] = useAtom(openStoreAtom);

  useEffect(() => {
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
    setIsOpen(isOpen);
  }, [enterprise]);
  console.log(enterprise?.address);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scroll Header - aparece quando há scroll */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b py-3 transition-all duration-300 ease-out transform ${
        isScrolled ? 'translate-y-0 opacity-100 shadow-lg' : '-translate-y-full opacity-0 shadow-none'
      }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {/* Logo pequeno */}
              {enterprise?.logo && (
                <img
                  src={enterprise.logo.location}
                  alt="Logo"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}
              
              {/* Nome da empresa */}
              <h3 className="font-medium text-gray-900 text-sm truncate flex-shrink-0 max-md:hidden">
                {enterprise?.name}
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
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id_category} value={cat.id_category}>{cat.name}</SelectItem>
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
      {enterprise?.banner && (
        <div className={`relative transition-all duration-300 ${isScrolled ? 'h-24' : 'h-64 max-md:h-40'}`}>
          <div className={`absolute top-0 left-0  w-full overflow-hidden transition-all duration-300 ${isScrolled ? 'h-24' : 'h-64 max-md:h-40'}`}>
            <img
              src={enterprise?.banner.location}
              alt="Banner do estabelecimento"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <header className={`sticky bg-white shadow-sm border-b max-md:rounded-t-xl -mt-4 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          {/* {enterprise?.logo && (
            <div
            className='absolute -top-10  w-full h-full flex justify-center '
            >

            <img
              src={enterprise.logo.location}
              alt="Logo"
              className="w-24 h-24 rounded-full object-cover md:hidden "
              />
              </div>
          )} */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Store Info */}
            <div className="flex items-center gap-3 max-md:gap-1 max-md:flex-col max-md:items-center max-md:w-full">
              {enterprise?.logo && (
                <img
                  src={enterprise.logo.location}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-cover max-md:w-24 max-md:h-24 max-md:-mt-14"
                />
              )}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2 justify-center md:justify-start'>

                <h2 className="font-semibold text-gray-900 max-md:text-2xl max-md:text-center">{enterprise?.name}</h2>
                
                <StatusStore isOpen={isOpen} />
                
                </div>
                <div className="flex items-center gap-2 text-sm max-md:flex-col">
                {enterprise?.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {` ${enterprise.address.city} - ${enterprise.address.uf}`}
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
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id_category} value={cat.id_category}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* Contact Info */}
              {/* <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                {enterprise?.phones && enterprise.phones.length > 0 && (
                  <a href={`tel:${enterprise.phones[0].phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                    {enterprise.phones[0].phone}
                  </a>
                )}
                {enterprise?.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {`${enterprise.address.street}, ${enterprise.address.number} - ${enterprise.address.neighborhood}`}
                  </div>
                )}
              </div> */}

              {/* Cart Button */}
              <div className="flex items-center max-md:justify-between max-md:w-full md:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="relative border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => navigate(`/${name_store}/cart`)}
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
                    <DropdownMenuItem onClick={() => navigate(`/profile`)}>
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
        <Outlet />
      </main>
      <Navbar  />

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
          <div className="flex-1 overflow-y-auto">
            <Cart enterprise={enterprise} />
          </div>
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
          <div className="flex-1 overflow-y-auto">
            <Cart enterprise={enterprise} />
          </div>
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

export default Layout;