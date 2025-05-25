import { atomWithStorage } from "jotai/utils";

export type AuthType = {
  access_token: string | null;
  isAuthenticated: boolean;
  id_enterprise: string | null;
}

export const authAtom = atomWithStorage("auth", {
  access_token: null,
  isAuthenticated: false,
  id_enterprise: null
});
