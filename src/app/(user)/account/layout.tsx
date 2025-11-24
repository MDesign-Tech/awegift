import AccountLayout from "../../../components/account/AccountLayout";

export default function AccountPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountLayout>{children}</AccountLayout>;
}
