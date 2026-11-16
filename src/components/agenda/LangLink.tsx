"use client";

// A language in the platform's switcher. Picking one is remembered (the
// site's own "im-lang" cookie, 12 months), as in the site's switcher: from
// then on that language wins over the browser's. Until someone picks, the
// platform opens in their browser's language (see proxy.ts).
export default function LangLink({ lang, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { lang: string }) {
  return (
    <a
      {...rest}
      lang={lang}
      hrefLang={lang}
      onClick={(e) => {
        document.cookie = `im-lang=${lang};path=/;max-age=31536000;samesite=lax`;
        // A shared or embedded page stays so in the other language.
        const now = new URLSearchParams(location.search);
        const keep = new URLSearchParams();
        for (const k of ["embed", "single"]) if (now.get(k)) keep.set(k, now.get(k)!);
        if (keep.size) e.currentTarget.href = `${e.currentTarget.pathname}?${keep}`;
      }}
    />
  );
}
