'use client'

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { AlertTriangle, Check, Loader2, Wrench } from 'lucide-react';
import { apiError } from '@/api';
import { lerPreviaDoLink, vincularOrdem, type PreviaDoLink } from '@/api/work-order';
import { authAtom } from '@/store/auth';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// A tela do link de acompanhamento.
//
// É por onde o cliente de BALCÃO alcança a própria ordem. Ele deixou o carro
// sem ter conta na vitrine — exigir cadastro para consertar um carro seria
// inventar uma barreira que o balcão não tem —, e a oficina lhe mandou este
// link no WhatsApp.
//
// A prévia aparece ANTES do login, e é isso que a torna útil: pedir cadastro
// sem antes dizer para quê é o que faz a pessoa fechar a aba. O que ela
// mostra é só o suficiente para o reconhecimento — a loja, o número da ordem
// e o equipamento. O resto está atrás da conta, porque o link pode ter sido
// repassado.
//
// Assim que a pessoa entra, o vínculo acontece sozinho: ela clicou no link
// para acompanhar a ordem, não para apertar mais um botão.

const MENSAGENS: Record<string, string> = {
  WORK_ORDER_ALREADY_CLAIMED:
    'Esta ordem de serviço já está vinculada a outra conta. Fale com a oficina.',
  WORK_ORDER_CLAIM_INVALID: 'Este link de acompanhamento não é válido.',
};

export default function WorkOrderClaim() {
  const router = useRouter();
  const { name_store: nameStore, token } = useParams<{ name_store: string; token: string }>();
  const [auth] = useAtom(authAtom);

  const [previa, setPrevia] = useState<PreviaDoLink | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [authAberto, setAuthAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setPrevia(await lerPreviaDoLink(token));
    } catch (e) {
      setErro(MENSAGENS[apiError(e) ?? ''] ?? 'Não foi possível abrir este link.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O vínculo acontece assim que há conta: quem clicou no link quer
  // acompanhar a ordem, e um segundo botão depois do login só atrasaria.
  const vincular = useCallback(async () => {
    setVinculando(true);
    try {
      const ordem = await vincularOrdem(token);
      toast.success('Pronto! Esta ordem agora está na sua conta.');
      router.replace(`/${nameStore}/ordens`);
      return ordem;
    } catch (e) {
      setErro(MENSAGENS[apiError(e) ?? ''] ?? 'Não foi possível vincular esta ordem.');
    } finally {
      setVinculando(false);
    }
  }, [token, nameStore, router]);

  useEffect(() => {
    if (auth.isAuthenticated && previa && !erro) vincular();
    // `vincular` muda a cada render de erro; depender dele aqui recriaria o
    // efeito e tentaria de novo em cima de uma falha que já foi mostrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, previa]);

  return (
    <>
      <AuthModal isOpen={authAberto} onClose={() => setAuthAberto(false)} />

      <div className="container mx-auto max-w-lg px-4 py-10">
        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : erro ? (
          <Card>
            <CardContent className="py-10 text-center">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <p className="text-gray-700">{erro}</p>
              <Button variant="outline" className="mt-4" onClick={carregar}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : previa ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Wrench className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">{previa.storeName} abriu a</p>
              <p className="text-2xl font-bold text-gray-900">
                Ordem de serviço nº {previa.number}
              </p>
              {previa.equipment && (
                <p className="mt-1 text-sm text-gray-600">{previa.equipment}</p>
              )}

              {auth.isAuthenticated ? (
                <p className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                  {vinculando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vinculando à sua conta...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Vinculada à sua conta.
                    </>
                  )}
                </p>
              ) : (
                <>
                  <p className="mt-6 text-sm text-gray-700">
                    Entre ou crie sua conta para acompanhar o serviço, aprovar o orçamento
                    e guardar a nota.
                  </p>
                  <Button className="mt-4" onClick={() => setAuthAberto(true)}>
                    Entrar ou criar conta
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
