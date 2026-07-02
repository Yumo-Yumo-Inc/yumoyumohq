import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vision Paper",
  description:
    "Yumo Yumo vision paper — product thesis, Proof of Expense, and the economic narrative behind the protocol.",
};

export default function VisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
