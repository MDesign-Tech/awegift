import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Title from "../Title";
import Button from "../ui/Button";
import PriceFormat from "../PriceFormat";
import OrderAddressSelector from "./OrderAddressSelector";
import { ProductType, Address, OrderData } from "../../../type";
import { ORDER_STATUSES, PAYMENT_METHODS,PAYMENT_STATUSES } from "@/lib/orderStatus";
import { hasPermission, UserRole } from "@/lib/rbac/roles";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { FaSignInAlt } from "react-icons/fa";
import Link from "next/link";
import { resetCart } from "@/redux/aweGiftSlice";

interface Props {
  cart: ProductType[];
}

const CartSummary = ({ cart }: Props) => {
  const [totalAmt, setTotalAmt] = useState(0);
  // const [discountAmt, setDiscountAmt] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [placing, setPlacing] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);

  const { data: session } = useSession();
  const router = useRouter();
  const dispatch = useDispatch();

  const userRole = session?.user?.role as UserRole;
  const canPlaceOrder = hasPermission(userRole, "canCreateOrders");

  useEffect(() => {
    let amt = 0;
    cart?.map((item) => {
      amt += item?.price * item?.quantity!;
    });

    setTotalAmt(amt);
    // setDiscountAmt(discount);
  }, [cart]);

  const handleCheckout = async () => {
    if (!session?.user) {
      // Redirect to login page for unauthenticated users
      router.push("/auth/signin?callbackUrl=/cart");
      return;
    }

    if (!canPlaceOrder) {
      alert("You don't have permission to place orders.");
      return;
    }

    if (!selectedAddress) {
      alert("Please select a delivery address before placing your order.");
      return;
    }

    try {
      setPlacing(true);
      
      const finalTotal = totalAmt;

      // Generate order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare order data matching OrderData interface
      const orderData: OrderData = {
        id: orderId,
        userId: "", // Will be set by API
        customerName: session?.user?.name || "",
        customerEmail: session?.user?.email || "",
        status: ORDER_STATUSES.PENDING,
        items: cart.map((item: ProductType) => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity!,
          thumbnail: item.thumbnail || item.images?.[0] || "",
          sku: item.sku || "",
        })),
        totalAmount: finalTotal,
        orderAddress: selectedAddress!,
        paymentMethod: PAYMENT_METHODS.ONLINE, // Default to online, will be updated in checkout
        paymentStatus: PAYMENT_STATUSES.PENDING,
        statusHistory: [
          {
            status: ORDER_STATUSES.PENDING,
            changedBy: session?.user?.email || "",
            changedByRole: userRole,
            timestamp: new Date().toISOString(),
            notes: "Order placed from cart",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Place order
      const response = await fetch("/api/orders/place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();

        // Navigate to checkout page with order ID for payment method selection
        router.push(`/checkout?orderId=${result.id}`);

        // Clear cart after successful order placement
        dispatch(resetCart());
        
      } else {
        throw new Error("Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const isCheckoutDisabled = session?.user && (!canPlaceOrder || (!addressLoading && !selectedAddress) || placing);

  return (
    <section className="rounded-lg bg-gray-100 px-4 py-6 sm:p-10 lg:col-span-5 mt-16 lg:mt-0">
      <Title>Cart Summary</Title>

      {/* Show different content based on authentication status */}
      {session?.user ? (
        <>
          {/* Order Address Selector */}
          <OrderAddressSelector
            selectedAddress={selectedAddress}
            onAddressSelect={setSelectedAddress}
            onLoadingChange={setAddressLoading}
          />

          {/* address Required Warning */}
          {!addressLoading && !selectedAddress && (
            <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center text-orange-800">
                <FiAlertCircle className="text-orange-600 text-lg mr-2" />
                <span className="text-sm font-medium">
                  Please select a delivery address to proceed with checkout
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Login Required Message */
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <FaSignInAlt className="text-blue-600 text-lg mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-800 font-medium mb-2">
                Login Required to Place Order
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                You can browse and add items to your cart, but you&apos;ll need
                to sign in to complete your purchase and access checkout.
              </p>
              <Link
                href="/auth/signin?callbackUrl=/cart"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium underline"
              >
                <FaSignInAlt className="w-3 h-3" />
                Sign in to continue
              </Link>
            </div>
          </div>
        </div>
      )}


      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Title className="text-lg font-medium">Sub Total</Title>
          <PriceFormat amount={totalAmt} />
        </div>
        {/* <div className="flex items-center justify-between">
          <Title className="text-lg font-medium">Discount</Title>
          <PriceFormat amount={discountAmt} />
        </div> */}
        <div className="border-t border-gray-300 pt-3 flex items-center justify-between">
          <Title className="text-lg font-bold">Total Amount</Title>
          <PriceFormat
            amount={totalAmt}
            className="text-lg font-bold text-theme-color"
          />
        </div>
        <Button
          onClick={handleCheckout}
          className={`mt-4 ${
            isCheckoutDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isCheckoutDisabled}
        >
          {!session?.user ? (
            "Sign in to Place Order"
          ) : !canPlaceOrder ? (
            "You don't have permission to place orders"
          ) : placing ? (
            <>
              <FiLoader className="animate-spin mr-2" />
              Placing Order...
            </>
          ) : (!addressLoading && !selectedAddress) ? (
            "Select Address to Place Order"
          ) : (
            "Place Order"
          )}
        </Button>
      </div>
    </section>
  );
};

export default CartSummary;
