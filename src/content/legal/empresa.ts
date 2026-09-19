// Dados da empresa usados pelos Termos de Uso e pela Política de Privacidade.
//
// Ficam num arquivo só de propósito: razão social, CNPJ e endereço aparecem
// em vários pontos dos dois documentos, e um dado desencontrado entre eles é
// exatamente o erro que invalida a informação na prática — o titular deixa de
// saber a quem se dirigir.
//
// Os dados societários vêm do comprovante de inscrição no CNPJ. Os endereços
// de e-mail NÃO vêm de lá: o que consta no cartão CNPJ é o da contabilidade,
// que não atende titular de dado nem usuário da plataforma.

export const EMPRESA = {
  nomeFantasia: 'Gefen Software',
  razaoSocial: 'GEFEN SOFTWARE LTDA',
  cnpj: '68.672.903/0001-52',
  endereco:
    'Rua Visconde do Rio Branco, 1488, Conj. 909, Andar 09, ' +
    'Condomínio Universe Life Square, Bloco Comercial, Centro, ' +
    'Curitiba/PR, CEP 80.420-210',

  /** Canal geral de atendimento — dúvidas sobre os Termos, conta, suporte. */
  emailContato: '[E-MAIL DE CONTATO]',

  /** Canal do Encarregado (DPO), art. 41 da LGPD. Pode ser o mesmo endereço
   *  do contato geral, mas precisa estar publicado de forma clara e atender
   *  os pedidos de titular nos prazos do art. 19. */
  emailEncarregado: '[E-MAIL DO ENCARREGADO]',
  nomeEncarregado: '[NOME DO ENCARREGADO]',

  site: 'https://gefensoftware.com',
  plataforma: 'https://loja.gefensoftware.com',

  /** Comarca eleita no foro dos Termos — a da sede. */
  foro: 'Curitiba/PR',
} as const;

/** Data a partir da qual a versão atual dos documentos passa a valer. */
export const VIGENCIA = '19 de setembro de 2026';

/** Data da última revisão do texto. Mudou o texto, muda aqui. */
export const ULTIMA_ATUALIZACAO = '19 de setembro de 2026';

/**
 * Campos ainda não preenchidos. O aviso em desenvolvimento existe para que um
 * deploy com placeholder não passe despercebido: um documento legal publicado
 * com "[E-MAIL DO ENCARREGADO]" é pior do que não ter o documento, porque
 * anuncia um canal que não existe.
 */
export const PENDENCIAS = Object.entries({ ...EMPRESA, VIGENCIA, ULTIMA_ATUALIZACAO })
  .filter(([, valor]) => typeof valor === 'string' && valor.startsWith('['))
  .map(([chave]) => chave);

if (process.env.NODE_ENV !== 'production' && PENDENCIAS.length > 0) {
  console.warn(
    '[legal] Pendências em src/content/legal/empresa.ts: ' +
      PENDENCIAS.join(', ') +
      '. Os documentos vão ao ar com placeholders visíveis.',
  );
}
