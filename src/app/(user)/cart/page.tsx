import CartProducts from "@/components/cart/CartProducts";
import Container from "@/components/Container";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Shopping Cart",
  description: "Review and manage your shopping cart items.",
  noindex: true,
  nofollow: true,
  url: "/cart",
});

const CartPage = async () => {
  return (
    <Container className="py-4 md:py-8">
      <CartProducts />
    </Container>
  );
};

export default CartPage;
