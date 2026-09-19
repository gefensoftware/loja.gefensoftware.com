import type { Metadata } from 'next';
import PaginaLegal from '@/components/legal/PaginaLegal';
import { politicaDePrivacidade } from '@/content/legal/privacidade';
import { EMPRESA } from '@/content/legal/empresa';

// Ver a nota em `termos-de-uso/page.tsx` sobre a rota estática acima de
// `/[name_store]`.
export const metadata: Metadata = {
  title: `Política de Privacidade | ${EMPRESA.nomeFantasia}`,
  description:
    'Como a Gefen Software coleta, usa, compartilha e protege dados pessoais na ' +
    'plataforma de catálogo digital, e como exercer seus direitos sob a LGPD.',
  alternates: { canonical: `${EMPRESA.plataforma}/politica-de-privacidade` },
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return <PaginaLegal documento={politicaDePrivacidade} />;
}
