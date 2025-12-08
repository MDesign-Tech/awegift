import type { Metadata } from "next";
import Header from "@/components/header/Header";
import Footer from "@/components/Footer";
import Layout from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "AweGift - Multipurpose eCommerce website",
  description: "Best place to buy and sell products online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout>
      <Header />
      {children}
      <Footer />
    </Layout>
  );
}
