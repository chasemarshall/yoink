import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://yoink.chasefrazier.dev";

  return [
    { url: base, lastModified: new Date(), priority: 1.0 },
    { url: `${base}/app`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/how`, lastModified: new Date(), priority: 0.7 },
  ];
}
