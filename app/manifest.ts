import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hisab ERP",
    short_name: "Hisab",
    description: "An English business operating system for Ethiopian organizations.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#14213D",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/hisab-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/hisab-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
