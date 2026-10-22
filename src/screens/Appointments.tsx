'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { Calendar } from 'lucide-react';
import { tokensGuardados } from '@/lib/agendamentos-sem-conta';
import AgendamentoSemContaCard from '@/components/AgendamentoSemContaCard';
import { authAtom } from '@/store/auth';
import { useEmpresa } from '@/store/enterprise';
import AuthModal from '@/components/AuthModal';
import ListaDaLoja from '@/components/historico/ListaDaLoja';
import ListaDeAgendamentos from '@/components/historico/ListaDeAgendamentos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// "Meus agendamentos" da vitrine: as horas do cliente NESTA loja — as de
// todas as lojas ficam no perfil (/profile/historico) — e, abaixo, os
// pedidos feitos SEM conta neste aparelho, lidos pelos tokens guardados
// (lib/agendamentos-sem-conta), que já eram desta loja. Quem só pediu sem
// conta vê os seus sem precisar entrar.

const Appointments = () => {
  const params = useParams();
  const nameStore = (params?.name_store as string) ?? '';
  const [auth] = useAtom(authAtom);
  const loja = useEmpresa(nameStore);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Lido depois de montar: o localStorage não existe no servidor.
  const [tokens, setTokens] = useState<string[] | null>(null);

  useEffect(() => {
    setTokens(tokensGuardados(nameStore));
  }, [nameStore]);

  const esquecer = useCallback(
    (token: string) => setTokens((atuais) => (atuais ?? []).filter((t) => t !== token)),
    []
  );

  // Sem conta e sem nada pedido neste aparelho, entrar é o único caminho, e o
  // modal abre sozinho. Com pedidos sem conta guardados, abrir o modal por
  // cima deles esconderia justamente o que a cliente veio ver.
  useEffect(() => {
    if (tokens !== null && !auth.isAuthenticated && tokens.length === 0) setIsAuthModalOpen(true);
  }, [auth.isAuthenticated, tokens]);

  const semConta = tokens && tokens.length > 0 && (
    <div className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pedidos sem conta neste aparelho</h2>
        <p className="text-sm text-muted-foreground">
          Os horários que você pediu só com nome e telefone.
        </p>
      </div>
      {tokens.map((t) => (
        <AgendamentoSemContaCard key={t} nameStore={nameStore} token={t} onSumiu={() => esquecer(t)} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background mb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-full shadow-sm">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Meus agendamentos</h1>
          </div>
          <p className="text-muted-foreground text-lg">Horários pedidos e confirmados nesta loja</p>
          {auth.isAuthenticated && (
            <Link
              href={`/${nameStore}/profile/historico?aba=agenda`}
              className="mt-2 inline-block text-sm text-muted-foreground underline"
            >
              Ver os de todas as lojas
            </Link>
          )}
        </div>

        {!auth.isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-foreground">
                {tokens && tokens.length > 0
                  ? 'Tem conta? Entre para ver também os horários pedidos por ela.'
                  : 'Entre na sua conta para ver seus agendamentos.'}
              </p>
              <Button onClick={() => setIsAuthModalOpen(true)}>Entrar</Button>
            </CardContent>
          </Card>
        ) : (
          <ListaDaLoja loja={loja}>
            {(enterpriseId) => <ListaDeAgendamentos enterpriseId={enterpriseId} />}
          </ListaDaLoja>
        )}
        {semConta}
      </div>
    </div>
  );
};

export default Appointments;
