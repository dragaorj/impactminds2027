// Who joined the 2026 edition, by tier, as on the official 2026 sponsor board.
// Logos live in public/sponsors (trimmed WebP, at most 640x200); w and h are
// the files' own sizes, used to give every logo the same visual weight.
export type Logo = { slug: string; name: string; w: number; h: number };
export type Tier = { key: TierKey; logos: Logo[] };
export type TierKey = "pioneers" | "visionaries" | "sponsor" | "catalysts" | "boosting" | "media" | "partners";

const L = (slug: string, name: string, w: number, h: number): Logo => ({ slug, name, w, h });

export const sponsorTiers: Tier[] = [
  { key: "pioneers", logos: [L("bid-lab", "BID Lab", 640, 131)] },
  {
    key: "visionaries",
    logos: [L("bora", "Bora Hub Ambev", 486, 200), L("fundo-vale", "Fundo Vale", 450, 200), L("skoll", "Skoll Foundation", 503, 200)],
  },
  { key: "sponsor", logos: [L("sebrae", "Sebrae", 370, 200)] },
  { key: "catalysts", logos: [L("bayer-foundation", "Bayer Foundation", 640, 127), L("wwb", "Fundación WWB Colombia", 446, 200)] },
  {
    key: "boosting",
    logos: [
      L("anglo-american", "Anglo American Foundation", 640, 141),
      L("argidius", "Argidius", 543, 200),
      L("citi", "Citi", 347, 200),
      L("santo-domingo", "Fundación Santo Domingo", 199, 114),
      L("sabin", "Instituto Sabin", 640, 171),
      L("myriad", "Myriad USA", 482, 200),
      L("pro-mujer", "Pro Mujer", 618, 200),
      L("rockefeller", "The Rockefeller Foundation", 541, 200),
      L("ubs", "UBS", 565, 200),
    ],
  },
  {
    key: "media",
    logos: [
      L("alliance", "Alliance", 614, 175),
      L("impact-alpha", "ImpactAlpha", 640, 73),
      L("draft", "DRAFT", 640, 153),
      L("pioneers-post", "Pioneers Post", 520, 108),
      L("profile", "Profile", 627, 200),
      L("ssir", "Stanford Social Innovation Review Brasil", 640, 140),
    ],
  },
  {
    key: "partners",
    logos: [
      L("caf", "Charities Aid Foundation", 349, 200),
      L("idis", "IDIS", 494, 200),
      L("impact-hub-manaus", "Impact Hub Manaus", 509, 200),
      L("instituto-natura", "Fundación Instituto Natura", 323, 200),
      L("somos-um", "Somos Um", 557, 200),
      L("the-carbon-sink", "The Carbon Sink", 512, 200),
    ],
  },
];
