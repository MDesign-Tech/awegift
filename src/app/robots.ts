import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/account",
        "/dashboard",
        "/cart",
        "/checkout",
        "/favorite",
        "/quote",
        "/m",
        "/payment/",
        "/verify-2fa",
        "/unauthorized",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
