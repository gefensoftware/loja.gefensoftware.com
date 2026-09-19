import type { Metadata } from 'next';
import PaginaLegal from '@/components/legal/PaginaLegal';
import { termosDeUso } from '@/content/legal/termos';
import { EMPRESA } from '@/content/legal/empresa';

// Rota estática acima de `/[name_store]`: no App Router o segmento literal
// vence o dinâmico, então `/termos-de-uso` chega aqui e não na vitrine de uma
// loja com esse slug. O documento é da plataforma, não de uma loja — por isso
// vive na raiz e não dentro do grupo da vitrine.
export const metadata: Metadata = {
  title: `Termos de Uso | ${EMPRESA.nomeFantasia}`,
  description:
    'Regras de uso da plataforma de catálogo digital da Gefen Software: ' +
    'conta, pedidos, agendamentos, orçamentos e responsabilidades de cada parte.',
  alternates: { canonical: `${EMPRESA.plataforma}/termos-de-uso` },
  robots: { index: true, follow: true },
};

export default function TermosDeUsoPage() {
  return <PaginaLegal documento={termosDeUso} />;
}
