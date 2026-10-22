'use client'

import { AlertTriangle, Loader2 } from 'lucide-react';
import type { EstadoDaEmpresa } from '@/store/enterprise';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Espera a loja da vitrine antes de montar a lista recortada por ela.
//
// O recorte precisa do id, e a vitrine só tem o slug. Montar a lista antes
// de a loja chegar pediria o histórico SEM filtro — e por um instante a tela
// desta loja mostraria os pedidos feitos em outras, que é exatamente o que
// ela deixou de fazer.
export default function ListaDaLoja({
  loja,
  children,
}: {
  loja: EstadoDaEmpresa;
  children: (enterpriseId: string) => React.ReactNode;
}) {
  if (loja.empresa) return <>{children(loja.empresa.id)}</>;

  if (loja.erro || loja.naoEncontrada) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-foreground">Não foi possível carregar os dados da loja.</p>
          <Button variant="outline" onClick={loja.recarregar}>
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      Carregando…
    </div>
  );
}
