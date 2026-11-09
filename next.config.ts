import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The stylesheet stays a separate, cached file. (Inlining it, the
  // experimental inlineCss, sent its 130 KB twice in every page, in the HTML
  // and again in the React payload, which made parsing the page the longest
  // task on phones.)
  // Static files stay in the browser cache: the hero video (a language
  // switch, a real page load, plays it at once instead of fetching it again),
  // the photos, the brand marks and the PDFs. A week, not forever, so a
  // replaced file still lands (new files get new names anyway). The PDFs
  // (report, sponsorship brochure) open in the browser, never as a download.
  async headers() {
    const cache = { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" };
    return [
      ...["/videos/:path*", "/photos/:path*", "/brand/:path*"].map((source) => ({ source, headers: [cache] })),
      { source: "/docs/:path*", headers: [cache, { key: "Content-Disposition", value: "inline" }] },
    ];
  },
  images: {
    // AVIF where the browser takes it (smaller), WebP otherwise.
    formats: ["image/avif", "image/webp"],
    // Optimised images are kept 30 days (the default is 4 hours).
    minimumCacheTTL: 2592000,
    // Fewer candidate widths than the defaults (15): every image's srcset in
    // the HTML lists each one, and the page has dozens of images.
    deviceSizes: [640, 828, 1080, 1600, 2048],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      // Speaker photos hosted by the impactminds.app agenda platform.
      { protocol: "https", hostname: "yndnugzoqiyophwkzrcx.supabase.co" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
