import CheckoutClient from "@/components/CheckoutClient";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Checkout",
  description: "Complete your order and choose your payment method.",
  noindex: true,
  nofollow: true,
  url: "/checkout",
});

interface Props {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

const CheckoutPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const existingOrderId = params.orderId;

  if (!existingOrderId) {
    // This will be handled in the client component
  }

  return <CheckoutClient existingOrderId={existingOrderId || ""} />;
};

export default CheckoutPage;
