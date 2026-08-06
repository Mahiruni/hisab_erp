import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/security", "/onboarding", "/modules/", "/finance", "/sales", "/inventory", "/purchasing", "/hr", "/reconciliation", "/e-invoicing"] },
    ],
    sitemap: "https://www.hisabtech.com/sitemap.xml",
    host: "https://www.hisabtech.com",
  };
}
