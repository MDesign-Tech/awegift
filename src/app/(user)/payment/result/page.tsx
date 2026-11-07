import PawapayPaymentResultClient from "@/components/PawapayPaymentResultClient";

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
