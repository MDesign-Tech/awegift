"use client";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { ProductType, StateType } from "../../../type";
import Container from "../Container";
import CartProduct from "./CartProduct";
import CartSummary from "./CartSummary";
import CartSkeleton from "./CartSkeleton";
import Link from "next/link";

const CartProducts = () => {
  const { cart } = useSelector((state: StateType) => state?.aweGift);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for cart initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Container>
        <CartSkeleton />
      </Container>
    );
  }

  return (
  <>
      {cart?.length > 0 ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shopping Cart
          </h1>
          <div className="mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-1 2">
            <section className="lg:col-span-7">
              <div className=" divide-y divide-gray-200 border-b border-t border-gray-200">
                {cart?.map((product: ProductType) => (
                  <CartProduct key={product?.id} product={product} />
                ))}
              </div>
            </section>
            <CartSummary cart={cart} />
          </div>
        </>
      ) : (
        <div className="bg-white h-96 my-10 flex flex-col gap-4 items-center justify-center py-5 rounded-lg border border-gray-200 drop-shadow-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Shopping Cart
          </h1>
          <p className="text-base max-w-[700px] text-center text-gray-600 tracking-wide leading-6">
            Your cart is empty. Browse our products and add items to your cart to get started!
          </p>
          <Link
            className="bg-theme-color text-gray-100 px-8 py-4 rounded-md hover:bg-accent-color duration-200 uppercase text-sm font-semibold tracking-wide"
            href="/"
          >
            go to shopping
          </Link>
        </div>
      )}
      </>
  );
};

export default CartProducts;
