import { atomWithStorage } from "jotai/utils";

export const openStoreAtom = atomWithStorage<boolean>("openStore", false);