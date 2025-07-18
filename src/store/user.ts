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