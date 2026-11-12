import type { Metadata } from "next";

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
  nofollow?: boolean;
}

const SITE_NAME = "AweGift";
export const SITE_URL = "https://aweegift.com";
const DEFAULT_TITLE =
  "AweGift | Personalized Products, Printing & Branding in Rwanda";
const DEFAULT_DESCRIPTION =
  "Discover AweGift, your online showroom for personalized products, custom printing, branding materials, packaging, promotional products, corporate gifts and supplies in Rwanda. Explore products and order online.";
const DEFAULT_KEYWORDS = [
  "AweGift",
  "personalized products Rwanda",
  "printing Rwanda",
  "branding Rwanda",
  "corporate gifts Rwanda",
  "promotional products",
  "custom packaging",
];
const DEFAULT_IMAGE = "/og-image.svg";

export function generateSEO(options: SEOOptions = {}): Metadata {
  const {
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    keywords = DEFAULT_KEYWORDS,
    image = DEFAULT_IMAGE,
    url,
    type = "website",
    noindex = false,
    nofollow = false,
  } = options;

  const fullTitle = title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} | ${SITE_NAME}`;
  const canonical = new URL(url || "/", SITE_URL).href;
  const imageUrl = new URL(image, SITE_URL).href;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Personalized products, printing and branding in Rwanda`,
          type: imageUrl.endsWith(".svg") ? "image/svg+xml" : undefined,
        },
      ],
      locale: "en_RW",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical,
    },
  };

  return metadata;
}