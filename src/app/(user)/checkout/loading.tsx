import Container from "@/components/Container";
import { FiLoader } from "react-icons/fi";

export default function CheckoutLoading() {
  return (
    <Container className="py-8">
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-4xl text-primary" />
        <div>Checking...</div>
      </div>
    </Container>
  );
}
