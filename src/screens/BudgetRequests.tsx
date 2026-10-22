'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { FileText } from 'lucide-react';
import { authAtom } from '@/store/auth';
import { useEmpresa } from '@/store/enterprise';
import AuthModal from '@/components/AuthModal';
import ListaDaLoja from '@/components/historico/ListaDaLoja';
import ListaDeOrcamentos from '@/components/historico/ListaDeOrcamentos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Meus orçamentos" da vitrine: só os pedidos feitos NESTA loja.
//
// Antes a tela mostrava o histórico da pessoa em todas as lojas, e quem
// abria a vitrine de uma loja via o orçamento que pediu em outra. O
// histórico completo continua existindo, no perfil (/profile/historico).

const BudgetRequests = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);
  const loja = useEmpresa(nameStore);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) setIsAuthModalOpen(true);
  }, [auth.isAuthenticated]);

  return (
    <div className="min-h-screen bg-background mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-full shadow-sm">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Meus orçamentos</h1>
          </div>
          <p className="text-muted-foreground text-lg">Pedidos de preço feitos nesta loja</p>
          {auth.isAuthenticated && (
            <Link
              href={`/${nameStore}/profile/historico?aba=orcamentos`}
              className="mt-2 inline-block text-sm text-muted-foreground underline"
            >
              Ver os de todas as lojas
            </Link>
          )}
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-foreground">Entre na sua conta para ver seus orçamentos.</p>
              <Button onClick={() => setIsAuthModalOpen(true)}>Entrar</Button>
            </CardContent>
          </Card>
        ) : (
          <ListaDaLoja loja={loja}>
            {(enterpriseId) => <ListaDeOrcamentos enterpriseId={enterpriseId} />}
          </ListaDaLoja>
        )}
      </div>
    </div>
  );
};

export default BudgetRequests;
