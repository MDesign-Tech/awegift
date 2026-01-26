import { Metadata } from "next";

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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://awegift.vercel.app"; // Update this in env for production
const DEFAULT_TITLE = `${SITE_NAME} - Premium Gifts and Personalized Presents`;
const DEFAULT_DESCRIPTION =
  "Discover unique and thoughtful gifts at AweGift. Shop personalized presents, custom gifts, luxury items, and more with fast delivery and secure checkout.";
const DEFAULT_KEYWORDS = [
  "ecommerce",
  "shopping",
  "online store",
  "gifts",
  "personalized gifts",
  "custom presents",
  "luxury gifts",
  "birthday gifts",
  "anniversary gifts",
  "wedding gifts",
  "corporate gifts",
];
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`; // Update with actual OG image

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

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  const robots = [];
  if (noindex) robots.push("noindex");
  if (nofollow) robots.push("nofollow");
  if (robots.length === 0) robots.push("index", "follow");

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: robots.join(", "),
    openGraph: {
      title: fullTitle,
      description,
      url: url ? `${SITE_URL}${url}` : SITE_URL,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@awegift", // Update if you have Twitter handle
    },
    alternates: {
      canonical: url || "/",
    },
  };

  return metadata;
}