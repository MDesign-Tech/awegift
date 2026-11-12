import PawapayPaymentResultClient from "@/components/PawapayPaymentResultClient";
import type { Metadata } from "next";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Payment Result | AweGift",
  description: "View the status of your AweGift payment.",
  noindex: true,
  nofollow: true,
  url: "/payment/result",
});

type Props = {
  searchParams: Promise<{
    orderId?: string;
    depositId?: string;
  }>;
};

export default async function PawapayPaymentResultPage({ searchParams }: Props) {
  const { orderId, depositId } = await searchParams;
  return (
    <PawapayPaymentResultClient orderId={orderId} depositId={depositId} />
  );
}
