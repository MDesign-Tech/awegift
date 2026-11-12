import Container from "@/components/Container";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Printing & Branding Services | AweGift",
  description:
    "AweGift's printing and branding services information is being prepared. Contact our team for details about personalized products and business inquiries in Rwanda.",
  url: "/services",
});

export default function ServicesPage() {
  return (
    <Container className="py-4 md:py-8">
      <h1>Services Page - Under Construction</h1>
    </Container>
  )
}