'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calendar, Check, Clock, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { horariosLivres, pedirHorario } from '@/api/agenda';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// O pedido de horário na tela do produto.
//
// Substitui o aviso de "temporariamente indisponível" que estava aqui: a
// vitrine antiga fazia `POST /schedule`, e o controller do NestJS era
// `@Controller('event')` — a rota nunca existiu, e a confirmação falhava
// sempre, em silêncio.
//
// Os horários vêm calculados do servidor. Esta tela nunca vê a agenda da loja:
// recebe uma lista de começos livres, e é só.

type Props = {
  enterpriseId?: string;
  nameStore: string;
  productId: string;
  productCode: number;
  autenticado: boolean;
  onPrecisaEntrar: () => void;
};

// Os próximos 14 dias. Mais que isso vira uma fileira de botões que ninguém
// percorre; menos deixa de fora quem planeja a semana seguinte.
const DIAS_OFERECIDOS = 14;

function proximosDias(): Date[] {
  const hoje = new Date();
  return Array.from({ length: DIAS_OFERECIDOS }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    return d;
  });
}

// aaaaMMdd no fuso LOCAL. `toISOString` converteria para UTC e, à noite no
// Brasil, mandaria o dia seguinte — o cliente pediria horário de outro dia
// sem perceber.
function paraData(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function rotuloDoDia(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const MENSAGENS_DE_ERRO: Record<string, string> = {
  APPOINTMENT_OVERLAP: 'Esse horário acabou de ser ocupado. Escolha outro.',
  PRODUCT_WITHOUT_DURATION: 'A loja ainda não configurou a duração deste serviço.',
  PRODUCT_NOT_SCHEDULABLE: 'Este produto não aceita agendamento.',
  VALIDATION_ERROR: 'Esse horário não está mais disponível. Escolha outro.',
};

export default function SchedulePanel({
  enterpriseId,
  nameStore,
  productId,
  productCode,
  autenticado,
  onPrecisaEntrar,
}: Props) {
  const dias = proximosDias();
  const [dia, setDia] = useState(() => paraData(dias[0]));
  const [slots, setSlots] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setEscolhido(null);
    try {
      setSlots(await horariosLivres(nameStore, productCode, dia));
    } catch (e) {
      const codigo = (e as { response?: { data?: { error?: { code?: string } } } })?.response?.data
        ?.error?.code;
      // Cadastro incompleto da loja é diferente de rede ruim: o primeiro não
      // melhora tentando de novo, e dizer "tente de novo" seria mentira.
      setErro(
        codigo === 'PRODUCT_WITHOUT_DURATION'
          ? 'A loja ainda não configurou a duração deste serviço.'
          : 'Não foi possível carregar os horários.'
      );
    } finally {
      setCarregando(false);
    }
  }, [nameStore, productCode, dia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviar = async () => {
    if (!enterpriseId || !escolhido) return;
    setEnviando(true);
    try {
      await pedirHorario({
        enterpriseId,
        productId,
        startsAt: escolhido,
        notes: observacao.trim(),
      });
      setPedido(true);
      toast.success('Pedido enviado. A loja confirma por aqui.');
    } catch (e) {
      const codigo = (e as { response?: { data?: { error?: { code?: string } } } })?.response?.data
        ?.error?.code;
      toast.error((codigo && MENSAGENS_DE_ERRO[codigo]) || 'Não foi possível pedir o horário.');
      // O horário pode ter sido ocupado entre a lista e o clique; recarregar
      // mostra a realidade em vez de deixar na tela um botão que já não vale.
      carregar();
    } finally {
      setEnviando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Entre na sua conta para escolher um horário e acompanhar a confirmação da loja por aqui.
        </p>
        <Button onClick={onPrecisaEntrar} className="w-full">
          Entrar e agendar
        </Button>
      </div>
    );
  }

  if (pedido) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Check className="w-4 h-4 flex-shrink-0" />
          Pedido enviado — aguardando a loja confirmar
        </div>
        <p className="text-sm text-gray-700">
          {/* O cliente precisa saber que pedir não é ter a hora: a loja ainda
              confirma, e só então o horário é dele. */}
          Seu horário só fica garantido depois que a loja confirmar. Você acompanha em{' '}
          <Link href={`/${nameStore}/agendamentos`} className="underline">
            Meus agendamentos
          </Link>
          .
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setPedido(false);
            setObservacao('');
            carregar();
          }}
        >
          Pedir outro horário
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
          <Calendar className="w-4 h-4" />
          Escolha o dia
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dias.map((d) => {
            const valor = paraData(d);
            const ativo = valor === dia;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setDia(valor)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${
                  ativo ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700'
                }`}
                aria-pressed={ativo}
              >
                {rotuloDoDia(d)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
          <Clock className="w-4 h-4" />
          Horários livres
        </p>

        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : erro ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{erro}</p>
          </div>
        ) : slots.length === 0 ? (
          // Dia fechado e dia lotado dão o mesmo resultado para quem olha, e a
          // frase cobre os dois sem inventar qual foi.
          <p className="text-sm text-gray-600">Nenhum horário livre neste dia. Tente outro.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEscolhido(s)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  escolhido === s
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
                aria-pressed={escolhido === s}
              >
                {hora(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {escolhido && (
        <div className="space-y-3">
          <div>
            <label htmlFor="obs-agenda" className="block text-sm font-medium text-gray-900 mb-2">
              Alguma observação? (opcional)
            </label>
            <Textarea
              id="obs-agenda"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="min-h-[72px]"
            />
          </div>
          <Button onClick={enviar} disabled={enviando || !enterpriseId} className="w-full">
            {enviando ? 'Enviando…' : `Pedir horário das ${hora(escolhido)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
