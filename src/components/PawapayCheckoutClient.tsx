"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCreditCard,
  FiLoader,
  FiMapPin,
  FiPackage,
} from "react-icons/fi";

import Container from "@/components/Container";
import PriceFormat from "@/components/PriceFormat";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import type { OrderData } from "../../type";

type ApiResponse = {
  error?: string;
  depositId?: string;
  message?: string;
  state?: string;
};

type ProviderOption = {
  provider: "AIRTEL_RWA" | "MTN_MOMO_RWA";
  displayName: string;
  status: string;
};

export default function PawapayCheckoutClient({
  existingOrderId,
}: {
  existingOrderId: string;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [existingOrder, setExistingOrder] = useState<OrderData | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderOption["provider"]>("MTN_MOMO_RWA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const availableProviders = providers.filter(
    (option) => option.status === "OPERATIONAL" || option.status === "DELAYED",
  );

  useEffect(() => {
    if (!existingOrderId) {
      router.push("/cart");
      return;
    }

    let active = true;
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${existingOrderId}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Order not found.");
        const data = await response.json();
        if (active) setExistingOrder(data.order);
      } catch (error) {
        console.error("Error fetching checkout order:", error);
        if (active) router.push("/account/orders");
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchOrder();
    return () => {
      active = false;
    };
  }, [existingOrderId, router]);

  useEffect(() => {
    let active = true;
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/payments/pawapay/providers", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.providers)) {
          throw new Error(data.error || "Mobile money providers are unavailable.");
        }
        if (active) {
          setProviders(data.providers);
          const availableProviders = data.providers.filter(
            (option: ProviderOption) =>
              option.status === "OPERATIONAL" || option.status === "DELAYED",
          );
          const preferredProvider = availableProviders.find(
            (option: ProviderOption) => option.provider === "MTN_MOMO_RWA",
          );
          if (
            preferredProvider ||
            availableProviders[0]
          ) {
            setSelectedProvider(
              (preferredProvider || availableProviders[0]).provider,
            );
          }
        }
      } catch (error) {
        if (active) {
          setProviderError(
            error instanceof Error
              ? error.message
              : "Mobile money providers are unavailable.",
          );
        }
      } finally {
        if (active) setProvidersLoading(false);
      }
    };

    void fetchProviders();
    return () => {
      active = false;
    };
  }, []);

  const startPayment = async () => {
    if (!existingOrder || paymentProcessing || !selectedProvider) return;
    if (!phoneNumber.trim()) {
      setPaymentError("Enter your Rwanda mobile money phone number to continue.");
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);
    try {
      const response = await fetch("/api/payments/pawapay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: existingOrder.id,
          provider: selectedProvider,
          phoneNumber,
        }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok && !result.depositId) {
        throw new Error(result.error || "Unable to start PawaPay checkout.");
      }
      if (!result.depositId) {
        throw new Error(result.error || "Unable to start PawaPay payment.");
      }
      router.push(
        `/payment/result?depositId=${encodeURIComponent(result.depositId)}&orderId=${encodeURIComponent(existingOrder.id)}`,
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to start PawaPay checkout. Please try again.",
      );
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 md:py-8">
        <div className="flex min-h-96 items-center justify-center">
          <FiLoader className="text-4xl text-theme-color animate-spin" />
          <span className="ml-4 text-lg">Loading order details...</span>
        </div>
      </Container>
    );
  }

  if (!session?.user) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Please Sign In</h1>
          <p className="mb-6 text-gray-600">Sign in to complete your order.</p>
          <Link
            href="/auth/signin"
            className="rounded-lg bg-theme-color px-6 py-3 text-white hover:opacity-90"
          >
            Sign In
          </Link>
        </div>
      </Container>
    );
  }

  if (!existingOrder) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Order not found</h1>
          <Link href="/account/orders" className="text-theme-color underline">
            View orders
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <RoleProtectedRoute
      allowedRoles={["user", "admin"]}
      loadingMessage="Loading checkout..."
    >
      <Container className="py-4 md:py-8">
        <div className="mb-8 flex items-center space-x-4">
          <Link
            href="/account/orders"
            aria-label="Back to orders"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Order #{existingOrder.id}
            </h1>
            <p className="text-gray-600">Complete your payment securely with PawaPay.</p>
          </div>
        </div>

        {paymentError && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {paymentError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <FiPackage className="mr-2 h-5 w-5" />
                Order Items ({existingOrder.items?.length || 0})
              </h2>
              <div className="space-y-4">
                {existingOrder.items?.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        {item.title?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} · <PriceFormat amount={item.price} />
                      </p>
                    </div>
                    <PriceFormat
                      amount={item.price * item.quantity}
                      className="font-semibold text-gray-900"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <FiMapPin className="mr-2 h-5 w-5" />
                Delivery Address
              </h2>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{session.user.name || "Customer"}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {existingOrder.orderAddress?.address}
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <FiCreditCard className="mr-2 h-5 w-5" />
                Order Summary
              </h2>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold text-theme-color">
                  {new Intl.NumberFormat("en-RW", {
                    style: "currency",
                    currency: "RWF",
                    maximumFractionDigits: 0,
                  }).format(existingOrder.totalAmount || 0)}
                </span>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Payment</h2>
              <p className="mb-5 text-sm text-gray-600">
                Pay securely in RWF with MTN MoMo or Airtel Money. Approve the payment
                request on your phone.
              </p>
              <fieldset className="mb-5 space-y-3">
                <legend className="mb-2 text-sm font-medium text-gray-800">
                  Mobile money provider
                </legend>
                {providers.map((option) => (
                  <label
                    key={option.provider}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <input
                      type="radio"
                      name="pawapay-provider"
                      value={option.provider}
                      checked={selectedProvider === option.provider}
                      onChange={() => setSelectedProvider(option.provider)}
                      disabled={
                        option.status !== "OPERATIONAL" &&
                        option.status !== "DELAYED"
                      }
                    />
                    <span className="font-medium text-gray-900">
                      {option.displayName}
                    </span>
                  </label>
                ))}
                {providersLoading && (
                  <p className="text-sm text-gray-500">Loading available providers...</p>
                )}
                {providerError && (
                  <p role="alert" className="text-sm text-red-700">{providerError}</p>
                )}
                {!providersLoading &&
                  !providerError &&
                  availableProviders.length === 0 && (
                    <p className="text-sm text-red-700">
                      No Rwanda mobile money provider is currently available.
                      Please try again later or contact support.
                    </p>
                  )}
              </fieldset>
              <label
                htmlFor="pawapay-phone"
                className="mb-2 block text-sm font-medium text-gray-800"
              >
                Rwanda mobile money phone number
              </label>
              <input
                id="pawapay-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  setPaymentError(null);
                }}
                placeholder="078 123 4567"
                className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 focus:border-theme-color focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={startPayment}
                disabled={
                  paymentProcessing ||
                  providersLoading ||
                  availableProviders.length === 0 ||
                  existingOrder.paymentStatus === "paid"
                }
                className="flex w-full items-center justify-center rounded-lg bg-theme-color px-4 py-3 text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentProcessing ? (
                  <>
                    <FiLoader className="mr-2 animate-spin" />
                    Sending payment request...
                  </>
                ) : existingOrder.paymentStatus === "paid" ? (
                  "Already paid"
                ) : (
                  "Pay with Mobile Money"
                )}
              </button>
            </section>
          </aside>
        </div>
      </Container>
    </RoleProtectedRoute>
  );
}
