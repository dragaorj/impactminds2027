import type { Locale } from "./i18n";

// Frequently asked questions (2027, before the launch), from the client's
// document (PT), with the Spanish and English versions.
// An answer is a list of blocks: a paragraph (string) or a bulleted list
// (string[]). Inside a paragraph, [[sponsor:text]] links to the sponsorship
// brochure and [[mail]] is the conference's e-mail.

export const FAQ_EMAIL = "conferencia@latimpacto.org";
export const faqPath = (lang: Locale) => `/${lang}/faq`;

export type FaqBlock = string | string[];
export type FaqItem = { q: string; a: FaqBlock[] };
export type FaqCopy = {
  nav: string;
  kicker: string;
  title: string;
  intro: string;
  items: FaqItem[];
  moreTitle: string;
  moreText: string;
  homeTitle: string;
  homeText: string;
  homeCta: string;
};

export const faqCopy: Record<Locale, FaqCopy> = {
  pt: {
    nav: "FAQ",
    kicker: "Impact Minds 2027",
    title: "Perguntas frequentes",
    intro: "Tudo o que você precisa saber sobre a Impact Minds 2027, em Cartagena, antes do lançamento oficial.",
    moreTitle: "Ainda tem dúvidas?",
    moreText: "Fale com a nossa equipe pelo e-mail",
    homeTitle: "Ficou com alguma dúvida?",
    homeText: "Datas, inscrições, ingressos, benefícios para membros e mais: reunimos as respostas às perguntas mais comuns.",
    homeCta: "Ver todas as perguntas frequentes",
    items: [
      {
        q: "O que é a Conferência Impact Minds?",
        a: ["A Impact Minds é a conferência anual da Latimpacto, que reúne lideranças, investidores, fundações, empresas e organizações de diversos países para promover conexões, compartilhar conhecimentos e impulsionar soluções para os desafios sociais e ambientais da América Latina e do Caribe."],
      },
      {
        q: "Quando e onde será realizada a próxima edição?",
        a: [
          "A próxima edição da Impact Minds será realizada de 24 a 27 de agosto de 2027, em Cartagena, Colômbia.",
          [
            "24 de agosto: Jantar exclusivo para membros da Latimpacto",
            "25 de agosto: Visitas de Campo e Coquetel de Abertura",
            "26 de agosto: 1º dia da Agenda Acadêmica",
            "27 de agosto: 2º dia da Agenda Acadêmica e Celebração de Encerramento",
          ],
        ],
      },
      {
        q: "Quem pode participar da Conferência Impact Minds?",
        a: ["Líderes e provedores de capital de fundações, family offices, corporações, fundos de impacto social e ambiental, investidores privados (capital privado e fundos de risco, empresas de consultoria, aceleradoras e incubadoras), Academia (universidades e think tanks), agências públicas (nacionais e multilaterais), redes e associações de filantropia e investidores sociais ou ambientais, provedores de capital (humano, intelectual e financeiro)."],
      },
      { q: "Quando será o lançamento da edição 2027?", a: ["O lançamento da Impact Minds 2027 vai acontecer no dia 1º de março de 2027."] },
      { q: "A partir de quando posso fazer a minha inscrição?", a: ["Você pode fazer a sua inscrição a partir do lançamento, que será no dia 1º de março de 2027."] },
      { q: "Qual o valor do ingresso?", a: ["Os valores dos ingressos e a forma de pagamento serão anunciados no lançamento, que será no dia 1º de março de 2027."] },
      {
        q: "A Impact Minds será transmitida online?",
        a: ["Não. A oportunidade de interagir pessoalmente é extremamente valiosa. Acreditamos que é hora de promover interações ao vivo e, por isso, a Impact Minds será um evento 100% presencial e não será transmitida via streaming."],
      },
      {
        q: "Posso participar da Conferência Impact Minds 2027 sem ser membro da Latimpacto?",
        a: ["Sim, você pode participar. Os valores estarão disponíveis a partir do lançamento, que será no dia 1º de março de 2027."],
      },
      {
        q: "Quais benefícios tenho na conferência por ser membro da Latimpacto?",
        a: ["Como membro da Latimpacto, você poderá participar do jantar exclusivo para membros, que vai acontecer no dia 24 de agosto de 2027, além das demais atividades previstas para todas as categorias de entrada."],
      },
      {
        q: "Posso repassar meus benefícios de membro da Latimpacto para outras organizações ou parceiros?",
        a: ["Não. Os benefícios oferecidos aos membros da Latimpacto para a conferência são exclusivos da organização associada e não podem ser transferidos ou compartilhados com outras organizações, parceiros, aliados, afiliados ou terceiros."],
      },
      {
        q: "Tenho interesse em patrocinar um espaço na conferência. Como entro em contato?",
        a: ["[[sponsor:Consulte aqui as informações sobre patrocínios]]. Caso tenha alguma dúvida, entre em contato com Tania Fioratti pelo e-mail [[mail]]."],
      },
      {
        q: "Qual a capacidade máxima de participantes da Impact Minds 2027?",
        a: ["A Conferência terá um limite de 700 participantes, e será dada prioridade por ordem de inscrição e confirmação de pagamento das entradas."],
      },
      {
        q: "A Impact Minds é um espaço para captação de recursos?",
        a: ["A Impact Minds é um espaço de conexão e aprendizado coletivo. Você poderá conhecer novas pessoas e dialogar com elas para explorar novas parcerias, mas, de acordo com nossa política de não solicitação, a Latimpacto está empenhada em criar um ambiente seguro e aberto, no qual nossa comunidade possa colaborar sem ser abordada para solicitar contribuições ou ajuda. Qualquer pessoa que participe dos eventos da Latimpacto deve aceitar esta política."],
      },
      {
        q: "Posso organizar um evento paralelo ou jantar?",
        a: [
          "Pela riqueza e foco da Conferência, para gerar conexões com os participantes, sugerimos não organizar eventos paralelos aos horários oficiais do evento. Caso queira organizar encontros paralelos, eles poderão ser realizados após o término do programa oficial indicado na agenda.",
          "A Latimpacto não pode comprometer-se a ser coanfitriã, uma vez que várias organizações nos pediram gentilmente para fazê-lo e, infelizmente, não conseguimos atender a todas as solicitações.",
        ],
      },
    ],
  },
  es: {
    nav: "FAQ",
    kicker: "Impact Minds 2027",
    title: "Preguntas frecuentes",
    intro: "Todo lo que necesitas saber sobre Impact Minds 2027, en Cartagena, antes del lanzamiento oficial.",
    moreTitle: "¿Tienes otras preguntas?",
    moreText: "Escríbele a nuestro equipo al correo",
    homeTitle: "¿Tienes alguna duda?",
    homeText: "Fechas, inscripciones, entradas, beneficios para miembros y más: reunimos las respuestas a las preguntas más comunes.",
    homeCta: "Ver todas las preguntas frecuentes",
    items: [
      {
        q: "¿Qué es la Conferencia Impact Minds?",
        a: ["Impact Minds es la conferencia anual de Latimpacto, que reúne a líderes, inversionistas, fundaciones, empresas y organizaciones de diversos países para promover conexiones, compartir conocimientos e impulsar soluciones a los desafíos sociales y ambientales de América Latina y el Caribe."],
      },
      {
        q: "¿Cuándo y dónde se realizará la próxima edición?",
        a: [
          "La próxima edición de Impact Minds se realizará del 24 al 27 de agosto de 2027, en Cartagena, Colombia.",
          [
            "24 de agosto: Cena exclusiva para miembros de Latimpacto",
            "25 de agosto: Visitas de campo y Cóctel de apertura",
            "26 de agosto: 1.er día de la Agenda Académica",
            "27 de agosto: 2.º día de la Agenda Académica y Celebración de cierre",
          ],
        ],
      },
      {
        q: "¿Quién puede participar en la Conferencia Impact Minds?",
        a: ["Líderes y proveedores de capital de fundaciones, family offices, corporaciones, fondos de impacto social y ambiental, inversionistas privados (capital privado y fondos de riesgo, empresas de consultoría, aceleradoras e incubadoras), la academia (universidades y think tanks), agencias públicas (nacionales y multilaterales), redes y asociaciones de filantropía e inversionistas sociales o ambientales, y proveedores de capital (humano, intelectual y financiero)."],
      },
      { q: "¿Cuándo será el lanzamiento de la edición 2027?", a: ["El lanzamiento de Impact Minds 2027 será el 1 de marzo de 2027."] },
      { q: "¿A partir de cuándo puedo inscribirme?", a: ["Puedes inscribirte a partir del lanzamiento, que será el 1 de marzo de 2027."] },
      { q: "¿Cuál es el valor de la entrada?", a: ["Los valores de las entradas y las formas de pago se anunciarán en el lanzamiento, que será el 1 de marzo de 2027."] },
      {
        q: "¿Impact Minds se transmitirá en línea?",
        a: ["No. La oportunidad de interactuar en persona es sumamente valiosa. Creemos que es momento de promover encuentros en vivo y, por eso, Impact Minds será un evento 100 % presencial y no se transmitirá por streaming."],
      },
      {
        q: "¿Puedo participar en la Conferencia Impact Minds 2027 sin ser miembro de Latimpacto?",
        a: ["Sí, puedes participar. Los valores estarán disponibles a partir del lanzamiento, que será el 1 de marzo de 2027."],
      },
      {
        q: "¿Qué beneficios tengo en la conferencia por ser miembro de Latimpacto?",
        a: ["Como miembro de Latimpacto podrás participar en la cena exclusiva para miembros, que se realizará el 24 de agosto de 2027, además de las demás actividades previstas para todas las categorías de entrada."],
      },
      {
        q: "¿Puedo transferir mis beneficios de miembro de Latimpacto a otras organizaciones o socios?",
        a: ["No. Los beneficios que se ofrecen a los miembros de Latimpacto para la conferencia son exclusivos de la organización asociada y no pueden transferirse ni compartirse con otras organizaciones, socios, aliados, afiliados o terceros."],
      },
      {
        q: "Me interesa patrocinar un espacio en la conferencia. ¿Cómo me pongo en contacto?",
        a: ["[[sponsor:Consulta aquí la información sobre patrocinios]]. Si tienes alguna duda, comunícate con Tania Fioratti al correo [[mail]]."],
      },
      {
        q: "¿Cuál es la capacidad máxima de participantes de Impact Minds 2027?",
        a: ["La Conferencia tendrá un límite de 700 participantes, y se dará prioridad por orden de inscripción y confirmación del pago de las entradas."],
      },
      {
        q: "¿Impact Minds es un espacio para recaudar fondos?",
        a: ["Impact Minds es un espacio de conexión y aprendizaje colectivo. Podrás conocer nuevas personas y dialogar con ellas para explorar nuevas alianzas, pero, de acuerdo con nuestra política de no solicitud, Latimpacto se compromete a crear un ambiente seguro y abierto, en el que nuestra comunidad pueda colaborar sin ser abordada para pedir contribuciones o ayuda. Toda persona que participe en los eventos de Latimpacto debe aceptar esta política."],
      },
      {
        q: "¿Puedo organizar un evento paralelo o una cena?",
        a: [
          "Por la riqueza y el enfoque de la Conferencia, y para generar conexiones entre los participantes, sugerimos no organizar eventos paralelos durante los horarios oficiales del evento. Si deseas organizar encuentros paralelos, podrán realizarse después del cierre del programa oficial indicado en la agenda.",
          "Latimpacto no puede comprometerse a ser coanfitriona, ya que varias organizaciones nos lo han pedido amablemente y, lamentablemente, no podemos atender todas las solicitudes.",
        ],
      },
    ],
  },
  en: {
    nav: "FAQ",
    kicker: "Impact Minds 2027",
    title: "Frequently asked questions",
    intro: "Everything you need to know about Impact Minds 2027 in Cartagena, ahead of the official launch.",
    moreTitle: "Still have questions?",
    moreText: "Write to our team at",
    homeTitle: "Have a question?",
    homeText: "Dates, registration, tickets, member benefits and more: we have gathered the answers to the most common questions.",
    homeCta: "See all frequently asked questions",
    items: [
      {
        q: "What is the Impact Minds Conference?",
        a: ["Impact Minds is Latimpacto's annual conference, bringing together leaders, investors, foundations, companies and organizations from many countries to build connections, share knowledge and drive solutions to the social and environmental challenges of Latin America and the Caribbean."],
      },
      {
        q: "When and where will the next edition take place?",
        a: [
          "The next edition of Impact Minds will take place on August 24–27, 2027, in Cartagena, Colombia.",
          [
            "August 24: Exclusive dinner for Latimpacto members",
            "August 25: Field visits and Opening cocktail reception",
            "August 26: Day 1 of the Academic Program",
            "August 27: Day 2 of the Academic Program and Closing celebration",
          ],
        ],
      },
      {
        q: "Who can attend the Impact Minds Conference?",
        a: ["Leaders and capital providers from foundations, family offices, corporations, social and environmental impact funds, private investors (private equity and venture capital, consulting firms, accelerators and incubators), academia (universities and think tanks), public agencies (national and multilateral), philanthropy networks and associations, social or environmental investors, and providers of capital (human, intellectual and financial)."],
      },
      { q: "When will the 2027 edition be launched?", a: ["Impact Minds 2027 will be launched on March 1, 2027."] },
      { q: "When can I register?", a: ["Registration opens at the launch, on March 1, 2027."] },
      { q: "How much is a ticket?", a: ["Ticket prices and payment options will be announced at the launch, on March 1, 2027."] },
      {
        q: "Will Impact Minds be streamed online?",
        a: ["No. The chance to meet in person is extremely valuable. We believe it is time to encourage live interaction, so Impact Minds will be a 100% in-person event and will not be streamed."],
      },
      {
        q: "Can I attend Impact Minds 2027 without being a Latimpacto member?",
        a: ["Yes, you can attend. Prices will be available from the launch, on March 1, 2027."],
      },
      {
        q: "What benefits do I get at the conference as a Latimpacto member?",
        a: ["As a Latimpacto member, you can join the exclusive members' dinner on August 24, 2027, in addition to all the activities planned for every ticket category."],
      },
      {
        q: "Can I pass my Latimpacto member benefits on to other organizations or partners?",
        a: ["No. The conference benefits offered to Latimpacto members are exclusive to the member organization and cannot be transferred or shared with other organizations, partners, allies, affiliates or third parties."],
      },
      {
        q: "I am interested in sponsoring a space at the conference. How do I get in touch?",
        a: ["[[sponsor:See the sponsorship information here]]. If you have any questions, contact Tania Fioratti at [[mail]]."],
      },
      {
        q: "What is the maximum number of participants at Impact Minds 2027?",
        a: ["The Conference will be limited to 700 participants, with priority given in order of registration and ticket payment confirmation."],
      },
      {
        q: "Is Impact Minds a fundraising space?",
        a: ["Impact Minds is a space for connection and collective learning. You will be able to meet new people and talk with them to explore new partnerships, but, in line with our non-solicitation policy, Latimpacto is committed to creating a safe and open environment where our community can collaborate without being approached for contributions or support. Everyone attending Latimpacto events must accept this policy."],
      },
      {
        q: "Can I host a side event or dinner?",
        a: [
          "Given the richness and focus of the Conference, and to foster connections among participants, we suggest not organizing side events during the official schedule. If you would like to host side gatherings, they can take place after the official program listed in the agenda has ended.",
          "Latimpacto cannot commit to co-hosting, as many organizations have kindly asked us to do so and, unfortunately, we are unable to accommodate every request.",
        ],
      },
    ],
  },
};
