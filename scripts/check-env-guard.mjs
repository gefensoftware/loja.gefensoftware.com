// Verifica a guarda de ambiente: um build de PRODUÇÃO sem
// `NEXT_PUBLIC_API_URL` tem de FALHAR (src/api/index.ts). Publicar a vitrine
// sem saber para onde apontar não serve para nada, e a única forma de essa
// guarda não apodrecer é alguém tentar furá-la a cada verificação.
//
// A armadilha que este script existe para desarmar: o Next carrega os
// arquivos de ambiente locais sozinho, antes de qualquer código do projeto.
// Então `env -u NEXT_PUBLIC_API_URL npm run build` NÃO demonstra a falha numa
// máquina que tenha `.env.local` — a variável volta pelo arquivo e o build
// passa, e a verificação afirma o contrário do que mediu. Aqui os arquivos
// saem do caminho antes do build e voltam depois, aconteça o que acontecer.

import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const raiz = resolve(new URL('..', import.meta.url).pathname);

// A ordem de carga do Next num build de produção. Qualquer um deles pode
// devolver a variável pelas costas.
const ARQUIVOS = ['.env', '.env.local', '.env.production', '.env.production.local'];
const SUFIXO = '.check-env-guard.bak';

const movidos = [];
for (const nome of ARQUIVOS) {
  const de = resolve(raiz, nome);
  if (!existsSync(de)) continue;
  const para = de + SUFIXO;
  if (existsSync(para)) {
    console.error(`[guarda] ${nome}${SUFIXO} já existe; restaure-o à mão antes de rodar de novo.`);
    process.exit(1);
  }
  renameSync(de, para);
  movidos.push([de, para]);
}

let status;
try {
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_API_URL;
  const r = spawnSync('npx', ['next', 'build'], {
    cwd: raiz,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  status = r.status;
} finally {
  // Restaurar é obrigatório mesmo com o build estourando: o `.env.local` do
  // desenvolvedor não é do script, e perdê-lo custaria mais do que a
  // verificação vale.
  for (const [de, para] of movidos.reverse()) renameSync(para, de);
}

if (status === 0) {
  console.error(
    '\n[guarda] FALHOU: o build de produção passou SEM NEXT_PUBLIC_API_URL.\n' +
      'A guarda de src/api/index.ts não está agindo, e a vitrine pode ser\n' +
      'publicada apontando para lugar nenhum.',
  );
  process.exit(1);
}

console.log(
  `\n[guarda] OK: o build de produção falhou sem NEXT_PUBLIC_API_URL (saída ${status}), como tem de falhar.`,
);
