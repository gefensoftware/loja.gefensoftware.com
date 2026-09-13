// Fluxo de conta contra o contrato da API Go, num ponto só.
//
// O que mora aqui existe porque estava triplicado (ou esquecido) nas telas:
// sair da conta em três manipuladores que só mexiam no estado de interface,
// deixando o par de tokens no armazenamento e o refresh token vivo no
// servidor.
import { api, apiError, getAuth, setAuth, clearAuth, type Auth } from '@/api';
import { fromMeResponse, type UserType } from '@/store/user';

export interface Credenciais {
  email: string;
  password: string;
}

export interface ResultadoDeEntrada {
  tokens: Auth;
  user: UserType;
}

/**
 * Entra na conta. Uma ida só ao servidor: POST /auth/login já devolve o par
 * de tokens E o objeto do usuário (loginResponse embute tokenResponse e
 * userResponse — internal/adapters/in/http/dto.go), então não há por que
 * perguntar de novo em GET /auth/me.
 *
 * Isso não é só economia: a chamada extra vinha DEPOIS de gravar os tokens.
 * Se ela falhasse por rede ou erro de servidor, o usuário ficava autenticado
 * no nível do protocolo, com o par guardado, e o estado de interface nunca
 * era marcado — logado e deslogado ao mesmo tempo, com a mensagem errada.
 */
export async function entrar(credenciais: Credenciais): Promise<ResultadoDeEntrada> {
  const { data } = await api.post('/auth/login', credenciais);
  const tokens: Auth = { accessToken: data.accessToken, refreshToken: data.refreshToken };
  setAuth(tokens);
  return { tokens, user: fromMeResponse(data.user) };
}

/**
 * Traduz a falha de `entrar` para a mensagem que a tela mostra. Fica aqui
 * junto com `entrar` de propósito: o mapeamento estava duplicado literalmente
 * entre a tela de login e o modal, e a próxima correção arrumaria um e
 * esqueceria o outro.
 */
export function mensagemDeErroDeEntrada(e: unknown): string {
  switch (apiError(e)) {
    case 'INVALID_CREDENTIALS':
      return 'Email ou senha incorretos.';
    case 'USER_INACTIVE':
      return 'Sua conta está inativa. Fale com o suporte.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}


/**
 * Encerra a sessão: revoga o refresh token no servidor e apaga o par de
 * tokens do armazenamento local.
 *
 * A revogação é melhor esforço. Se a rede cair ou o servidor recusar, o
 * armazenamento é limpo do mesmo jeito — prender o usuário "logado" na
 * interface porque uma requisição falhou é pior do que um refresh token que
 * expira sozinho. Nunca lança.
 */
export async function sair(): Promise<void> {
  const atual = getAuth();
  if (atual?.refreshToken) {
    try {
      // POST /auth/logout, autenticado, corpo {refreshToken} → 204
      // (internal/adapters/in/http/auth_handler.go). A rota está fora do
      // fluxo de renovação: uma recusa aqui não deve gastar um refresh.
      await api.post('/auth/logout', { refreshToken: atual.refreshToken });
    } catch {
      // Ignorado de propósito — ver acima.
    }
  }
  clearAuth();
}
