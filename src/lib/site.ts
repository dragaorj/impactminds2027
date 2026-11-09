// Single source for links, dates and media. Replace the TODO values when the
// client delivers final URLs and photos; the dictionaries only hold copy.

export const EVENT_START = "2027-08-24T08:00:00-05:00"; // Cartagena (UTC-5)
export const EVENT_END = "2027-08-27T23:59:59-05:00";
// The floating countdown ring fills from this moment (one year out) to EVENT_START.
export const COUNTDOWN_FROM = "2026-08-24T08:00:00-05:00";

export const HERO_VIDEO_ID = "ZX4sEmQpA3s";
export const ABOUT_VIDEO_ID = "6bCwTxkDT6k";

// Where the footer contact form sends its messages.
export const CONTACT_EMAIL = "conferencia@latimpacto.org";

export const links = {
  latimpacto: "https://www.latimpacto.org",
  // Official 2026 agenda and speaker directory.
  agenda2026Page: "https://impactminds.app/",
  speakers2026Page: "https://impactminds.app/palestrantes",
  // Sponsorship brochure for the 2027 edition (Portuguese).
  sponsorBrochure: "/docs/impact-minds-2027-patrocinio.pdf",
  // Full report of the 2026 edition (Portuguese).
  report2026: "/docs/impact-minds-2026-relatorio.pdf",
  // TODO: full photo album (Flickr, Drive, etc.).
  allPhotos: "#fotos",
  albums: {
    dinner: "#fotos",
    cocktail: "#fotos",
    day1: "#fotos",
    day2: "#fotos",
  },
  social: {
    instagram: "https://www.instagram.com/latimpacto/",
    linkedin: "https://www.linkedin.com/company/latimpacto/",
    youtube: "https://www.youtube.com/@latimpacto",
  },
};

// Event photos come from the official Impact Minds 2026 report.
export const photos = {
  gallery: ["/photos/panel-ai.jpg", "/photos/networking.jpg", "/photos/stage-panel.jpg", "/photos/members-dinner.jpg"],
  speakersTile: "/photos/academic-2.jpg",
  numbersHero: "/photos/editions/2026/01.jpg",
  events: ["/photos/members-dinner.jpg", "/photos/opening-cocktail.jpg", "/photos/closing-party.jpg"],
  visits: Array.from({ length: 12 }, (_, i) => `/photos/visit-${String(i + 1).padStart(2, "0")}.jpg`),
};

// Bento gallery per edition, in the order of the dictionaries' editions list
// (2026 first). Twelve photos fill the grid; an empty list falls back to the
// files in public/photos/editions/<year>/ (lib/editions.ts), and with none
// there the edition shows "coming soon".
const ed2026 = (n: string) => `/photos/editions/2026/${n}.jpg`;
export const editionGalleries: string[][] = [
  ["01", "02", "06", "04", "05", "08", "07", "09", "11", "10", "03", "12"].map(ed2026),
  [],
  [],
  [],
  [],
];

// Full report per edition, same order (2026 first). null falls back to
// public/docs/impact-minds-<year>-relatorio.pdf (lib/editions.ts); with no
// file there the edition has no report button. A link here (e.g. Drive) wins.
export const editionReports: (string | null)[] = [links.report2026, null, null, null, null];

type Trilingual = { pt: string; es: string; en: string };
// Photos are square portraits framed alike (eyes at 38%, chin at 63%), so the heads line up.
export type Speaker = { name: string; org: Trilingual; role: Trilingual; photo?: string };

// A selection of the 2026 speakers shown in the carousel (photos in public/photos/speakers).
export const speakers: Speaker[] = [
  {
    name: "Marla Blow",
    org: { pt: "Skoll Foundation", es: "Skoll Foundation", en: "Skoll Foundation" },
    role: { pt: "CEO e Presidente", es: "CEO y Presidenta", en: "CEO and President" },
    photo: "/photos/speakers/marla-blow-v3.webp",
  },
  {
    name: "Alice Damasceno",
    org: { pt: "Lenovo", es: "Lenovo", en: "Lenovo" },
    role: { pt: "Diretora de Responsabilidade Social Corporativa e Comunicações ESG", es: "Directora de Responsabilidad Social Corporativa y Comunicaciones ESG", en: "Director of Corporate Social Responsibility and ESG Communications" },
    photo: "/photos/speakers/alice-damasceno-v4.webp",
  },
  {
    name: "Fabio Segura",
    org: { pt: "Jacobs Foundation", es: "Jacobs Foundation", en: "Jacobs Foundation" },
    role: { pt: "Co-CEO", es: "Co-CEO", en: "Co-CEO" },
    photo: "/photos/speakers/fabio-segura-v3.webp",
  },
  {
    name: "Eddine Sarroukh",
    org: { pt: "Philips Foundation", es: "Philips Foundation", en: "Philips Foundation" },
    role: { pt: "Diretor", es: "Director", en: "Director" },
    photo: "/photos/speakers/eddine-sarroukh-v3.webp",
  },
  {
    name: "Stefan Wilhelm",
    org: { pt: "Bayer Foundation", es: "Bayer Foundation", en: "Bayer Foundation" },
    role: { pt: "Diretor Associado de Impacto Social", es: "Director Asociado de Impacto Social", en: "Associate Director, Social Impact" },
    photo: "/photos/speakers/stefan-wilhelm-v5.webp",
  },
  {
    name: "Paraskevi Bessa",
    org: { pt: "Banco Asiático de Investimento em Infraestrutura (AIIB)", es: "Banco Asiático de Inversión en Infraestructura (AIIB)", en: "Asian Infrastructure Investment Bank (AIIB)" },
    role: { pt: "Oficial Sênior de Mobilização de Recursos", es: "Oficial Sénior de Movilización de Recursos", en: "Senior Resource Mobilization Officer" },
    photo: "/photos/speakers/paraskevi-bessa-v3.webp",
  },
  {
    name: "Alejandro Botero",
    org: { pt: "Bancolombia", es: "Bancolombia", en: "Bancolombia" },
    role: { pt: "Vice-Presidente Corporativo", es: "Vicepresidente Corporativo", en: "Corporate Vice President" },
    photo: "/photos/speakers/alejandro-botero-v4.webp",
  },
  {
    name: "Daniela Konietzko",
    org: { pt: "Fundação WWB Colômbia", es: "Fundación WWB Colombia", en: "WWB Colombia Foundation" },
    role: { pt: "Presidente", es: "Presidenta", en: "President" },
    photo: "/photos/speakers/daniela-konietzko-v3.webp",
  },
  {
    name: "Patrícia Daros",
    org: { pt: "Fundo Vale", es: "Fundo Vale", en: "Fundo Vale" },
    role: { pt: "Diretora", es: "Directora", en: "Director" },
    photo: "/photos/speakers/patricia-daros-v3.webp",
  },
  {
    name: "Rose Meire Apurinã",
    org: { pt: "Podáali – Fundo Indígena da Amazônia Brasileira", es: "Podáali – Fondo Indígena de la Amazonía Brasileña", en: "Podáali – Brazilian Amazon Indigenous Fund" },
    role: { pt: "Diretora", es: "Directora", en: "Director" },
    photo: "/photos/speakers/rose-meire-apurina-v3.webp",
  },
  {
    name: "Caroline Flammer",
    org: { pt: "Universidade Columbia", es: "Universidad de Columbia", en: "Columbia University" },
    role: { pt: "Professora da Cátedra A. Barton Hepburn de Economia", es: "Profesora de la Cátedra A. Barton Hepburn de Economía", en: "A. Barton Hepburn Professor of Economics" },
    photo: "/photos/speakers/caroline-flammer-v5.webp",
  },
  {
    name: "James Burrows",
    org: { pt: "Better Society Capital", es: "Better Society Capital", en: "Better Society Capital" },
    role: { pt: "Diretor-Geral", es: "Director General", en: "Managing Director" },
    photo: "/photos/speakers/james-burrows-v3.webp",
  },
  {
    name: "Natalia Guala",
    org: { pt: "Grupo Social ONCE", es: "Grupo Social ONCE", en: "Grupo Social ONCE" },
    role: { pt: "Diretora Técnica de Relações Internacionais", es: "Directora Técnica de Relaciones Internacionales", en: "Technical Director of International Relations" },
    photo: "/photos/speakers/natalia-guala-v4.webp",
  },
];

// Photos hosted on the official 2026 agenda platform (impactminds.app).
const sb = (file: string) =>
  `https://yndnugzoqiyophwkzrcx.supabase.co/storage/v1/object/public/agenda/speakers/${file}.webp`;

export type Testimonial = { quote: Trilingual; name: string; role: Trilingual; photo?: string };

// Quotes from the Impact Minds 2026 report (and Marcus Bessa from the 2026 site).
export const testimonials: Testimonial[] = [
  {
    name: "Marla Blow",
    photo: "/photos/testimonials/marla-blow.jpg",
    role: { pt: "CEO e Presidente, Skoll Foundation", es: "CEO y Presidenta, Skoll Foundation", en: "CEO and President, Skoll Foundation" },
    quote: {
      pt: "Nossa experiência na Impact Minds foi incrível! Foi maravilhoso nos conectar com o ecossistema de impacto e uma ótima oportunidade para conhecer diferentes atores, investidores e organizações que fazem parte da comunidade da Latimpacto.",
      es: "¡Nuestra experiencia en Impact Minds fue increíble! Fue maravilloso conectarnos con el ecosistema de impacto y una gran oportunidad para conocer a distintos actores, inversionistas y organizaciones que forman parte de la comunidad de Latimpacto.",
      en: "Our experience at Impact Minds was incredible! It was wonderful to connect with the impact ecosystem and a great opportunity to meet the different actors, investors, and organizations that are part of the Latimpacto community.",
    },
  },
  {
    name: "Alice Damasceno",
    photo: "/photos/testimonials/alice-damasceno.jpg",
    role: {
      pt: "Diretora de Cidadania Corporativa e Comunicações ESG para a América Latina, Lenovo",
      es: "Directora de Ciudadanía Corporativa y Comunicaciones ESG para América Latina, Lenovo",
      en: "Director of Corporate Citizenship and ESG Communications, Latin America, Lenovo",
    },
    quote: {
      pt: "É sempre muito gratificante estar na Impact Minds, porque a Latimpacto representa a essência do impacto coletivo na América Latina. Um encontro como este é uma oportunidade única para criar conexões entre os diferentes atores do ecossistema.",
      es: "Siempre es muy gratificante estar en Impact Minds, porque Latimpacto representa la esencia del impacto colectivo en América Latina. Un encuentro como este es una oportunidad única para crear conexiones entre los distintos actores del ecosistema.",
      en: "It is always very rewarding to be at Impact Minds, because Latimpacto represents the essence of collective impact in Latin America. A gathering like this is a unique opportunity to build connections across the ecosystem.",
    },
  },
  {
    name: "Macarena Cea",
    photo: "/photos/testimonials/macarena-cea.jpg",
    role: { pt: "CEO, Fundação Luksic", es: "CEO, Fundación Luksic", en: "CEO, Luksic Foundation" },
    quote: {
      pt: "Estamos de coração cheio, porque a Impact Minds proporcionou conversas muito enriquecedoras e úteis. As pessoas que estão aqui são extraordinárias e têm projetos e experiências incríveis.",
      es: "Estamos con el corazón lleno, porque Impact Minds generó conversaciones muy enriquecedoras y útiles. Las personas que están aquí son extraordinarias y tienen proyectos y experiencias increíbles.",
      en: "Our hearts are full, because Impact Minds sparked truly enriching and useful conversations. The people here are extraordinary, with incredible projects and experiences.",
    },
  },
  {
    name: "Daniela Konietzko",
    photo: "/photos/testimonials/daniela-konietzko.jpg",
    role: { pt: "Presidente, Fundação WWB Colômbia", es: "Presidenta, Fundación WWB Colombia", en: "President, WWB Colombia Foundation" },
    quote: {
      pt: "O mais enriquecedor para mim na Impact Minds são as conversas sobre as tendências. Venho aqui para aprender, me reconectar com todos e conhecer o trabalho que estão realizando em seus territórios.",
      es: "Lo más enriquecedor para mí en Impact Minds son las conversaciones sobre tendencias. Vengo a aprender, a reconectarme con todos y a conocer el trabajo que están haciendo en sus territorios.",
      en: "What I value most at Impact Minds are the conversations about trends. I come here to learn, reconnect with everyone, and see the work they are doing in their territories.",
    },
  },
  {
    name: "Ana Cristina Rodrigues da Costa",
    photo: "/photos/testimonials/ana-cristina-rodrigues-da-costa.jpg",
    role: {
      pt: "Superintendente da Área de Desenvolvimento Social e Gestão Pública, BNDES",
      es: "Superintendente del Área de Desarrollo Social y Gestión Pública, BNDES",
      en: "Superintendent of Social Development and Public Management, BNDES",
    },
    quote: {
      pt: "A Impact Minds proporciona um ambiente que nos convida a pensar juntos em como construir soluções que respeitem cada um dos setores e que, ao mesmo tempo, nos permitam compartilhar os mesmos ideais.",
      es: "Impact Minds ofrece un ambiente que nos invita a pensar juntos cómo construir soluciones que respeten a cada uno de los sectores y que, al mismo tiempo, nos permitan compartir los mismos ideales.",
      en: "Impact Minds creates a space that invites us to think together about building solutions that respect every sector while letting us share the same ideals.",
    },
  },
  {
    name: "Marcus Bessa",
    role: { pt: "Cofundador, Impact Hub Manaus", es: "Cofundador, Impact Hub Manaus", en: "Co-founder, Impact Hub Manaus" },
    photo: sb("1784213121095-4zlcdg"),
    quote: {
      pt: "Pelo tamanho e pela pluralidade da rede, fico muito feliz que a Impact Minds chegue a Manaus, porque acredito que conecta muito com a discussão que estamos tendo em nível global.",
      es: "Por el tamaño y la pluralidad de la red, me alegra mucho que Impact Minds llegue a Manaos, porque creo que conecta mucho con la discusión que estamos teniendo a nivel global.",
      en: "Given the size and diversity of the network, I'm very happy Impact Minds came to Manaus, because it connects closely with the conversation we're having globally.",
    },
  },
];

export const participantsByYear = [
  { year: 2022, value: 353 },
  { year: 2023, value: 590 },
  { year: 2024, value: 695 },
  { year: 2025, value: 789 },
];


// The site's public address, for absolute links in the page head (hreflang,
// Open Graph). A custom domain goes in NEXT_PUBLIC_SITE_URL; otherwise
// Vercel's production domain, set at build time.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://impactminds2027.vercel.app"),
);
