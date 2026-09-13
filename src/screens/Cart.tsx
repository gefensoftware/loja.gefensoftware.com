'use client'

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { ListaDoCarrinho, EnviarPedido } from '@/components/Cart';
import { StatusStore } from '@/components/StatusStore';
import { useCarrinho } from '@/store/cart';
import { useEmpresa } from '@/store/enterprise';
import { estaAberta } from '@/store/open-store';

/**
 * Página do carrinho.
 *
 * Lê o carrinho de verdade: do servidor quando há sessão, do armazenamento
 * local enquanto anônimo. O total exibido é sempre o do servidor, como veio —
 * nunca a soma das linhas na tela, que ignoraria a regra de produto fora do
 * cardápio.
 *
 * A empresa é lida por slug porque três coisas dependem dela: o id que
 * endereça o carrinho, o horário que diz se a loja está aberta, e o telefone
 * de WhatsApp para onde o pedido vai.
 */
const CartPage = () => {
  const router = useRouter();
  const params = useParams();
  const name_store = params?.name_store as string;
  // A empresa vem do gancho compartilhado, que lê o átomo e só busca quando
  // ele está vazio: chegando do cardápio, esta tela não gasta requisição
  // nenhuma. Slug inexistente e falha de leitura caem no mesmo aviso — em
  // qualquer um dos dois a tela não tem os dados da loja.
  const {
    empresa: enterprise,
    carregando: carregandoLoja,
    naoEncontrada,
    erro,
    recarregar: buscarLoja,
  } = useEmpresa(name_store);
  const erroDaLoja = naoEncontrada || erro;

  const carrinho = useCarrinho(enterprise?.id);
  const aberta = enterprise ? estaAberta(enterprise.hours) : false;

  const [esvaziando, setEsvaziando] = useState(false);
  const esvaziar = async () => {
    try {
      setEsvaziando(true);
      await carrinho.esvaziar();
    } catch (erro) {
      console.error('Erro ao esvaziar o carrinho:', erro);
      toast.error('Não foi possível esvaziar o carrinho.');
    } finally {
      setEsvaziando(false);
    }
  };

  if (erroDaLoja) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Não foi possível carregar a loja
        </h1>
        <p className="text-gray-600 max-w-md mb-6">
          Sem os dados da loja não dá para mostrar o carrinho nem enviar o
          pedido. Seus itens continuam guardados.
        </p>
        <Button onClick={buscarLoja}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => router.push(`/${name_store}`)}
            className="text-primary hover:text-primary/90 flex items-center mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o cardápio
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Seu pedido</h1>
            {!carregandoLoja && <StatusStore isOpen={aberta} />}
          </div>
          {enterprise && (
            <p className="text-sm text-gray-600 mt-1">{enterprise.name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-28">
        <div className="bg-white rounded-lg border">
          <ListaDoCarrinho carrinho={carrinho} />
        </div>

        {carrinho.linhas.length > 0 ? (
          <div className="mt-4 space-y-3">
            <EnviarPedido
              carrinho={carrinho}
              enterprise={enterprise}
              aberta={aberta}
              name_store={name_store}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={esvaziar}
              disabled={esvaziando}
            >
              {esvaziando ? 'Esvaziando...' : 'Esvaziar carrinho'}
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              onClick={() => router.push(`/${name_store}`)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Ver produtos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
