// Single source for links, dates and media. Replace the TODO values when the
// client delivers final URLs and photos; the dictionaries only hold copy.

export const EVENT_START = "2027-08-24T08:00:00-05:00"; // Cartagena (UTC-5)
export const EVENT_END = "2027-08-27T23:59:59-05:00";
// The floating countdown ring fills from this moment (one year out) to EVENT_START.
export const COUNTDOWN_FROM = "2026-08-24T08:00:00-05:00";

export const HERO_VIDEO_ID = "ZX4sEmQpA3s";
export const ABOUT_VIDEO_ID = "6bCwTxkDT6k";

export const links = {
  latimpacto: "https://www.latimpacto.org",
  // Official 2026 agenda and speaker directory.
  agenda2026Page: "https://impactminds.app/",
  speakers2026Page: "https://impactminds.app/",
  // TODO: sponsorship deck for 2027 ("logo mais vem o conteudo de 2027").
  sponsor2027: "",
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
  events: ["/photos/members-dinner.jpg", "/photos/opening-cocktail.jpg", "/photos/closing-party.jpg"],
  visits: Array.from({ length: 12 }, (_, i) => `/photos/visit-${String(i + 1).padStart(2, "0")}.jpg`),
};

// Bento gallery per edition, in the order of the dictionaries' editions list
// (2026 first). Twelve photos fill the grid; an empty list shows "coming soon".
// TODO: add the 12 photos for 2025, 2024, 2023 and 2022 when the client sends them.
const ed2026 = (n: string) => `/photos/editions/2026/${n}.jpg`;
export const editionGalleries: string[][] = [
  ["01", "02", "06", "04", "05", "08", "07", "09", "11", "10", "03", "12"].map(ed2026),
  [],
  [],
  [],
  [],
];

type Trilingual = { pt: string; es: string; en: string };
export type Speaker = { name: string; org: string; role: Trilingual; photo?: string };

// Names, roles and photos come from the official 2026 agenda platform (impactminds.app).
const sb = (file: string) =>
  `https://yndnugzoqiyophwkzrcx.supabase.co/storage/v1/object/public/agenda/speakers/${file}.webp`;

export const speakers: Speaker[] = [
  {
    name: "Rose Meire Barbosa Correa",
    org: "Podáali, Fundo Indígena da Amazônia Brasileira",
    role: { pt: "Vice-Diretora", es: "Vicedirectora", en: "Vice-Director" },
    photo: sb("1783545051949-7u9uj7"),
  },
  {
    name: "Marcela Dávila",
    org: "Fundación Promigas",
    role: { pt: "Diretora-Executiva", es: "Directora Ejecutiva", en: "Executive Director" },
    photo: sb("1783544269597-ry60y4"),
  },
  {
    name: "Denis Minev",
    org: "Bemol",
    role: { pt: "Diretor-Presidente", es: "Director Presidente", en: "CEO" },
    photo: sb("1783543010560-a6obpw"),
  },
  {
    name: "Jack Manning Bancroft",
    org: "AIME and IMAGI-NATION",
    role: { pt: "CEO e Fundador", es: "CEO y Fundador", en: "CEO and Founder" },
    photo: sb("1783542913111-638rbi"),
  },
  {
    name: "Almir Narayamoga Surui",
    org: "Povo indígena Paiter-Suruí",
    role: { pt: "Cacique e líder político", es: "Cacique y líder político", en: "Chief and political leader" },
    photo: sb("1786552424555-xjfnn1"),
  },
  {
    name: "Tasso Azevedo",
    org: "MapBiomas",
    role: { pt: "Coordenador Geral", es: "Coordinador General", en: "General Coordinator" },
    photo: sb("1788041144833-o4leqb"),
  },
  {
    name: "Brigit Helms",
    org: "Miller Center for Global Impact",
    role: { pt: "Diretora Executiva", es: "Directora Ejecutiva", en: "Executive Director" },
    photo: sb("1784744199056-dwkxhs"),
  },
  {
    name: "Luana Génot",
    org: "IDBR",
    role: { pt: "CEO", es: "CEO", en: "CEO" },
    photo: sb("1786495513717-lbk5xz"),
  },
  {
    name: "María Victoria Llorente",
    org: "Fundación Ideas para la Paz",
    role: { pt: "Diretora Executiva", es: "Directora Ejecutiva", en: "Executive Director" },
    photo: sb("1785421056494-vel4be"),
  },
  {
    name: "Paula Fabiani",
    org: "IDIS",
    role: { pt: "CEO", es: "CEO", en: "CEO" },
    photo: sb("1784082357193-hdc311"),
  },
  {
    name: "Daniel Izzo",
    org: "VOX Capital",
    role: { pt: "CEO", es: "CEO", en: "CEO" },
    photo: sb("1784904730160-f6mikm"),
  },
  {
    name: "Veronica Melzi",
    org: "Anglo American Foundation",
    role: {
      pt: "Diretora de Programas e Parcerias para a América Latina",
      es: "Directora de Programas y Alianzas para América Latina",
      en: "Director of Programs and Partnerships, Latin America",
    },
    photo: sb("1784465636235-qmj9gr"),
  },
];

export type Testimonial = { quote: Trilingual; name: string; role: Trilingual; photo?: string };

// Quotes from the Impact Minds 2026 report (and Marcus Bessa from the 2026 site).
export const testimonials: Testimonial[] = [
  {
    name: "Marla Blow",
    role: { pt: "CEO e Presidente, Skoll Foundation", es: "CEO y Presidenta, Skoll Foundation", en: "CEO and President, Skoll Foundation" },
    quote: {
      pt: "Nossa experiência na Impact Minds foi incrível! Foi maravilhoso nos conectar com o ecossistema de impacto e uma ótima oportunidade para conhecer diferentes atores, investidores e organizações que fazem parte da comunidade da Latimpacto.",
      es: "¡Nuestra experiencia en Impact Minds fue increíble! Fue maravilloso conectarnos con el ecosistema de impacto y una gran oportunidad para conocer a distintos actores, inversionistas y organizaciones que forman parte de la comunidad de Latimpacto.",
      en: "Our experience at Impact Minds was incredible! It was wonderful to connect with the impact ecosystem and a great opportunity to meet the different actors, investors, and organizations that are part of the Latimpacto community.",
    },
  },
  {
    name: "Alice Damasceno",
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
    role: { pt: "CEO, Fundação Luksic", es: "CEO, Fundación Luksic", en: "CEO, Luksic Foundation" },
    quote: {
      pt: "Estamos de coração cheio, porque a Impact Minds proporcionou conversas muito enriquecedoras e úteis. As pessoas que estão aqui são extraordinárias e têm projetos e experiências incríveis.",
      es: "Estamos con el corazón lleno, porque Impact Minds generó conversaciones muy enriquecedoras y útiles. Las personas que están aquí son extraordinarias y tienen proyectos y experiencias increíbles.",
      en: "Our hearts are full, because Impact Minds sparked truly enriching and useful conversations. The people here are extraordinary, with incredible projects and experiences.",
    },
  },
  {
    name: "Daniela Konietzko",
    role: { pt: "Presidente, Fundação WWB Colômbia", es: "Presidenta, Fundación WWB Colombia", en: "President, WWB Colombia Foundation" },
    quote: {
      pt: "O mais enriquecedor para mim na Impact Minds são as conversas sobre as tendências. Venho aqui para aprender, me reconectar com todos e conhecer o trabalho que estão realizando em seus territórios.",
      es: "Lo más enriquecedor para mí en Impact Minds son las conversaciones sobre tendencias. Vengo a aprender, a reconectarme con todos y a conocer el trabajo que están haciendo en sus territorios.",
      en: "What I value most at Impact Minds are the conversations about trends. I come here to learn, reconnect with everyone, and see the work they are doing in their territories.",
    },
  },
  {
    name: "Ana Cristina Rodrigues da Costa",
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
