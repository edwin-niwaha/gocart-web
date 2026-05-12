import AccountLayout from '@/app/(account)/account/layout';

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountLayout>{children}</AccountLayout>;
}
