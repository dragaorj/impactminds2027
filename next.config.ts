import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The stylesheet travels inside the page instead of as a separate request,
  // so the first paint never waits for it.
  experimental: { inlineCss: true },
  // Static files stay in the browser cache: the hero video and the music (a
  // language switch, a real page load, plays them at once instead of fetching
  // them again), the photos, the brand marks and the covers. A week, not
  // forever, so a replaced file still lands (new files get new names anyway).
  async headers() {
    return ["/videos/:path*", "/music/:path*", "/photos/:path*", "/brand/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
    }));
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
