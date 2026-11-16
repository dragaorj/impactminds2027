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
      {/* Shared or embedded, set before the first paint (so nothing
          flashes) and once per visit (moving between pages keeps it):
          ?embed=1     only the page's content, no bars (in another site);
          ?embed=tabs  the content and the Agenda / Speakers tabs only;
          ?single=1    one page alone: no tabs, and no links into the other
                       page (a speaker's sessions stay plain text). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var q=location.search,c='';if(/[?&]embed=1/.test(q)){document.documentElement.setAttribute('data-embed','');c+='.platform-chrome{display:none!important}.platform-body{padding-bottom:0!important}';}else if(/[?&]embed=tabs/.test(q)){document.documentElement.setAttribute('data-embed','');c+='.platform-top,.platform-foot,nav[data-tour=tabs]>:not([data-tour^=tab-]){display:none!important}';}if(/[?&]single=1/.test(q)){c+='[data-tour=tabs]{display:none!important}.platform-body{padding-bottom:0!important}[data-xlink]{pointer-events:none}';}if(c){var st=document.createElement('style');st.textContent=c;document.head.appendChild(st)}})()",
        }}
      />
      {children}
    </AgendaProvider>
  );
}
