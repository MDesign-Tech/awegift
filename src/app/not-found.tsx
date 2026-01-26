
import Container from "@/components/Container";

import { Metadata } from "next";
import NotFoundClient from "@/components/not-found/NotFoundClient";
import NotFound from "../assets/notFound.png"

export const metadata: Metadata = {
  title: "Page Not Found | AweGift",
  description:
    "The page you're looking for doesn't exist. Return to our homepage or browse our products.",
};

export default function GlobalNotFound() {
  return (
    <Container className="py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <img src={NotFound.src}
            className="mx-auto"

            alt="Page not found" />
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            The page you&apos;re looking for seems to have wandered off into the
            digital void. Don&apos;t worry though, we&apos;ll help you find your
            way back to something amazing!
          </p>

          {/* Interactive countdown component */}
          <NotFoundClient />
        </div>
      </div>
    </Container>
  );
}
