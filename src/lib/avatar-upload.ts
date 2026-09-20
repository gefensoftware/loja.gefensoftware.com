// Envio da foto de perfil, em três passos: a loja assina com a API, manda os
// bytes direto ao bucket e só então registra a chave. O PUT do meio não passa
// pela API e não leva o cabeçalho de autenticação — a autorização é a própria
// assinatura da URL, que vale cinco minutos e só para aquela chave.
//
// É o mesmo fluxo de `image-upload.ts` no portal, para imagem de produto e de
// loja. Os dois projetos são aplicações separadas, sem pacote comum, então a
// forma se repete de propósito; o que NÃO se repete é a regra de segurança,
// que mora inteira no servidor (validarChave, em internal/core/service/
// imagem.go). O cliente confere tipo e tamanho só para dar erro imediato em
// vez de gastar uma ida à API.
import { api } from '@/api';
import { fromMeResponse, type MeResponse, type UserType } from '@/store/user';

// Aceitos por POST /users/me/avatar/presign. Conferidos aqui também para a
// pessoa saber na hora que aquele arquivo não serve.
export const TIPOS_ACEITOS = ['image/webp', 'image/jpeg', 'image/png'];

// O limite da API é 10 MB, mas ele vale para o que sai daqui — e o que sai
// daqui é sempre um quadrado de 512px, que não chega perto disso. O limite
// conferido no cliente é o do arquivo ESCOLHIDO, e serve para recusar o vídeo
// ou o RAW de 80 MB antes de tentar decodificá-lo na memória do celular.
export const TAMANHO_MAXIMO_ESCOLHIDO = 25 * 1024 * 1024;

/** Lado do quadrado final, em pixels. O avatar maior que aparece na tela tem
 *  128px de CSS; 512 cobre telas de densidade 3x sem virar peso de sobra. */
const LADO = 512;

export type ErroDeFoto = 'tipo' | 'tamanho' | 'leitura' | 'envio';

export class FotoInvalida extends Error {
  constructor(readonly motivo: ErroDeFoto) {
    super(motivo);
    this.name = 'FotoInvalida';
  }
}

/**
 * Corta o centro da imagem num quadrado e reduz para 512px.
 *
 * O corte central é a escolha que dispensa tela de recorte: a foto de perfil
 * quase sempre tem o rosto no meio, e as bordas que sobram num retrato ou
 * numa paisagem são justamente o que o círculo do avatar cortaria de
 * qualquer jeito. Quem estiver fora do centro fica mal enquadrado — é o
 * preço conhecido de não construir o recorte manual.
 */
async function paraQuadradoWebP(file: File): Promise<Blob> {
  const bitmap = await carregarImagem(file);

  // O lado do quadrado é o menor dos dois: é o maior recorte central que
  // cabe inteiro dentro da imagem, seja ela retrato ou paisagem.
  const lado = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - lado) / 2;
  const sy = (bitmap.height - lado) / 2;

  const canvas = document.createElement('canvas');
  // Nunca AMPLIA: uma foto de 200px vira um quadrado de 200px, não de 512
  // esticados. Esticar só gastaria banda para piorar a imagem.
  canvas.width = canvas.height = Math.min(LADO, lado);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new FotoInvalida('leitura');
  ctx.drawImage(bitmap, sx, sy, lado, lado, 0, 0, canvas.width, canvas.height);

  // WebP primeiro, JPEG como reserva. `toBlob` de um tipo que o navegador
  // não exporta não falha: ele devolve PNG silenciosamente, e um PNG de
  // fotografia é várias vezes maior. Conferir `blob.type` é o que pega isso.
  for (const tipo of ['image/webp', 'image/jpeg']) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, tipo, 0.85));
    if (blob && blob.type === tipo) return blob;
  }
  throw new FotoInvalida('leitura');
}

// createImageBitmap respeita a orientação EXIF quando recebe a opção; sem
// ela, foto tirada de lado no celular chegaria deitada. O caminho pelo
// <img> é a reserva para navegador sem createImageBitmap.
async function carregarImagem(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // cai no <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new FotoInvalida('leitura'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Confere o arquivo escolhido antes de qualquer trabalho pesado. */
export function conferirArquivo(file: File): void {
  if (!TIPOS_ACEITOS.includes(file.type)) throw new FotoInvalida('tipo');
  if (file.size > TAMANHO_MAXIMO_ESCOLHIDO) throw new FotoInvalida('tamanho');
}

/**
 * Envia a foto e devolve o usuário já atualizado.
 *
 * A API responde a confirmação com o perfil inteiro (selfResponse), então a
 * tela atualiza a foto sem uma segunda ida a /auth/me — e sem construir a
 * URL por conta própria, que é o tipo de suposição que quebra no dia em que
 * o endereço público do bucket mudar.
 */
export async function enviarFotoDePerfil(file: File): Promise<UserType> {
  conferirArquivo(file);
  const blob = await paraQuadradoWebP(file);

  const { data: assinado } = await api.post<{ uploadUrl: string; key: string; expiresIn: number }>(
    '/users/me/avatar/presign',
    { contentType: blob.type, size: blob.size },
  );

  const resposta = await fetch(assinado.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'content-type': blob.type },
  });
  if (!resposta.ok) throw new FotoInvalida('envio');

  const { data } = await api.post<MeResponse>('/users/me/avatar', { key: assinado.key });
  return fromMeResponse(data);
}

/** Remove a foto. A API devolve 204 mesmo quando não havia foto. */
export async function removerFotoDePerfil(): Promise<void> {
  await api.delete('/users/me/avatar');
}
