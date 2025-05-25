import { atom } from "jotai";
import { Category } from "../types";

export const categoriesAtom = atom<Category[]>([]);
