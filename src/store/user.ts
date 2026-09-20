import { atomWithStorage } from "jotai/utils";

export interface UserType {
  id_user: string;
  name: string;
  email: string;
  /** URL pública da foto de perfil, ou "" quando não há foto. */
  avatar: string;
  phone: string;
  role: string;
  active: boolean;
}

export const userAtom = atomWithStorage<UserType | null>("user", null);

// Formato de GET /auth/me (meResponse, em dto.go).
//
// `avatarUrl` é opcional no tipo, e não obrigatório, porque o campo é mais
// novo que os outros: uma resposta de API anterior a ele (ou em cache) não o
// traz, e exigi-lo aqui quebraria a leitura inteira do perfil por causa de
// uma foto. Ausente vira "" — o mesmo que "sem foto".
export interface MeResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: string;
  active: boolean;
}

export function fromMeResponse(data: MeResponse): UserType {
  return {
    id_user: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatarUrl ?? "",
    phone: data.phone,
    role: data.role,
    active: data.active,
  };
}
