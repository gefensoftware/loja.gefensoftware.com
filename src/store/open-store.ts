import { atomWithStorage } from "jotai/utils";
import type { BusinessDay, Weekday } from "@/types/catalog";

// Estado de interface (aberta/fechada); quem escreve aqui é quem calculou a
// partir de `businessHours` — ver `estaAberta` abaixo. Sem escrita, o valor
// persistido fica solto e mentindo para o próximo visitante.
export const openStoreAtom = atomWithStorage<boolean>("openStore", false);

// `Date.getDay()` começa em domingo (0); o contrato começa a semana em
// segunda mas nomeia os dias, então o índice serve só para achar o nome.
const DIAS_DA_SEMANA: Weekday[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

/**
 * Calcula se a loja está aberta agora, a partir do `hours` devolvido pela
 * rota pública da empresa (enterpriseResponse.Hours). Não há vigência
 * resolvida pelo servidor aqui — ao contrário da promoção, a API devolve o
 * horário cru e quem decide "aberta agora" é o cliente, no fuso do
 * navegador de quem está olhando a vitrine.
 */
export function estaAberta(hours: BusinessDay[], agora: Date = new Date()): boolean {
  const diaAtual = DIAS_DA_SEMANA[agora.getDay()];
  const dia = hours.find((d) => d.day === diaAtual);
  if (!dia || dia.isClosed) return false;

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  return dia.slots.some((slot) => {
    const [horaAbre, minutoAbre] = slot.open.split(':').map(Number);
    const [horaFecha, minutoFecha] = slot.close.split(':').map(Number);
    const abre = horaAbre * 60 + minutoAbre;
    const fecha = horaFecha * 60 + minutoFecha;
    return minutosAgora >= abre && minutosAgora <= fecha;
  });
}
