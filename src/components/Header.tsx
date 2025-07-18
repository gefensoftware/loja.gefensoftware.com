'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, User, LogOut, ShoppingCart, X } from 'lucide-react';
import { api } from '@/api';
import { Enterprise } from '@/types/enterprise';
import AuthModal from '@/components/AuthModal';
import ClientOnly from '@/components/ClientOnly';

import { useAtom } from 'jotai';
import { authAtom } from '@/store/auth';
import { userAtom } from '@/store/user';
import { cartAtom } from '@/store/cart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cart } from '@/components/Cart';

interface HeaderProps {
  onMenuClick: () => void;
  enterpriseName?: string;
  enterpriseLogo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
}) => {
  const [isAtTop, setIsAtTop] = useState(true);
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);
  const [_, setUser] = useAtom(userAtom);
  const [cart] = useAtom(cartAtom);
  const [__, setIsScrolled] = useState(false);
  const router = useRouter();
  const params = useParams();
  const name_store = params?.name_store as string;
  const cartItemsCount = cart.items.length;

  const getEnterprise = async () => {
    const { data } = await api.get(`/enterprise/${name_store}`);
    setEnterprise(data);
  }

  useEffect(() => {
    getEnterprise();
  }, [name_store]);

  useEffect(() => {
    // Só alterar o título se estivermos no cliente
    if (typeof window !== 'undefined' && enterprise?.name) {
      document.title = `loja | ${enterprise.name}`;
    }
  }, [enterprise]);

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

  useEffect(() => {
    // Só aplicar o tema se estivermos no cliente
    if (typeof window !== 'undefined' && enterprise?.theme) {
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

  useEffect(() => {
    // Só adicionar event listeners se estivermos no cliente
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ClientOnly>
      <>
        <div className={`fixed top-0 z-30 w-full border-b bg-background/95 md:hidden border-none ${!isAtTop ? 'backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-black/60'} bg-black/60 duration-300 transition-all`}>
          <div className="w-full container flex h-12 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="mr-4 text-primary"
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-primary/10 relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5 text-white" />
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
                      <User className="h-5 w-5 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-primary/20">
                    <DropdownMenuItem onClick={() => router.push(`/profile`)} className="text-foreground hover:bg-primary/10">
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
                  className="text-foreground hover:bg-primary/10 text-white"
                >
                  Login
                </Button>
              )}
            </div>
          </div>

        </div>
        <div className={`lg:hidden fixed inset-0 bg-background z-[999] transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
      </>
    </ClientOnly>
  );
}; 