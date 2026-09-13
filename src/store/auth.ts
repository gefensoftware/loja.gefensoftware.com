import { atomWithStorage } from "jotai/utils";

export type AuthType = {
  access_token: string | null;
  isAuthenticated: boolean;
  id_enterprise: string | null;
}

// Chave de armazenamento própria ("auth-ui"), distinta de "auth": a partir
// desta fundação, "auth" no localStorage é o par de tokens gerenciado por
// getAuth/setAuth/clearAuth (src/api/index.ts), que o interceptor do axios
// lê a cada requisição. Este átomo é só um espelho para a UI (mostrar
// "Entrar" vs. o menu do usuário); persistir os dois sob a mesma chave faria
// um sobrescrever o formato do outro.
export const authAtom = atomWithStorage<AuthType>("auth-ui", {
  access_token: null,
  isAuthenticated: false,
  id_enterprise: null
});
