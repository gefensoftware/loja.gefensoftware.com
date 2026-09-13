import axios from "axios";

// A URL da API vem do ambiente: a vitrine não tem por que carregar um
// endereço de produção embutido no bundle. Em produção, a ausência da
// variável é um erro de build — publicar sem ela deixaria a vitrine
// apontando para lugar nenhum.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error(
    'NEXT_PUBLIC_API_URL não está definida. Um build de produção sem ela ' +
    'publicaria uma vitrine apontando para lugar nenhum. Defina a variável ' +
    'no ambiente de build (ver README).'
  );
}

const RESOLVED = BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: RESOLVED,
})

// API para uso no servidor (sem interceptor)
export const serverApi = axios.create({
  baseURL: RESOLVED,
})

// --- Autenticação ---
//
// O contrato novo é um par: token de acesso curto e token de atualização
// opaco que rotaciona a cada uso.
export type Auth = { accessToken: string; refreshToken: string };

const CHAVE = 'auth';

// As três funções de armazenamento têm a mesma guarda de ambiente: em
// componente de servidor não existe `localStorage`, e uma gravação sem
// guarda derruba a renderização em vez de simplesmente não persistir.
export function getAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? (JSON.parse(cru) as Auth) : null;
  } catch {
    return null;
  }
}

export function setAuth(a: Auth) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAVE, JSON.stringify(a));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE);
}

// --- Fim de sessão involuntário ---
//
// Quando a renovação falha, o par de tokens é apagado e a aplicação precisa
// saber disso para reconciliar o estado de interface. Um sinal só, emitido
// num ponto só, em vez de N limpezas idempotentes sem ninguém ouvindo.
type OuvinteDeFimDeSessao = () => void;

const ouvintesDeFimDeSessao = new Set<OuvinteDeFimDeSessao>();

/** Registra um ouvinte; devolve a função que o remove. */
export function aoFimDeSessao(ouvinte: OuvinteDeFimDeSessao): () => void {
  ouvintesDeFimDeSessao.add(ouvinte);
  return () => {
    ouvintesDeFimDeSessao.delete(ouvinte);
  };
}

function emitirFimDeSessao() {
  for (const ouvinte of Array.from(ouvintesDeFimDeSessao)) {
    ouvinte();
  }
}

// Uma renovação de cada vez. Sem isso, duas 401 simultâneas disparam duas
// renovações com o mesmo token de atualização; a segunda usa um token já
// revogado pela rotação e o cliente é deslogado no meio da navegação.
let refreshInFlight: Promise<Auth> | null = null;

async function refreshAuth(): Promise<Auth> {
  if (!refreshInFlight) {
    const atual = getAuth();
    // Sem token de atualização guardado não há o que renovar: mandar
    // `refreshToken: undefined` gasta uma ida garantida ao servidor para
    // voltar 401 com o mesmo desfecho.
    if (!atual?.refreshToken) {
      throw new Error('sem token de atualização guardado');
    }
    refreshInFlight = api
      .post('/auth/refresh', { refreshToken: atual.refreshToken })
      .then(({ data }) => {
        const novo: Auth = { accessToken: data.accessToken, refreshToken: data.refreshToken };
        setAuth(novo);
        return novo;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// Rotas de autenticação: nunca passam pelo fluxo de renovação. Um token de
// atualização obsoleto no armazenamento não pode disparar renovação numa
// tentativa de login, senão queima a sessão de outra pessoa. O logout entra
// na lista pelo mesmo motivo inverso: uma recusa ao revogar não deve
// disparar uma renovação que só existe para ser jogada fora em seguida.
const ROTAS_SEM_RENOVACAO = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Casamento por caminho exato, não por substring: `/auth/login` como
// pedaço de uma URL maior (um query string, um proxy com prefixo) não pode
// isentar uma rota que precisa de renovação.
function caminhoDe(url: string): string {
  try {
    return new URL(url, RESOLVED).pathname;
  } catch {
    return url;
  }
}

function ehRotaDeAutenticacao(url?: string): boolean {
  if (!url) return false;
  return ROTAS_SEM_RENOVACAO.includes(caminhoDe(url));
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = getAuth();
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
  }
  return config;
});

// O que significa "token expirado", e o que não significa.
//
// 401 é status, não motivo. A API devolve 401 por motivo de negócio numa rota
// que não está isenta: `PATCH /users/me/password` com a senha atual errada
// responde 401 com `INVALID_CREDENTIALS` (internal/core/service/
// user_service.go), e a tela de perfil chama essa rota por este cliente.
//
// O discriminador é barato e limpo: o middleware de autenticação da API emite
// SEMPRE `UNAUTHORIZED` (internal/adapters/in/http/middleware.go), nunca
// `INVALID_CREDENTIALS`. Então é o código, e não o status, que autoriza
// gastar uma renovação.
//
// Condicionar ao status custava duas coisas ao errar a senha atual: com a
// renovação funcionando, a senha errada era reenviada depois de rotacionar o
// par de tokens — rotação a cada erro de digitação; com a renovação falhando,
// o cliente era expulso e via mensagem genérica, porque o erro rejeitado era
// o da renovação e o código de negócio se perdia no caminho.
function ehTokenExpirado(error: unknown): boolean {
  const axiosLike = error as { response?: { status?: number } };
  return axiosLike?.response?.status === 401 && apiError(error) === 'UNAUTHORIZED';
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    if (
      ehTokenExpirado(error) &&
      original &&
      !original._retry &&
      !ehRotaDeAutenticacao(original.url)
    ) {
      original._retry = true;
      try {
        const novo = await refreshAuth();
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${novo.accessToken}`;
        return api(original);
      } catch {
        clearAuth();
        emitirFimDeSessao();
        // O erro ORIGINAL, não o da renovação: quem chamou pediu aquela
        // rota, e é o código daquela resposta que a tela sabe traduzir. A
        // falha da renovação é detalhe interno deste interceptor, e já está
        // contada no sinal de fim de sessão acima.
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// --- Erros ---
//
// A API devolve {"error":{"code","message","details?","requestId?"}}, com o
// código em MAIÚSCULAS. Confirmado em internal/core/domain/errors.go.
export function apiError(e: unknown): string {
  const axiosLike = e as { response?: { data?: { error?: { code?: string } } } };
  return axiosLike?.response?.data?.error?.code ?? '';
}

export function apiErrorDetails(e: unknown): { field: string; rule: string }[] {
  const axiosLike = e as { response?: { data?: { error?: { details?: { field: string; rule: string }[] } } } };
  return axiosLike?.response?.data?.error?.details ?? [];
}
