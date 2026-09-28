import { anunciosAtivos } from '@/lib/anuncios';
import { EMPRESA, PRIVACIDADE } from './empresa';
import type { DocumentoLegal } from './tipos';

/**
 * Política de Privacidade da vitrine (loja.gefensoftware.com).
 *
 * O inventário da seção 3 foi levantado do código, não de um modelo: os campos
 * de conta são os de `store/user.ts` e do cadastro em `AuthModal.tsx`; os de
 * agendamento e orçamento são os de `types/agenda.ts` e `types/budget.ts`; o
 * que fica no navegador são as chaves gravadas em `api/index.ts` (`auth`),
 * `store/user.ts` (`user`) e `store/cart.ts`.
 *
 * Dois pontos que um texto genérico erraria:
 * - não há dado de pagamento em lugar nenhum — o pedido sai por mensagem
 *   (`lib/pedido.ts`) e a negociação acontece fora daqui;
 * - a sessão mora em localStorage, não em cookie. Anunciar "banner de cookies"
 *   seria descrever um mecanismo que a vitrine não usa.
 *
 * Anúncios: os trechos sob `anunciosAtivos` só existem quando o AdSense está
 * ligado (lib/anuncios.ts), e com eles a política muda de versão
 * (PRIVACIDADE em empresa.ts). O texto com anúncios promete duas coisas que
 * precisam existir no ar ANTES de a variável ser ligada:
 * - um aviso de consentimento na primeira visita a uma loja, e anúncios
 *   personalizados só depois do "aceito" (`requestNonPersonalizedAds` até lá);
 * - o link "Preferências de anúncios" no rodapé das lojas, que reabre esse
 *   aviso para mudar ou retirar a escolha.
 */
export const politicaDePrivacidade: DocumentoLegal = {
  titulo: 'Política de Privacidade',
  resumo:
    'Esta política explica quais dados pessoais a Gefen Software coleta na plataforma de ' +
    'catálogo digital, por que os coleta, com quem os compartilha e como você exerce seus ' +
    'direitos sob a LGPD. Não coletamos dados de pagamento.' +
    (anunciosAtivos
      ? ' As páginas das lojas exibem anúncios fornecidos pelo Google; ' +
        'anúncios personalizados só com o seu consentimento.'
      : ''),
  vigencia: PRIVACIDADE.vigencia,
  atualizadoEm: PRIVACIDADE.atualizadoEm,
  versao: PRIVACIDADE.versao,
  secoes: [
    {
      id: 'quem-trata',
      titulo: 'Quem trata seus dados',
      corpo: (
        <>
          <p>
            A plataforma de catálogo digital disponível em{' '}
            <a href={EMPRESA.plataforma}>{EMPRESA.plataforma}</a> (a{' '}
            <strong>&ldquo;Plataforma&rdquo;</strong>) é operada por{' '}
            <strong>{EMPRESA.razaoSocial}</strong>, CNPJ {EMPRESA.cnpj}, com sede
            em {EMPRESA.endereco} (a <strong>&ldquo;Gefen&rdquo;</strong>).
          </p>
          <p>
            A Plataforma é multiloja: cada endereço exibe o catálogo de um{' '}
            <strong>Estabelecimento</strong> diferente. Isso divide o tratamento
            em dois:
          </p>
          <ul>
            <li>
              <strong>A Gefen é controladora</strong> dos dados da sua Conta
              (nome, e-mail, telefone, senha), do seu carrinho salvo e dos
              registros técnicos de acesso à Plataforma. É a Gefen quem decide
              como esses dados são guardados e protegidos.
            </li>
            <li>
              <strong>O Estabelecimento é controlador</strong> dos dados que
              recebe para atender você — o agendamento que você pediu, o orçamento
              que solicitou, a conversa que vocês mantêm. Quanto a esses dados, a
              Gefen atua como <strong>operadora</strong>: trata-os por conta e
              ordem do Estabelecimento, nos limites do contrato firmado com ele.
            </li>
          </ul>
          <p>
            Na prática: pedidos sobre sua Conta na Plataforma, dirija a nós.
            Pedidos sobre um atendimento específico (cancelar um agendamento
            passado, saber por que um orçamento foi recusado), dirija ao
            Estabelecimento — e, se preferir, encaminhe a nós que repassamos.
          </p>
        </>
      ),
    },
    {
      id: 'dados-coletados',
      titulo: 'Quais dados coletamos',
      corpo: (
        <>
          <p>
            <strong>Dados que você fornece.</strong>
          </p>
          <ul>
            <li>
              <strong>Cadastro:</strong> nome, e-mail, telefone e senha. A senha é
              guardada apenas como resumo criptográfico (<em>hash</em>) — nem a
              Gefen nem o Estabelecimento conseguem lê-la.
            </li>
            <li>
              <strong>Perfil:</strong> alterações de nome e telefone que você faça
              depois do cadastro.
            </li>
            <li>
              <strong>Agendamentos:</strong> o produto ou serviço escolhido, a data
              e o horário solicitados e as observações que você escrever.
            </li>
            <li>
              <strong>Orçamentos:</strong> o produto ou serviço escolhido e a
              mensagem que você enviar ao Estabelecimento.
            </li>
            <li>
              <strong>Contato:</strong> o que você nos escrever por e-mail ao pedir
              suporte ou exercer um direito.
            </li>
          </ul>
          <p>
            <strong>Dados gerados pelo seu uso.</strong>
          </p>
          <ul>
            <li>
              <strong>Carrinho:</strong> os itens e quantidades que você adiciona.
              Com Conta, ficam salvos no servidor para que persistam entre
              aparelhos; sem Conta, ficam apenas no seu navegador.
            </li>
            <li>
              <strong>Histórico:</strong> o estado dos seus agendamentos e
              orçamentos (solicitado, confirmado, cotado, concluído, cancelado) e
              as datas correspondentes.
            </li>
          </ul>
          <p>
            <strong>Dados coletados automaticamente.</strong>
          </p>
          <ul>
            <li>
              <strong>Registros de acesso:</strong> endereço IP, data e hora da
              conexão, páginas acessadas, tipo e versão do navegador e do sistema
              operacional. A guarda desses registros é obrigação legal imposta pelo
              art. 15 do Marco Civil da Internet.
            </li>
            {anunciosAtivos && (
              <li>
                <strong>Dados de anúncios:</strong> nas páginas das lojas, o
                Google, que fornece os anúncios, coleta diretamente do seu
                navegador o endereço IP, identificadores de cookie e do
                dispositivo, a página visitada, dados do navegador e a sua
                interação com os anúncios (se foram exibidos e clicados). Esses
                dados vão direto ao Google; a Gefen recebe dele apenas relatórios
                agregados de exibição e receita, sem identificar você.
              </li>
            )}
          </ul>
          <p>
            <strong>O que não coletamos.</strong> A Plataforma{' '}
            <strong>não processa pagamentos</strong>: não pedimos nem armazenamos
            número de cartão, dados bancários ou chave Pix. Também não coletamos
            CPF, endereço residencial, geolocalização precisa nem dados sensíveis
            na acepção do art. 5º, II, da LGPD (origem racial, convicção religiosa,
            opinião política, dado de saúde, biometria, entre outros). Se você
            escrever informação desse tipo por conta própria num campo livre — a
            observação de um agendamento, por exemplo — ela será tratada como parte
            daquele atendimento; pedimos que evite.
          </p>
        </>
      ),
    },
    {
      id: 'finalidades',
      titulo: 'Por que usamos seus dados e com que base legal',
      corpo: (
        <>
          <p>
            A LGPD exige que todo tratamento tenha uma finalidade determinada e uma
            base legal (art. 7º). As nossas:
          </p>
          <ul>
            <li>
              <strong>Criar e manter sua Conta; autenticar seu acesso.</strong>{' '}
              Base: execução de contrato (art. 7º, V).
            </li>
            <li>
              <strong>
                Salvar seu carrinho e encaminhar seus pedidos de agendamento e
                orçamento ao Estabelecimento.
              </strong>{' '}
              Base: execução de contrato e procedimentos preliminares a pedido do
              titular (art. 7º, V).
            </li>
            <li>
              <strong>
                Enviar comunicações operacionais sobre seus agendamentos e
                orçamentos.
              </strong>{' '}
              Base: execução de contrato (art. 7º, V).
            </li>
            <li>
              <strong>Prestar suporte e responder às suas solicitações.</strong>{' '}
              Base: execução de contrato (art. 7º, V) e legítimo interesse (art.
              7º, IX).
            </li>
            <li>
              <strong>
                Manter a Plataforma segura: prevenir fraude, abuso e acesso
                indevido; investigar incidentes.
              </strong>{' '}
              Base: legítimo interesse (art. 7º, IX).
            </li>
            <li>
              <strong>
                Corrigir defeitos e entender, de forma agregada, quais recursos são
                usados.
              </strong>{' '}
              Base: legítimo interesse (art. 7º, IX).
            </li>
            <li>
              <strong>
                Guardar registros de acesso e atender a determinações de
                autoridade.
              </strong>{' '}
              Base: cumprimento de obrigação legal ou regulatória (art. 7º, II) e
              exercício regular de direitos (art. 7º, VI).
            </li>
            {anunciosAtivos && (
              <>
                <li>
                  <strong>
                    Exibir anúncios personalizados nas páginas das lojas.
                  </strong>{' '}
                  Base: consentimento (art. 7º, I), pedido no aviso exibido na
                  sua primeira visita a uma loja.
                </li>
                <li>
                  <strong>
                    Exibir anúncios não personalizados, limitar a repetição de
                    um mesmo anúncio, detectar tráfego fraudulento e medir
                    resultados de forma agregada.
                  </strong>{' '}
                  Base: legítimo interesse (art. 7º, IX) — os anúncios são o
                  que custeia a Plataforma. Você pode se opor, como explicado em{' '}
                  <a href="#armazenamento-no-dispositivo">
                    O que guardamos no seu navegador
                  </a>
                  .
                </li>
              </>
            )}
          </ul>
          {anunciosAtivos ? (
            <p>
              Não vendemos seus dados. Não enviamos ao Google, nem a nenhum
              anunciante, os dados da sua Conta (nome, e-mail, telefone), do seu
              carrinho, dos seus agendamentos ou dos seus orçamentos. Anúncios
              personalizados — escolhidos a partir da sua atividade em outros
              sites e aplicativos — só aparecem se você consentir.
            </p>
          ) : (
            <p>
              Não usamos seus dados para publicidade comportamental, não os vendemos e
              não os cedemos a terceiros para fins de marketing.
            </p>
          )}
        </>
      ),
    },
    {
      id: 'compartilhamento',
      titulo: 'Com quem compartilhamos',
      corpo: (
        <>
          <ul>
            <li>
              <strong>Com o Estabelecimento</strong> cujo catálogo você usa: nome,
              e-mail, telefone e o conteúdo do agendamento ou orçamento que você
              enviou. Sem isso não há como atender você. O Estabelecimento passa a
              ser controlador desses dados e responde pelo uso que fizer deles.
            </li>
            <li>
              <strong>Com o aplicativo de mensagens</strong>, quando você opta por
              enviar o pedido: a Plataforma monta a mensagem com os itens do
              carrinho e abre a conversa no WhatsApp. O tratamento a partir daí é
              da Meta e do Estabelecimento, sob os termos daquele aplicativo. A
              Gefen não guarda a mensagem nem tem acesso à conversa.
            </li>
            <li>
              <strong>Com prestadores de serviço</strong> que sustentam a operação
              — hospedagem, banco de dados, envio de e-mail, monitoramento. Atuam
              como operadores, apenas conforme nossas instruções e sob obrigação de
              confidencialidade.
            </li>
            <li>
              <strong>Com o Google</strong>, de forma indireta: as fontes
              tipográficas da Plataforma são carregadas dos servidores do Google
              Fonts, o que expõe a eles o seu endereço IP e dados do navegador na
              requisição da fonte.
            </li>
            {anunciosAtivos && (
              <li>
                <strong>Com o Google, para os anúncios:</strong> as páginas das
                lojas carregam o Google AdSense, que coleta os dados descritos em{' '}
                <a href="#dados-coletados">Quais dados coletamos</a> para
                escolher, exibir e medir anúncios. Nesse tratamento o Google é
                controlador independente, sob a sua própria política de
                privacidade; veja{' '}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  como o Google usa dados de sites parceiros
                </a>
                . Os anúncios são escolhidos pelo Google, não pela Gefen nem pelo
                Estabelecimento, e não representam recomendação de nenhum dos
                dois. O Estabelecimento não recebe dados de anúncios.
              </li>
            )}
            <li>
              <strong>Com autoridades públicas</strong>, quando houver requisição
              legal, ordem judicial ou necessidade de exercício regular de direitos.
            </li>
            <li>
              <strong>Em reorganização societária</strong> (fusão, aquisição,
              incorporação), caso em que a sucessora fica vinculada a esta política,
              e você será avisado.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'armazenamento-no-dispositivo',
      titulo: 'O que guardamos no seu navegador',
      corpo: (
        <>
          {anunciosAtivos ? (
            <p>
              O que a própria Plataforma guarda fica no armazenamento local do
              seu navegador (<em>localStorage</em>) e serve só para o
              funcionamento — a Plataforma não grava cookies seus. Os cookies de
              anúncios, descritos adiante, são do Google.
            </p>
          ) : (
            <p>
              A Plataforma não usa cookies de publicidade nem de rastreamento de
              terceiros. O que ela guarda fica no armazenamento local do seu
              navegador (<em>localStorage</em>) e serve só para o funcionamento:
            </p>
          )}
          <ul>
            <li>
              <strong>Sessão</strong> — os tokens que mantêm você conectado entre
              visitas, para não precisar digitar a senha a cada página.
            </li>
            <li>
              <strong>Perfil em cache</strong> — seu nome, e-mail e telefone, para
              a tela abrir preenchida sem uma nova consulta ao servidor.
            </li>
            <li>
              <strong>Carrinho</strong> — os itens escolhidos, inclusive sem Conta.
            </li>
            {anunciosAtivos && (
              <li>
                <strong>Escolha sobre anúncios</strong> — a sua resposta ao aviso
                de consentimento, para não perguntarmos de novo a cada visita.
              </li>
            )}
          </ul>
          <p>
            Esses dados ficam no seu aparelho. Sair da conta apaga a sessão e o
            perfil; limpar os dados do site pelo navegador apaga tudo, inclusive o
            carrinho{anunciosAtivos ? ' e a escolha sobre anúncios' : ''}.
          </p>
          {anunciosAtivos && (
            <>
              <p>
                <strong>Cookies de anúncios.</strong> Nas páginas das lojas — e
                só nelas; os Termos e esta política não exibem anúncios —, o
                Google grava e lê cookies e identificadores semelhantes no seu
                navegador. Sem o seu consentimento, eles servem para exibir
                anúncios não personalizados, limitar a repetição, detectar fraude
                e medir resultados. Com o consentimento, servem também para
                personalizar os anúncios a partir da sua atividade em outros
                sites e aplicativos. Esses cookies são do Google, que define por
                quanto tempo os guarda; veja{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  como o Google usa cookies em publicidade
                </a>
                .
              </p>
              <p>
                <strong>Como controlar.</strong> Você muda ou retira o
                consentimento a qualquer momento pelo link{' '}
                <strong>Preferências de anúncios</strong>, no rodapé das lojas —
                retirar é tão simples quanto dar, e não bloqueia nenhum recurso
                da Plataforma. Também pode ajustar os anúncios que o Google exibe
                a você na{' '}
                <a
                  href="https://myadcenter.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Minha Central de Anúncios
                </a>{' '}
                e bloquear cookies de terceiros nas configurações do navegador.
              </p>
            </>
          )}
        </>
      ),
    },
    {
      id: 'retencao',
      titulo: 'Por quanto tempo guardamos',
      corpo: (
        <>
          <ul>
            <li>
              <strong>Dados da Conta:</strong> enquanto ela existir. Encerrada a
              Conta, são eliminados ou anonimizados em até 30 dias, ressalvado o que
              precise ser conservado pelos motivos abaixo.
            </li>
            <li>
              <strong>Agendamentos e orçamentos:</strong> pelo prazo necessário ao
              atendimento e, depois, pelo prazo em que possam ser exigidos como
              prova de uma relação de consumo — em regra, cinco anos (art. 27 do
              Código de Defesa do Consumidor e art. 206 do Código Civil).
            </li>
            <li>
              <strong>Registros de acesso:</strong> seis meses, por imposição do
              art. 15 do Marco Civil da Internet. Podem ser conservados por mais
              tempo mediante requisição de autoridade.
            </li>
            <li>
              <strong>Carrinho:</strong> enquanto você o mantiver; o carrinho salvo
              no servidor é eliminado com a Conta.
            </li>
            <li>
              <strong>Mensagens de suporte:</strong> até dois anos após o
              encerramento do atendimento.
            </li>
            {anunciosAtivos && (
              <li>
                <strong>Dados de anúncios:</strong> a Gefen não os guarda — ficam
                com o Google, pelos prazos da política dele. Os relatórios
                agregados que recebemos não identificam ninguém.
              </li>
            )}
          </ul>
          <p>
            Vencidos os prazos, os dados são eliminados ou anonimizados de modo
            irreversível — e, anonimizados, deixam de ser dados pessoais (art. 12
            da LGPD), podendo ser usados em estatísticas agregadas.
          </p>
        </>
      ),
    },
    {
      id: 'direitos',
      titulo: 'Seus direitos e como exercê-los',
      corpo: (
        <>
          <p>
            O art. 18 da LGPD garante a você, a qualquer momento e gratuitamente:
          </p>
          <ul>
            <li>
              <strong>confirmação e acesso</strong> — saber se tratamos dados seus e
              obter cópia deles;
            </li>
            <li>
              <strong>correção</strong> de dados incompletos, inexatos ou
              desatualizados;
            </li>
            <li>
              <strong>anonimização, bloqueio ou eliminação</strong> de dados
              desnecessários, excessivos ou tratados em desconformidade com a lei;
            </li>
            <li>
              <strong>portabilidade</strong> a outro fornecedor, observados os
              segredos comercial e industrial;
            </li>
            <li>
              <strong>eliminação</strong> dos dados tratados com base no seu
              consentimento;
            </li>
            <li>
              <strong>informação</strong> sobre com quem compartilhamos seus dados;
            </li>
            <li>
              <strong>informação sobre a possibilidade de não consentir</strong> e
              sobre as consequências da negativa;
            </li>
            <li>
              <strong>revogação do consentimento</strong>, quando essa for a base
              usada;
            </li>
            <li>
              <strong>oposição</strong> a tratamento fundado em legítimo interesse.
            </li>
          </ul>
          <p>
            Nome e telefone você altera direto na tela de perfil, e a senha também.
            {anunciosAtivos &&
              ' O consentimento para anúncios personalizados você retira pelo ' +
                'link "Preferências de anúncios", no rodapé das lojas, sem ' +
                'precisar nos escrever.'}{' '}
            Para os demais pedidos, escreva para{' '}
            <a href={`mailto:${EMPRESA.emailEncarregado}`}>
              {EMPRESA.emailEncarregado}
            </a>
            . Respondemos em até 15 dias, prazo do art. 19, II, da LGPD. Podemos
            pedir informação adicional para confirmar que o pedido é seu — não para
            dificultar, mas porque entregar dados a quem não é o titular seria, em
            si, um incidente.
          </p>
          <p>
            Alguns pedidos têm limite legal: não podemos eliminar o que a lei manda
            conservar, como os registros de acesso dentro do prazo do Marco Civil.
            Quando for o caso, explicaremos o motivo.
          </p>
          <p>
            Você também pode peticionar à Autoridade Nacional de Proteção de Dados
            (ANPD), nos termos do art. 18, § 1º, da LGPD.
          </p>
        </>
      ),
    },
    {
      id: 'seguranca',
      titulo: 'Segurança',
      corpo: (
        <>
          <p>
            Adotamos medidas técnicas e administrativas para proteger seus dados,
            entre elas: tráfego cifrado (HTTPS) entre o seu navegador e nossos
            servidores; senhas guardadas apenas como resumo criptográfico; sessões
            com token de curta duração e revogação no servidor ao sair da conta;
            controle de acesso restrito ao pessoal que precisa dele.
          </p>
          <p>
            Nenhum sistema é inteiramente imune. Se ocorrer incidente de segurança
            com risco relevante aos seus direitos, comunicaremos você e a ANPD nos
            termos do art. 48 da LGPD.
          </p>
          <p>
            Sua parte importa: use senha que não seja reaproveitada de outros
            serviços e não a compartilhe.
          </p>
        </>
      ),
    },
    {
      id: 'transferencia-internacional',
      titulo: 'Transferência internacional',
      corpo: (
        <p>
          Alguns dos prestadores que sustentam a Plataforma — hospedagem, envio de
          e-mail, fontes tipográficas{anunciosAtivos ? ', anúncios' : ''} — podem
          processar dados em servidores fora do Brasil. Quando isso ocorre, a transferência observa os arts. 33 a 36 da
          LGPD, mediante cláusulas contratuais de proteção ou outro mecanismo
          admitido, de modo a manter o nível de proteção exigido pela lei
          brasileira.
        </p>
      ),
    },
    {
      id: 'criancas-e-adolescentes',
      titulo: 'Crianças e adolescentes',
      corpo: (
        <p>
          A Plataforma não se destina a menores de 18 anos, e não coletamos dados de
          crianças e adolescentes de forma consciente. Se identificarmos cadastro
          nessa situação sem o consentimento específico e em destaque de ao menos um
          dos pais ou do responsável legal (art. 14, § 1º, da LGPD), eliminaremos os
          dados. Responsáveis que identifiquem um cadastro assim podem nos escrever
          em{' '}
          <a href={`mailto:${EMPRESA.emailEncarregado}`}>
            {EMPRESA.emailEncarregado}
          </a>
          .
        </p>
      ),
    },
    {
      id: 'alteracoes',
      titulo: 'Alterações desta política',
      corpo: (
        <p>
          Esta política pode ser atualizada para refletir mudanças na Plataforma, na
          legislação ou em nossas práticas. A versão vigente estará sempre nesta
          página, com as datas de vigência e de última atualização no topo.
          Alterações relevantes serão comunicadas com antecedência razoável, por
          aviso na Plataforma ou por e-mail, quando houver Conta cadastrada.
        </p>
      ),
    },
    {
      id: 'encarregado',
      titulo: 'Encarregado e contato',
      corpo: (
        <>
          <p>
            Para exercer direitos, tirar dúvidas sobre esta política ou reclamar do
            tratamento dos seus dados, fale com o nosso Encarregado pelo Tratamento
            de Dados Pessoais (art. 41 da LGPD):
          </p>
          <ul>
            <li>
              <strong>Encarregado:</strong> {EMPRESA.nomeEncarregado}
            </li>
            <li>
              <strong>E-mail:</strong>{' '}
              <a href={`mailto:${EMPRESA.emailEncarregado}`}>
                {EMPRESA.emailEncarregado}
              </a>
            </li>
            <li>
              <strong>Controladora:</strong> {EMPRESA.razaoSocial}, CNPJ{' '}
              {EMPRESA.cnpj}
            </li>
            <li>
              <strong>Endereço:</strong> {EMPRESA.endereco}
            </li>
          </ul>
          <p>
            As regras de uso da Plataforma estão nos{' '}
            <a href="/termos-de-uso">Termos de Uso</a>.
          </p>
        </>
      ),
    },
  ],
};
