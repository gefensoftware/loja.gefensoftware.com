import { atomWithStorage } from "jotai/utils";

export interface UserType {
  id_user: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  role: string;
  active: boolean;
}

export const userAtom = atomWithStorage<UserType | null>("user", null);

// Formato de GET /auth/me (meResponse, em dto.go). A API não tem conceito de
// avatar; o campo local fica sempre vazio.
export interface MeResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
}

export function fromMeResponse(data: MeResponse): UserType {
  return {
    id_user: data.id,
    name: data.name,
    email: data.email,
    avatar: "",
    phone: data.phone,
    role: data.role,
    active: data.active,
  };
}