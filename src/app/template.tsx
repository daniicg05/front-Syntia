export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="route-fade-transition">{children}</div>;
}
