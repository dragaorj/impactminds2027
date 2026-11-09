import type { Dict } from "@/lib/dictionaries/pt";
import type { Locale } from "@/lib/i18n";

export const editionsPath = (lang: Locale) => `/${lang}/edicoes`;

// The site's main links, shared by the menu and the footer. Off the home page
// the section links lead back to it; the contact form is in every page's footer.
export const mainNav = (lang: Locale, nav: Dict["nav"], onHome: boolean) => {
  const home = onHome ? "" : `/${lang}`;
  return [
    { href: `${home}#sobre`, label: nav.about },
    { href: `${home}#cartagena`, label: nav.cartagena },
    { href: editionsPath(lang), label: nav.editions },
    { href: "#contato", label: nav.contact },
  ];
};
