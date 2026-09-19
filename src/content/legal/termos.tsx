import { EMPRESA, VIGENCIA, ULTIMA_ATUALIZACAO, TERMOS_VERSAO } from './empresa';
import type { DocumentoLegal } from './tipos';

/**
 * Termos de Uso da vitrine (loja.gefensoftware.com).
 *
 * O texto descreve o produto que existe, não um e-commerce genérico. Três
 * fatos do código moldam quase todas as cláusulas:
 *
 * 1. A vitrine é multiloja (`/[name_store]`). Quem vende é o estabelecimento;
 *    a Gefen fornece o software. Misturar os dois papéis criaria
 *    responsabilidade solidária por produto, preço e entrega que o produto não
 *    comporta.
 * 2. O pedido não é gravado: `lib/pedido.ts` monta uma mensagem e abre o
 *    WhatsApp da loja. Não há checkout, não há pagamento, não há entrega
 *    intermediada — e o documento não pode prometer nenhum dos três.
 * 3. Agendamento e orçamento são pedidos, não confirmações: em `types/agenda.ts`
 *    só `confirmed` segura horário, e em `types/budget.ts` a loja é quem cota.
 */
export const termosDeUso: DocumentoLegal = {
  titulo: 'Termos de Uso',
  resumo:
    'Estas são as regras de uso da plataforma de catálogo digital da Gefen Software. ' +
    'O ponto mais importante está na seção 4: a Gefen fornece o software, e quem vende ' +
    'é o estabelecimento cujo catálogo você está acessando.',
  vigencia: VIGENCIA,
  atualizadoEm: ULTIMA_ATUALIZACAO,
  versao: TERMOS_VERSAO,
  secoes: [
    {
      id: 'aceitacao',
      titulo: 'Aceitação destes Termos',
      corpo: (
        <>
          <p>
            Estes Termos de Uso regem o acesso e a utilização da plataforma de
            catálogo digital disponibilizada em{' '}
            <a href={EMPRESA.plataforma}>{EMPRESA.plataforma}</a> e nos endereços
            dela derivados (a <strong>&ldquo;Plataforma&rdquo;</strong>), operada por{' '}
            <strong>{EMPRESA.razaoSocial}</strong>, inscrita no CNPJ sob o nº{' '}
            {EMPRESA.cnpj}, com sede em {EMPRESA.endereco} (a{' '}
            <strong>&ldquo;Gefen&rdquo;</strong>).
          </p>
          <p>
            Ao acessar a Plataforma, navegar por um catálogo, montar um carrinho,
            criar uma conta ou enviar um pedido, agendamento ou solicitação de
            orçamento, você declara que leu, entendeu e concorda com estes Termos
            e com a{' '}
            <a href="/politica-de-privacidade">Política de Privacidade</a>.
          </p>
          <p>
            Se você não concorda com alguma disposição, não utilize a Plataforma.
          </p>
        </>
      ),
    },
    {
      id: 'definicoes',
      titulo: 'Definições',
      corpo: (
        <ul>
          <li>
            <strong>Plataforma:</strong> o software de catálogo digital operado
            pela Gefen, que permite a estabelecimentos publicarem seus produtos e
            serviços e a clientes consultá-los.
          </li>
          <li>
            <strong>Estabelecimento</strong> (ou <strong>Loja</strong>): a pessoa
            física ou jurídica que contrata a Gefen para publicar seu catálogo e
            que figura identificada na página acessada. É quem oferece e vende os
            produtos e serviços.
          </li>
          <li>
            <strong>Usuário</strong> (ou <strong>Cliente</strong>): quem acessa a
            Plataforma para consultar um catálogo, montar carrinho, enviar pedido,
            solicitar agendamento ou orçamento.
          </li>
          <li>
            <strong>Conta:</strong> o cadastro pessoal do Usuário na Plataforma,
            identificado por e-mail e senha.
          </li>
          <li>
            <strong>Pedido:</strong> a mensagem com os itens do carrinho que o
            Usuário envia ao Estabelecimento por aplicativo de mensagens.
          </li>
        </ul>
      ),
    },
    {
      id: 'o-que-a-plataforma-faz',
      titulo: 'O que a Plataforma faz',
      corpo: (
        <>
          <p>A Plataforma permite ao Usuário:</p>
          <ul>
            <li>consultar o catálogo de produtos e serviços de um Estabelecimento;</li>
            <li>montar um carrinho com os itens de interesse;</li>
            <li>
              enviar o conteúdo do carrinho ao Estabelecimento como mensagem por
              aplicativo de mensagens;
            </li>
            <li>
              solicitar agendamento de um horário, quando o Estabelecimento
              oferecer essa opção;
            </li>
            <li>
              solicitar orçamento de um produto ou serviço, quando o
              Estabelecimento oferecer essa opção;
            </li>
            <li>
              criar e administrar uma Conta, com histórico dos seus agendamentos e
              orçamentos.
            </li>
          </ul>
          <p>
            <strong>A Plataforma não processa pagamentos.</strong> Não há
            checkout, cobrança, cartão, boleto, Pix ou qualquer meio de pagamento
            dentro da Plataforma. Nenhum dado de pagamento é solicitado, coletado
            ou armazenado por nós.
          </p>
          <p>
            <strong>A Plataforma não realiza entregas</strong> nem intermedeia
            logística, frete ou retirada.
          </p>
        </>
      ),
    },
    {
      id: 'papel-das-partes',
      titulo: 'Quem responde pelo quê',
      corpo: (
        <>
          <p>
            Esta é a seção mais importante destes Termos. A Gefen fornece o
            software; o Estabelecimento conduz a relação de consumo.
          </p>
          <p>
            <strong>O Estabelecimento é o fornecedor</strong> dos produtos e
            serviços anunciados no catálogo que você acessa, e é o único
            responsável por:
          </p>
          <ul>
            <li>
              a existência, a descrição, a qualidade, a origem, a validade e a
              conformidade dos produtos e serviços;
            </li>
            <li>
              os preços praticados, promoções, taxas, formas e condições de
              pagamento;
            </li>
            <li>
              a disponibilidade dos itens e a decisão de aceitar, recusar ou
              alterar um pedido, agendamento ou orçamento;
            </li>
            <li>
              a emissão de nota fiscal, a entrega, a execução do serviço, prazos,
              trocas, devoluções, garantia e atendimento pós-venda;
            </li>
            <li>
              o cumprimento da legislação aplicável à sua atividade, incluindo o
              Código de Defesa do Consumidor, e das obrigações sanitárias,
              tributárias e regulatórias correspondentes;
            </li>
            <li>
              o conteúdo que publica no catálogo — textos, fotos, marcas e demais
              materiais.
            </li>
          </ul>
          <p>
            <strong>A Gefen responde pela Plataforma</strong>: por disponibilizar
            o software, mantê-lo em funcionamento nos termos da seção{' '}
            <a href="#disponibilidade">8</a> e tratar os dados pessoais conforme a{' '}
            <a href="/politica-de-privacidade">Política de Privacidade</a>. A Gefen
            não é parte do contrato de compra e venda ou de prestação de serviço
            celebrado entre Usuário e Estabelecimento, não tem ingerência sobre
            preços ou estoque e não garante a conclusão de nenhuma negociação.
          </p>
          <p>
            Reclamações sobre produto, preço, prazo, cobrança, entrega, troca,
            devolução ou qualidade devem ser dirigidas diretamente ao
            Estabelecimento, cujos dados de contato constam da página do catálogo.
          </p>
        </>
      ),
    },
    {
      id: 'conta',
      titulo: 'Cadastro e Conta',
      corpo: (
        <>
          <p>
            A consulta ao catálogo e o envio de pedido por mensagem não exigem
            cadastro. A Conta é necessária para recursos que dependem de histórico,
            como agendamentos, solicitações de orçamento e carrinho salvo entre
            dispositivos.
          </p>
          <p>
            Para criar uma Conta, são solicitados nome, e-mail, telefone e senha.
            Ao se cadastrar, você declara que:
          </p>
          <ul>
            <li>
              tem ao menos 18 anos ou está representado ou assistido por seus pais
              ou responsável legal;
            </li>
            <li>
              as informações fornecidas são verdadeiras, completas e atuais, e se
              compromete a mantê-las atualizadas;
            </li>
            <li>
              os dados que informa são seus, ou você tem autorização de quem de
              direito para informá-los.
            </li>
          </ul>
          <p>
            A senha é pessoal e intransferível. Você é responsável por mantê-la em
            sigilo e por toda atividade realizada na sua Conta. Se suspeitar de
            acesso indevido, troque a senha imediatamente na tela de perfil e avise
            a Gefen em <a href={`mailto:${EMPRESA.emailContato}`}>{EMPRESA.emailContato}</a>.
          </p>
          <p>
            Você pode encerrar sua Conta a qualquer momento, solicitando a exclusão
            pelos canais da seção <a href="#contato">14</a>. O encerramento não
            afeta obrigações já assumidas com Estabelecimentos nem os registros que
            a Gefen precise conservar por exigência legal, conforme detalhado na{' '}
            <a href="/politica-de-privacidade#retencao">Política de Privacidade</a>.
          </p>
        </>
      ),
    },
    {
      id: 'pedidos',
      titulo: 'Pedidos, carrinho e preços',
      corpo: (
        <>
          <p>
            O carrinho é uma lista de intenção de compra. Montá-lo não reserva
            estoque, não congela preço e não cria obrigação para nenhuma das
            partes.
          </p>
          <p>
            Ao enviar o Pedido, a Plataforma monta uma mensagem com os itens
            escolhidos e abre a conversa com o Estabelecimento no aplicativo de
            mensagens. A partir daí,{' '}
            <strong>a negociação acontece fora da Plataforma</strong>: forma de
            pagamento, valor final, frete, prazo e confirmação são tratados
            diretamente entre você e o Estabelecimento, pelos canais dele.
          </p>
          <p>
            O envio da mensagem não constitui aceitação do pedido. A venda só se
            aperfeiçoa quando o Estabelecimento a confirma.
          </p>
          <p>
            Preços, descrições, fotos e disponibilidade são informados e mantidos
            pelo Estabelecimento. Podem mudar a qualquer tempo e podem conter
            incorreções ou desatualizações pelas quais a Gefen não responde. Em
            caso de divergência entre o valor exibido na Plataforma e o informado
            pelo Estabelecimento, prevalece o que for acordado entre vocês —
            observados os direitos do consumidor.
          </p>
        </>
      ),
    },
    {
      id: 'agendamentos-e-orcamentos',
      titulo: 'Agendamentos e orçamentos',
      corpo: (
        <>
          <p>
            <strong>Agendamento.</strong> Solicitar um horário não o reserva. A
            solicitação fica pendente até que o Estabelecimento a confirme, e só a
            confirmação segura o horário — mais de um Usuário pode pedir o mesmo
            horário, e apenas um o obterá. O Estabelecimento pode confirmar,
            recusar, remarcar ou cancelar, segundo a disponibilidade e as regras
            dele. Enquanto o agendamento estiver em aberto, você pode cancelá-lo
            pela Plataforma.
          </p>
          <p>
            <strong>Orçamento.</strong> A solicitação de orçamento é um pedido de
            cotação. O Estabelecimento pode apresentar um valor ou recusar-se a
            cotar. Apresentado o orçamento, cabe a você aceitá-lo ou recusá-lo. A
            Gefen não participa da formação do preço, não o valida e não garante
            que qualquer orçamento seja honrado.
          </p>
          <p>
            Faltas, atrasos, remarcações, cobranças por não comparecimento e
            execução do serviço são assunto entre você e o Estabelecimento.
          </p>
        </>
      ),
    },
    {
      id: 'uso-permitido',
      titulo: 'Uso permitido e condutas vedadas',
      corpo: (
        <>
          <p>
            A Plataforma deve ser usada de boa-fé, para as finalidades descritas na
            seção <a href="#o-que-a-plataforma-faz">3</a>. É vedado:
          </p>
          <ul>
            <li>
              usar a Plataforma para fim ilícito, fraudulento ou que viole direito
              de terceiro;
            </li>
            <li>
              enviar pedidos, agendamentos ou orçamentos falsos, em massa,
              automatizados ou em nome de outra pessoa sem autorização;
            </li>
            <li>
              acessar conta alheia, tentar burlar autenticação ou obter acesso não
              autorizado a qualquer parte da Plataforma ou de sua infraestrutura;
            </li>
            <li>
              empregar robôs, raspadores ou qualquer meio automatizado para extrair
              dados, salvo autorização prévia e escrita da Gefen;
            </li>
            <li>
              realizar engenharia reversa, descompilar, copiar ou criar obra
              derivada do software da Plataforma;
            </li>
            <li>
              sobrecarregar a Plataforma, interferir em seu funcionamento ou
              comprometer sua segurança;
            </li>
            <li>
              inserir código malicioso ou conteúdo ofensivo, discriminatório ou
              ilegal em campos de texto livre, como mensagens de orçamento e
              observações de agendamento.
            </li>
          </ul>
          <p>
            A Gefen pode suspender ou encerrar o acesso de quem descumprir estas
            regras, independentemente de aviso prévio quando a conduta representar
            risco a terceiros ou ao serviço, e sem prejuízo das medidas legais
            cabíveis.
          </p>
        </>
      ),
    },
    {
      id: 'disponibilidade',
      titulo: 'Disponibilidade, manutenção e alterações',
      corpo: (
        <>
          <p>
            A Gefen empreende esforços para manter a Plataforma disponível e
            funcionando, mas não garante operação ininterrupta ou livre de erros.
            O serviço pode ficar indisponível por manutenção programada,
            emergências, falhas de terceiros (conectividade, hospedagem, aplicativos
            de mensagens) ou eventos fora do controle razoável da Gefen.
          </p>
          <p>
            A Gefen pode, a qualquer tempo, alterar, suspender ou descontinuar
            funcionalidades da Plataforma, no todo ou em parte. Alterações
            relevantes e previsíveis serão comunicadas com antecedência razoável
            pelos canais disponíveis.
          </p>
          <p>
            A presença de um Estabelecimento na Plataforma depende do contrato dele
            com a Gefen. Encerrado esse contrato, o catálogo correspondente deixa
            de ser exibido.
          </p>
        </>
      ),
    },
    {
      id: 'propriedade-intelectual',
      titulo: 'Propriedade intelectual',
      corpo: (
        <>
          <p>
            O software da Plataforma, sua estrutura, código-fonte, interfaces,
            marcas, logotipos e demais elementos são de titularidade da Gefen ou de
            seus licenciantes, protegidos pela Lei nº 9.610/1998 e pela Lei nº
            9.609/1998. Estes Termos não transferem nenhum direito sobre eles.
          </p>
          <p>
            O conteúdo do catálogo — nome, marca, fotos, descrições e preços do
            Estabelecimento — é de titularidade do Estabelecimento ou de quem ele
            indicar. Ao publicá-lo, o Estabelecimento declara ter os direitos
            necessários e autoriza a Gefen a exibi-lo na Plataforma para essa
            finalidade.
          </p>
          <p>
            Se você entende que algum conteúdo publicado viola direito seu,
            escreva para{' '}
            <a href={`mailto:${EMPRESA.emailContato}`}>{EMPRESA.emailContato}</a>{' '}
            identificando o conteúdo, o direito violado e a sua titularidade.
          </p>
        </>
      ),
    },
    {
      id: 'links-e-terceiros',
      titulo: 'Serviços de terceiros',
      corpo: (
        <>
          <p>
            O envio do Pedido ocorre por aplicativo de mensagens de terceiro
            (WhatsApp). O uso desse aplicativo é regido pelos termos e pela política
            de privacidade do respectivo fornecedor, sobre os quais a Gefen não tem
            controle. A Gefen não acessa nem armazena o conteúdo das conversas que
            você mantém com o Estabelecimento nesse aplicativo.
          </p>
          <p>
            A Plataforma pode conter links para sites e serviços de terceiros. A
            Gefen não responde pelo conteúdo, pelas práticas de privacidade ou pela
            disponibilidade desses destinos.
          </p>
        </>
      ),
    },
    {
      id: 'responsabilidade',
      titulo: 'Limitação de responsabilidade',
      corpo: (
        <>
          <p>
            Nos limites permitidos pela legislação aplicável — e sem prejuízo dos
            direitos assegurados ao consumidor pelo Código de Defesa do Consumidor,
            que permanecem íntegros —, a Gefen não responde por:
          </p>
          <ul>
            <li>
              o cumprimento, o inadimplemento ou os vícios do contrato celebrado
              entre Usuário e Estabelecimento, incluindo produto, preço, pagamento,
              prazo, entrega e execução de serviço;
            </li>
            <li>
              informações incorretas, desatualizadas ou incompletas inseridas pelo
              Estabelecimento no catálogo;
            </li>
            <li>
              indisponibilidade, atraso ou falha decorrente de terceiros, de força
              maior ou de caso fortuito;
            </li>
            <li>
              danos decorrentes do uso da Conta por terceiro em razão de guarda
              inadequada da senha pelo Usuário.
            </li>
          </ul>
          <p>
            Nada nestes Termos exclui responsabilidade que a lei imponha de forma
            inafastável.
          </p>
        </>
      ),
    },
    {
      id: 'alteracoes',
      titulo: 'Alterações destes Termos',
      corpo: (
        <>
          <p>
            A Gefen pode alterar estes Termos para refletir mudanças na Plataforma,
            na legislação ou em suas práticas. A versão vigente estará sempre
            nesta página, com as datas de vigência e de última atualização no
            topo.
          </p>
          <p>
            Alterações relevantes serão comunicadas com antecedência razoável, por
            aviso na Plataforma ou por e-mail, quando houver Conta cadastrada. O uso
            da Plataforma após a entrada em vigor da nova versão significa
            concordância com ela; quem não concordar deve deixar de utilizá-la e
            pode solicitar o encerramento da Conta.
          </p>
        </>
      ),
    },
    {
      id: 'legislacao-e-foro',
      titulo: 'Legislação aplicável e foro',
      corpo: (
        <>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil,
            em especial a Lei nº 10.406/2002 (Código Civil), a Lei nº 8.078/1990
            (Código de Defesa do Consumidor), a Lei nº 12.965/2014 (Marco Civil da
            Internet) e a Lei nº 13.709/2018 (LGPD).
          </p>
          <p>
            Fica eleito o foro da comarca de {EMPRESA.foro} para dirimir
            controvérsias decorrentes destes Termos. Tratando-se de relação de
            consumo, o consumidor pode optar pelo foro do seu domicílio, nos termos
            do art. 101, I, do Código de Defesa do Consumidor.
          </p>
          <p>
            Se qualquer disposição destes Termos for considerada inválida ou
            inexequível, as demais permanecem em pleno vigor.
          </p>
        </>
      ),
    },
    {
      id: 'contato',
      titulo: 'Contato',
      corpo: (
        <>
          <p>
            Dúvidas sobre estes Termos podem ser encaminhadas para a Gefen:
          </p>
          <ul>
            <li>
              <strong>{EMPRESA.razaoSocial}</strong> — CNPJ {EMPRESA.cnpj}
            </li>
            <li>{EMPRESA.endereco}</li>
            <li>
              E-mail:{' '}
              <a href={`mailto:${EMPRESA.emailContato}`}>{EMPRESA.emailContato}</a>
            </li>
          </ul>
          <p>
            Para assuntos de dados pessoais, o canal do Encarregado está indicado
            na{' '}
            <a href="/politica-de-privacidade#encarregado">
              Política de Privacidade
            </a>
            .
          </p>
          <p>
            Para assuntos relativos a um pedido, agendamento ou orçamento
            específico, procure o Estabelecimento: os dados de contato dele estão na
            página do catálogo.
          </p>
        </>
      ),
    },
  ],
};
