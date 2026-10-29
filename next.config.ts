import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The hero video and the music are large: keep them in the browser cache, so
  // a language switch (a real page load) plays them at once instead of
  // fetching them again. A week, not forever, so a replaced file still lands.
  async headers() {
    return ["/videos/:path*", "/music/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
    }));
  },
  images: {
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
