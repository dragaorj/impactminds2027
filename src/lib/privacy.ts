import type { Locale } from "./i18n";

// Copy for the privacy notice (LGPD) and the cookie banner, in the three
// languages. Kept apart from the main dictionaries: it is long and changes on
// its own schedule (legal review). The page lists what the site really stores;
// keep it in step with the code (im-lang cookie, prefs and consent in
// localStorage, intro/switch flags in sessionStorage).

export const PRIVACY_UPDATED = "2026-11-01";
export const PRIVACY_CONTACT = "conferencia@latimpacto.org";

type Block = { title: string; paragraphs?: string[]; items?: string[] };

export type PrivacyCopy = {
  navLabel: string;
  // A slim notice in the hero's info bar (or a pill at the bottom elsewhere);
  // the *Short variants are for phones.
  banner: {
    label: string;
    text: string;
    textShort: string;
    link: string;
    linkShort: string;
    reject: string;
    rejectShort: string;
    accept: string;
    acceptShort: string;
  };
  manage: string;
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: Block[];
  contactLead: string;
  back: string;
};

const pt: PrivacyCopy = {
  navLabel: "Privacidade",
  banner: {
    label: "Aviso de privacidade e cookies",
    text: "Usamos cookies necessários e, com sua autorização, opcionais para melhorar sua experiência.",
    textShort: "Cookies opcionais só com sua autorização.",
    link: "Política de Privacidade",
    linkShort: "Privacidade",
    reject: "Rejeitar opcionais",
    rejectShort: "Rejeitar",
    accept: "Aceitar todos",
    acceptShort: "Aceitar",
  },
  manage: "Preferências de cookies",
  meta: {
    title: "Política de Privacidade | Impact Minds 2027",
    description: "Como o site do Impact Minds 2027 trata dados pessoais, cookies e armazenamento local, de acordo com a LGPD.",
  },
  eyebrow: "LGPD · Lei nº 13.709/2018",
  title: "Política de Privacidade",
  updated: "Última atualização",
  intro:
    "Esta política explica, de forma simples, quais dados o site do Impact Minds 2027 trata, por que trata, com quem compartilha e como você pode exercer os seus direitos previstos na Lei Geral de Proteção de Dados (LGPD).",
  sections: [
    {
      title: "Quem somos",
      paragraphs: [
        "O Impact Minds é a conferência anual da Latimpacto, rede latino-americana de investimento de impacto. A Latimpacto é a controladora dos dados pessoais tratados neste site.",
      ],
    },
    {
      title: "Quais dados tratamos",
      paragraphs: [
        "Você pode navegar por todo o site sem criar conta nem informar dados pessoais.",
      ],
      items: [
        "Dados técnicos de acesso: endereço IP, tipo de navegador e dispositivo, páginas acessadas e data e hora, registrados automaticamente pelo provedor de hospedagem para entregar o site e protegê-lo contra abusos.",
        "Preferências que você escolhe no site: idioma, modo claro ou escuro, opções de acessibilidade e a sua escolha sobre cookies.",
        "Contato por e-mail: o formulário de patrocínio apenas abre o seu aplicativo de e-mail com a mensagem pronta. Nada é enviado pelo site; recebemos o seu e-mail somente se você decidir enviá-lo.",
      ],
    },
    {
      title: "Cookies e armazenamento local",
      paragraphs: [
        "Cookies e armazenamento local são pequenos registros guardados no seu navegador. Usamos dois tipos:",
      ],
      items: [
        "Necessários (sempre ativos): o cookie “im-lang” guarda o idioma escolhido por até 12 meses; o armazenamento local guarda tema, acessibilidade e a sua escolha sobre cookies; o armazenamento de sessão lembra se a abertura animada já foi exibida e a posição da página ao trocar de idioma, e é apagado ao fechar a aba.",
        "Opcionais (somente com a sua autorização): cookies de análise de tráfego para entender como o site é usado e melhorá-lo. Eles só serão ativados se você clicar em “Aceitar todos”, e você pode mudar de ideia a qualquer momento.",
      ],
    },
    {
      title: "Conteúdo de terceiros",
      items: [
        "Vídeos do YouTube, carregados no modo de privacidade aprimorada (youtube-nocookie.com). Ao reproduzir um vídeo, o Google pode registrar informações no seu navegador conforme a política de privacidade dele.",
        "Imagens dos palestrantes servidas a partir da plataforma oficial da agenda (Supabase).",
        "Links para Instagram, LinkedIn e YouTube: ao abri-los, vale a política de privacidade de cada rede.",
      ],
    },
    {
      title: "Bases legais",
      items: [
        "Legítimo interesse (art. 7º, IX): para manter o site funcionando, seguro e nas suas preferências.",
        "Consentimento (art. 7º, I): para cookies opcionais de análise.",
        "Execução de procedimentos preliminares a pedido do titular (art. 7º, V): para responder aos e-mails que você nos enviar.",
      ],
    },
    {
      title: "Compartilhamento e transferência internacional",
      paragraphs: [
        "Não vendemos nem alugamos dados pessoais. Os dados podem ser tratados pelos fornecedores que tornam o site possível, como hospedagem (Vercel), vídeos (YouTube/Google) e armazenamento de imagens (Supabase), alguns com servidores fora do Brasil. Nesses casos, a transferência segue as garantias previstas no art. 33 da LGPD.",
      ],
    },
    {
      title: "Por quanto tempo guardamos",
      paragraphs: [
        "Registros técnicos de acesso são mantidos pelo período necessário à segurança do site e ao cumprimento de obrigações legais. As preferências ficam no seu próprio navegador até você apagá-las. E-mails recebidos são mantidos enquanto forem necessários para o contato.",
      ],
    },
    {
      title: "Seus direitos",
      paragraphs: ["Pelo art. 18 da LGPD, você pode, a qualquer momento:"],
      items: [
        "confirmar se tratamos seus dados e acessá-los;",
        "corrigir dados incompletos, inexatos ou desatualizados;",
        "pedir anonimização, bloqueio ou eliminação de dados desnecessários;",
        "pedir a portabilidade dos dados;",
        "saber com quem os dados foram compartilhados;",
        "revogar o consentimento e saber as consequências de não consenti-lo;",
        "apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
    {
      title: "Como gerenciar cookies",
      paragraphs: [
        "Você pode rever a sua escolha pelo botão “Preferências de cookies”, aqui nesta página. Também é possível apagar ou bloquear cookies nas configurações do seu navegador; os cookies necessários, se bloqueados, podem fazer o site esquecer suas preferências.",
      ],
    },
    {
      title: "Alterações",
      paragraphs: [
        "Esta política pode ser atualizada para refletir mudanças no site ou na legislação. A data da última atualização aparece no topo da página.",
      ],
    },
  ],
  contactLead: "Dúvidas ou pedidos sobre seus dados? Fale com a Latimpacto:",
  back: "Voltar ao site",
};

const es: PrivacyCopy = {
  navLabel: "Privacidad",
  banner: {
    label: "Aviso de privacidad y cookies",
    text: "Usamos cookies necesarias y, con tu autorización, opcionales para mejorar tu experiencia.",
    textShort: "Cookies opcionales solo si autorizas.",
    link: "Política de Privacidad",
    linkShort: "Privacidad",
    reject: "Rechazar opcionales",
    rejectShort: "Rechazar",
    accept: "Aceptar todas",
    acceptShort: "Aceptar",
  },
  manage: "Preferencias de cookies",
  meta: {
    title: "Política de Privacidad | Impact Minds 2027",
    description: "Cómo el sitio de Impact Minds 2027 trata datos personales, cookies y almacenamiento local, de acuerdo con la LGPD de Brasil.",
  },
  eyebrow: "LGPD · Ley nº 13.709/2018",
  title: "Política de Privacidad",
  updated: "Última actualización",
  intro:
    "Esta política explica, de forma sencilla, qué datos trata el sitio de Impact Minds 2027, por qué los trata, con quién los comparte y cómo puedes ejercer tus derechos según la Ley General de Protección de Datos de Brasil (LGPD).",
  sections: [
    {
      title: "Quiénes somos",
      paragraphs: [
        "Impact Minds es la conferencia anual de Latimpacto, red latinoamericana de inversión de impacto. Latimpacto es la responsable de los datos personales tratados en este sitio.",
      ],
    },
    {
      title: "Qué datos tratamos",
      paragraphs: ["Puedes navegar por todo el sitio sin crear una cuenta ni dar datos personales."],
      items: [
        "Datos técnicos de acceso: dirección IP, tipo de navegador y dispositivo, páginas visitadas, fecha y hora, registrados automáticamente por el proveedor de alojamiento para entregar el sitio y protegerlo contra abusos.",
        "Preferencias que eliges en el sitio: idioma, modo claro u oscuro, opciones de accesibilidad y tu elección sobre cookies.",
        "Contacto por correo: el formulario de patrocinio solo abre tu aplicación de correo con el mensaje listo. El sitio no envía nada; recibimos tu correo solo si decides enviarlo.",
      ],
    },
    {
      title: "Cookies y almacenamiento local",
      paragraphs: ["Las cookies y el almacenamiento local son pequeños registros guardados en tu navegador. Usamos dos tipos:"],
      items: [
        "Necesarias (siempre activas): la cookie “im-lang” guarda el idioma elegido hasta por 12 meses; el almacenamiento local guarda tema, accesibilidad y tu elección sobre cookies; el almacenamiento de sesión recuerda si la apertura animada ya se mostró y la posición de la página al cambiar de idioma, y se borra al cerrar la pestaña.",
        "Opcionales (solo con tu autorización): cookies de análisis de tráfico para entender cómo se usa el sitio y mejorarlo. Solo se activan si haces clic en “Aceptar todas”, y puedes cambiar de opinión en cualquier momento.",
      ],
    },
    {
      title: "Contenido de terceros",
      items: [
        "Videos de YouTube, cargados en modo de privacidad mejorada (youtube-nocookie.com). Al reproducir un video, Google puede registrar información en tu navegador según su propia política de privacidad.",
        "Imágenes de los ponentes servidas desde la plataforma oficial de la agenda (Supabase).",
        "Enlaces a Instagram, LinkedIn y YouTube: al abrirlos, se aplica la política de privacidad de cada red.",
      ],
    },
    {
      title: "Bases legales",
      items: [
        "Interés legítimo (art. 7, IX): para mantener el sitio funcionando, seguro y con tus preferencias.",
        "Consentimiento (art. 7, I): para las cookies opcionales de análisis.",
        "Procedimientos preliminares a pedido del titular (art. 7, V): para responder los correos que nos envíes.",
      ],
    },
    {
      title: "Compartición y transferencia internacional",
      paragraphs: [
        "No vendemos ni alquilamos datos personales. Los datos pueden ser tratados por los proveedores que hacen posible el sitio, como alojamiento (Vercel), videos (YouTube/Google) y almacenamiento de imágenes (Supabase), algunos con servidores fuera de Brasil. En esos casos, la transferencia sigue las garantías del art. 33 de la LGPD.",
      ],
    },
    {
      title: "Por cuánto tiempo los guardamos",
      paragraphs: [
        "Los registros técnicos de acceso se conservan durante el tiempo necesario para la seguridad del sitio y el cumplimiento de obligaciones legales. Las preferencias quedan en tu propio navegador hasta que las borres. Los correos recibidos se conservan mientras sean necesarios para el contacto.",
      ],
    },
    {
      title: "Tus derechos",
      paragraphs: ["Según el art. 18 de la LGPD, puedes en cualquier momento:"],
      items: [
        "confirmar si tratamos tus datos y acceder a ellos;",
        "corregir datos incompletos, inexactos o desactualizados;",
        "pedir la anonimización, el bloqueo o la eliminación de datos innecesarios;",
        "pedir la portabilidad de los datos;",
        "saber con quién se compartieron los datos;",
        "revocar el consentimiento y conocer las consecuencias de no darlo;",
        "presentar una reclamación ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD).",
      ],
    },
    {
      title: "Cómo gestionar las cookies",
      paragraphs: [
        "Puedes revisar tu elección con el botón “Preferencias de cookies”, aquí en esta página. También puedes borrar o bloquear cookies en la configuración de tu navegador; si bloqueas las necesarias, el sitio puede olvidar tus preferencias.",
      ],
    },
    {
      title: "Cambios",
      paragraphs: [
        "Esta política puede actualizarse para reflejar cambios en el sitio o en la legislación. La fecha de la última actualización aparece al inicio de la página.",
      ],
    },
  ],
  contactLead: "¿Dudas o solicitudes sobre tus datos? Escribe a Latimpacto:",
  back: "Volver al sitio",
};

const en: PrivacyCopy = {
  navLabel: "Privacy",
  banner: {
    label: "Privacy and cookie notice",
    text: "We use necessary cookies and, with your permission, optional ones to improve your experience.",
    textShort: "Optional cookies only if you agree.",
    link: "Privacy Policy",
    linkShort: "Privacy",
    reject: "Reject optional",
    rejectShort: "Reject",
    accept: "Accept all",
    acceptShort: "Accept",
  },
  manage: "Cookie preferences",
  meta: {
    title: "Privacy Policy | Impact Minds 2027",
    description: "How the Impact Minds 2027 website handles personal data, cookies and local storage, in line with Brazil's LGPD.",
  },
  eyebrow: "LGPD · Law No. 13,709/2018",
  title: "Privacy Policy",
  updated: "Last updated",
  intro:
    "This policy explains, in plain terms, what data the Impact Minds 2027 website handles, why, who it is shared with, and how you can exercise your rights under Brazil's General Data Protection Law (LGPD).",
  sections: [
    {
      title: "Who we are",
      paragraphs: [
        "Impact Minds is the annual conference of Latimpacto, the Latin American impact investing network. Latimpacto is the controller of the personal data handled on this site.",
      ],
    },
    {
      title: "What data we handle",
      paragraphs: ["You can browse the whole site without an account and without giving any personal data."],
      items: [
        "Technical access data: IP address, browser and device type, pages visited, date and time, logged automatically by the hosting provider to deliver the site and protect it from abuse.",
        "Preferences you choose on the site: language, light or dark mode, accessibility options and your cookie choice.",
        "Email contact: the sponsorship form only opens your own email app with the message ready. The site sends nothing; we receive your email only if you choose to send it.",
      ],
    },
    {
      title: "Cookies and local storage",
      paragraphs: ["Cookies and local storage are small records kept in your browser. We use two kinds:"],
      items: [
        "Necessary (always on): the “im-lang” cookie keeps your chosen language for up to 12 months; local storage keeps your theme, accessibility options and cookie choice; session storage remembers whether the opening animation has played and your place on the page when switching language, and is cleared when you close the tab.",
        "Optional (only with your permission): traffic analytics cookies to understand how the site is used and improve it. They are only turned on if you click “Accept all”, and you can change your mind at any time.",
      ],
    },
    {
      title: "Third-party content",
      items: [
        "YouTube videos, loaded in privacy-enhanced mode (youtube-nocookie.com). When you play a video, Google may store information in your browser under its own privacy policy.",
        "Speaker photos served from the official agenda platform (Supabase).",
        "Links to Instagram, LinkedIn and YouTube: once you open them, each network's privacy policy applies.",
      ],
    },
    {
      title: "Legal bases",
      items: [
        "Legitimate interest (art. 7, IX): to keep the site running, secure and set to your preferences.",
        "Consent (art. 7, I): for optional analytics cookies.",
        "Preliminary steps at your request (art. 7, V): to answer emails you send us.",
      ],
    },
    {
      title: "Sharing and international transfers",
      paragraphs: [
        "We do not sell or rent personal data. Data may be handled by the providers that make the site possible, such as hosting (Vercel), video (YouTube/Google) and image storage (Supabase), some with servers outside Brazil. In those cases the transfer follows the safeguards of art. 33 of the LGPD.",
      ],
    },
    {
      title: "How long we keep it",
      paragraphs: [
        "Technical access logs are kept for as long as needed for the site's security and to meet legal obligations. Preferences stay in your own browser until you clear them. Emails we receive are kept while they are needed for the conversation.",
      ],
    },
    {
      title: "Your rights",
      paragraphs: ["Under art. 18 of the LGPD you may, at any time:"],
      items: [
        "confirm whether we handle your data and access it;",
        "correct incomplete, inaccurate or outdated data;",
        "ask for unnecessary data to be anonymised, blocked or deleted;",
        "ask for your data to be ported;",
        "find out who your data was shared with;",
        "withdraw consent and learn the consequences of not giving it;",
        "lodge a complaint with Brazil's National Data Protection Authority (ANPD).",
      ],
    },
    {
      title: "Managing cookies",
      paragraphs: [
        "You can review your choice with the “Cookie preferences” button, right here on this page. You can also clear or block cookies in your browser settings; if you block the necessary ones, the site may forget your preferences.",
      ],
    },
    {
      title: "Changes",
      paragraphs: [
        "This policy may be updated to reflect changes to the site or the law. The date of the last update is shown at the top of the page.",
      ],
    },
  ],
  contactLead: "Questions or requests about your data? Contact Latimpacto:",
  back: "Back to the site",
};

export const privacyCopy: Record<Locale, PrivacyCopy> = { pt, es, en };

export const privacyPath = (lang: Locale) => `/${lang}/privacy`;
