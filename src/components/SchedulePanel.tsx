'use client'

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Calendar, Check, Clock, Loader2, User } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  horariosLivres,
  pedirHorario,
  pedirSemConta,
  profissionaisDaLoja,
  type Profissional,
} from '@/api/agenda';
import { contatoGuardado, guardarContato, guardarToken } from '@/lib/agendamentos-sem-conta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
//
// Conta é opcional. Quem entrou pede pela conta e acompanha em "Meus
// agendamentos"; quem não entrou deixa nome e telefone, e acompanha pelo link
// que o pedido devolve — guardado neste navegador para aparecer em "Agenda".
// Exigir cadastro para marcar uma manicure era a barreira que o balcão nunca
// teve.

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
  TECHNICIAN_NOT_FOUND: 'Essa pessoa não está mais atendendo pela vitrine. Escolha outra.',
  GUEST_REQUESTS_LIMIT:
    'Este telefone já tem pedidos demais esperando a loja. Aguarde a confirmação ou desmarque um deles.',
  TOO_MANY_REQUESTS: 'Muitos pedidos seguidos. Aguarde um minuto e tente de novo.',
  APPOINTMENTS_DISABLED: 'Esta loja não está recebendo agendamentos agora.',
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
  // Com quem. '' é "sem preferência": o servidor oferece o horário se alguém
  // estiver livre, e a loja decide ao confirmar.
  const [equipe, setEquipe] = useState<Profissional[]>([]);
  const [profissional, setProfissional] = useState('');
  // Quem pede sem conta. Começa com o último contato digitado neste
  // navegador: a segunda marcação não precisa pedir tudo de novo.
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [linkDoPedido, setLinkDoPedido] = useState<string | null>(null);

  useEffect(() => {
    const c = contatoGuardado();
    setNome(c.nome);
    setTelefone(c.telefone);
    setEmail(c.email);
  }, []);

  // A equipe é carregada uma vez. Falha aqui — inclusive a API anterior a
  // esta rota, que responde 404 — vira lista vazia: o painel volta a ser o
  // de quem atende sozinha, que continua funcionando inteiro.
  useEffect(() => {
    let vivo = true;
    profissionaisDaLoja(nameStore)
      .then((lista) => {
        if (vivo) setEquipe(lista);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [nameStore]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setEscolhido(null);
    try {
      setSlots(await horariosLivres(nameStore, productCode, dia, profissional || undefined));
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
  }, [nameStore, productCode, dia, profissional]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O telefone é o único contato garantido de quem pede sem conta: a loja
  // precisa conseguir ligar ou chamar no WhatsApp. A conta de dígitos é a
  // mesma da API (10 a 13: DDD e número, com ou sem o 55).
  const digitos = telefone.replace(/\D/g, '').length;
  const contatoOk = autenticado || (nome.trim() !== '' && digitos >= 10 && digitos <= 13);

  const enviar = async () => {
    if (!escolhido || (autenticado && !enterpriseId) || !contatoOk) return;
    setEnviando(true);
    try {
      if (autenticado && enterpriseId) {
        await pedirHorario({
          enterpriseId,
          productId,
          startsAt: escolhido,
          notes: observacao.trim(),
          technicianId: profissional || undefined,
        });
        setLinkDoPedido(null);
      } else {
        const feito = await pedirSemConta(nameStore, {
          productId,
          startsAt: escolhido,
          notes: observacao.trim(),
          technicianId: profissional || undefined,
          customerName: nome.trim(),
          customerPhone: telefone.trim(),
          customerEmail: email.trim() || undefined,
        });
        guardarToken(nameStore, feito.token);
        guardarContato({ nome: nome.trim(), telefone: telefone.trim(), email: email.trim() });
        setLinkDoPedido(`/${nameStore}/agendamentos/${feito.token}`);
      }
      setPedido(true);
      toast.success('Pedido enviado. A loja confirma por aqui.');
    } catch (e) {
      const erro = (
        e as {
          response?: { data?: { error?: { code?: string; details?: { field?: string }[] } } };
        }
      )?.response?.data?.error;
      const campo = erro?.details?.[0]?.field;
      // Um 422 no contato não é "horário indisponível": dizer isso mandaria a
      // cliente trocar de horário quando o problema é o telefone.
      const mensagem =
        campo === 'customerPhone'
          ? 'Confira o telefone: com DDD, só números.'
          : campo === 'customerName'
            ? 'Diga seu nome para a loja saber quem pediu.'
            : campo === 'customerEmail'
              ? 'Confira o e-mail, ou deixe em branco.'
              : (erro?.code && MENSAGENS_DE_ERRO[erro.code]) || 'Não foi possível pedir o horário.';
      toast.error(mensagem);
      if (campo?.startsWith('customer')) return;
      // O horário pode ter sido ocupado entre a lista e o clique; recarregar
      // mostra a realidade em vez de deixar na tela um botão que já não vale.
      carregar();
    } finally {
      setEnviando(false);
    }
  };

  if (pedido) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Check className="w-4 h-4 flex-shrink-0" />
          Pedido enviado — aguardando a loja confirmar
        </div>
        <p className="text-sm text-foreground">
          {/* O cliente precisa saber que pedir não é ter a hora: a loja ainda
              confirma, e só então o horário é dele. */}
          Seu horário só fica garantido depois que a loja confirmar.{' '}
          {linkDoPedido ? (
            <>
              Acompanhe e, se precisar, desmarque por{' '}
              <Link href={linkDoPedido} className="underline">
                este link
              </Link>
              . Ele também fica guardado neste aparelho, em{' '}
              <Link href={`/${nameStore}/agendamentos`} className="underline">
                Agenda
              </Link>
              .
            </>
          ) : (
            <>
              Você acompanha em{' '}
              <Link href={`/${nameStore}/agendamentos`} className="underline">
                Meus agendamentos
              </Link>
              .
            </>
          )}
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

  const opcoesDeEquipe = [{ id: '', name: 'Sem preferência' }, ...equipe];

  return (
    <div className="space-y-4">
      {equipe.length > 0 && (
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <User className="w-4 h-4" />
            Com quem?
          </p>
          <div className="flex flex-wrap gap-2">
            {opcoesDeEquipe.map((p) => {
              const ativo = p.id === profissional;
              return (
                <button
                  key={p.id || 'qualquer'}
                  type="button"
                  onClick={() => setProfissional(p.id)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    ativo ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card text-foreground'
                  }`}
                  aria-pressed={ativo}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
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
                  ativo ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card text-foreground'
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
        <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Clock className="w-4 h-4" />
          Horários livres
        </p>

        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        ) : erro ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200">{erro}</p>
          </div>
        ) : slots.length === 0 ? (
          // Dia fechado e dia lotado dão o mesmo resultado para quem olha, e a
          // frase cobre os dois sem inventar qual foi.
          <p className="text-sm text-muted-foreground">Nenhum horário livre neste dia. Tente outro.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setEscolhido(s)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  escolhido === s
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-card text-foreground'
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
          {!autenticado && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Seu contato</p>
                <button type="button" onClick={onPrecisaEntrar} className="text-sm underline text-foreground">
                  Já tenho conta
                </button>
              </div>
              <div>
                <label htmlFor="nome-agenda" className="block text-sm text-foreground mb-1">
                  Nome
                </label>
                <Input
                  id="nome-agenda"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="telefone-agenda" className="block text-sm text-foreground mb-1">
                  Telefone (WhatsApp)
                </label>
                <Input
                  id="telefone-agenda"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(21) 99999-8888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">É por ele que a loja confirma com você.</p>
              </div>
              <div>
                <label htmlFor="email-agenda" className="block text-sm text-foreground mb-1">
                  E-mail (opcional)
                </label>
                <Input
                  id="email-agenda"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="obs-agenda" className="block text-sm font-medium text-foreground mb-2">
              Alguma observação? (opcional)
            </label>
            <Textarea
              id="obs-agenda"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="min-h-[72px]"
            />
          </div>
          <Button
            onClick={enviar}
            disabled={enviando || !contatoOk || (autenticado && !enterpriseId)}
            className="w-full"
          >
            {enviando
              ? 'Enviando…'
              : `Pedir horário das ${hora(escolhido)}${
                  profissional ? ` com ${equipe.find((p) => p.id === profissional)?.name ?? ''}` : ''
                }`}
          </Button>
        </div>
      )}
    </div>
  );
}
