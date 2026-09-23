import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial prerendering + `use cache`. Every route ships a static shell from
  // the CDN and streams the session/database-dependent parts in behind
  // Suspense boundaries (see the loading.tsx files and layout.tsx).
  cacheComponents: true,
};

export default nextConfig;
