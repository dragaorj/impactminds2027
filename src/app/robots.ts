import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Everything open to search engines but the team's sign-in and the API; the
// sitemap lists the site's pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/agenda/entrar"] }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
