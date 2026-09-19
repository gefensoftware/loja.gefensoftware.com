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
  emailContato: 'gefensoftware@gmail.com',

  /** Canal do Encarregado (DPO), art. 41 da LGPD. Pode ser o mesmo endereço
   *  do contato geral, mas precisa estar publicado de forma clara e atender
   *  os pedidos de titular nos prazos do art. 19. */
  emailEncarregado: 'gefensoftware@gmail.com',
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
/**
 * Identificador da versão de cada documento. É o que fica gravado no aceite,
 * e é ele que dá sentido ao registro: "aceitou em 19/09/2026" não diz o que
 * estava escrito naquele dia; "aceitou a versão 2026-09-19" diz.
 *
 * O histórico do texto não vive aqui — vive no git. Estas constantes são o
 * ponteiro: dada uma versão, o texto correspondente é o de
 * `src/content/legal/` no commit em que a constante passou a valer.
 *
 * REGRA: mudou o corpo do documento, muda a versão dele. Alterar a redação
 * sem trocar a versão faz dois textos diferentes responderem pelo mesmo
 * identificador — e aí o registro de aceite deixa de provar qualquer coisa.
 * Correção de digitação que não altera o sentido pode ficar, desde que seja
 * mesmo isso.
 *
 * Formato ISO (AAAA-MM-DD), não a data por extenso de VIGENCIA: este valor
 * atravessa a API e um banco, onde ordenação e comparação importam.
 */
export const TERMOS_VERSAO = '2026-09-19';
export const PRIVACIDADE_VERSAO = '2026-09-19';

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
