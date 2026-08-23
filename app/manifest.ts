import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AetherERP",
    short_name: "AetherERP",
    description: "One operating system for finance, inventory, people, customers, procurement, production and analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090C",
    theme_color: "#07090C",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/aether-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/aether-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
