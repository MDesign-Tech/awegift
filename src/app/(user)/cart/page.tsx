import CartProducts from "@/components/cart/CartProducts";
import Container from "@/components/Container";

const CartPage = async () => {
  return (
    <Container className="py-4 md:py-8">
      <CartProducts />
    </Container>
  );
};

export default CartPage;
