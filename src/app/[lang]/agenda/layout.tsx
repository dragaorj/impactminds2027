import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { getAgenda } from "@/lib/agenda";
import { AgendaProvider } from "@/components/agenda/store";
import { PlatformRootSize } from "@/components/agenda/PlatformShell";

const EMPTY = { days: [], rooms: [], formats: [], talks: [], speakers: [] };

// One agenda for every page of the platform (agenda, speakers, sign-in):
// going from one to the other keeps the sign-in and the data already loaded,
// so nothing reloads, pops in or blinks.
export default async function AgendaLayout({ params, children }: LayoutProps<"/[lang]/agenda">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const data = await getAgenda(lang);
  return (
    <AgendaProvider initial={data ?? EMPTY} lang={lang}>
      <PlatformRootSize />
      {/* Embedded in another site (?embed=1): only the content, no bars. Set
          before the first paint, so the bars never flash. (Here, in the
          layout, it runs once per visit: moving between pages never
          renders it again.) */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "if(/[?&]embed=1/.test(location.search)){document.documentElement.setAttribute('data-embed','');var st=document.createElement('style');st.textContent='.platform-chrome{display:none!important}.platform-body{padding-bottom:0!important}';document.head.appendChild(st)}",
        }}
      />
      {children}
    </AgendaProvider>
  );
}
