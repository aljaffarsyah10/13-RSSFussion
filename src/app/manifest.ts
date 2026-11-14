import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RSSFusion — Information Intelligence Platform",
    short_name: "RSSFusion",
    description: "Monitor RSS feeds, tech publications, and critical keywords with automated background ingestion.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#18181b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
