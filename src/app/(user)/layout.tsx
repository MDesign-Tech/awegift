import Header from "@/components/header/Header";
import Footer from "@/components/Footer";
import Layout from "@/components/layout/Layout";
import DashboardHeaderToggle from "../../components/dashboard/DashboardHeaderToggle";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout>
      <DashboardHeaderToggle />
      <Header />
      {children}
      <Footer />
    </Layout>
  );
}
