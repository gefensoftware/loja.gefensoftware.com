// A memória, NESTE navegador, dos horários pedidos sem conta.
//
// Quem pede sem conta não tem "Meus agendamentos" no servidor: o que liga a
// cliente ao pedido é o token do link de acompanhamento, que só volta uma
// vez, na resposta do pedido. Guardar os tokens aqui é o que deixa a
// cliente voltar amanhã, abrir "Agenda" e ver se a loja confirmou — sem ter
// guardado link nenhum.
//
// É conveniência, não registro: um navegador anônimo ou com os dados
// limpos volta vazio, e o link continua valendo. Por isso toda leitura e
// escrita é protegida, e a tela funciona inteira sem nada daqui.

const MAXIMO = 20;

const chaveDosTokens = (nameStore: string) => `agendamentos-sem-conta:${nameStore}`;
const CHAVE_DO_CONTATO = 'contato-sem-conta';

export function tokensGuardados(nameStore: string): string[] {
  try {
    const bruto = window.localStorage.getItem(chaveDosTokens(nameStore));
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/** Guarda o token no topo da lista, sem repetir. */
export function guardarToken(nameStore: string, token: string): void {
  try {
    const lista = [token, ...tokensGuardados(nameStore).filter((t) => t !== token)].slice(0, MAXIMO);
    window.localStorage.setItem(chaveDosTokens(nameStore), JSON.stringify(lista));
  } catch {
    // Sem armazenamento, o link do pedido continua sendo o caminho.
  }
}

/** Esquece o token que o servidor não reconhece mais. */
export function esquecerToken(nameStore: string, token: string): void {
  try {
    const lista = tokensGuardados(nameStore).filter((t) => t !== token);
    window.localStorage.setItem(chaveDosTokens(nameStore), JSON.stringify(lista));
  } catch {
    // idem
  }
}

export type ContatoSemConta = { nome: string; telefone: string; email: string };

/** O último contato digitado, para a segunda marcação não pedir tudo de novo. */
export function contatoGuardado(): ContatoSemConta {
  try {
    const bruto = window.localStorage.getItem(CHAVE_DO_CONTATO);
    const c = bruto ? JSON.parse(bruto) : {};
    return {
      nome: typeof c.nome === 'string' ? c.nome : '',
      telefone: typeof c.telefone === 'string' ? c.telefone : '',
      email: typeof c.email === 'string' ? c.email : '',
    };
  } catch {
    return { nome: '', telefone: '', email: '' };
  }
}

export function guardarContato(c: ContatoSemConta): void {
  try {
    window.localStorage.setItem(CHAVE_DO_CONTATO, JSON.stringify(c));
  } catch {
    // idem
  }
}
