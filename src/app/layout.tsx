import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Championship Tracker",
  description: "Tracking who owes dinner when a drafted team wins it all.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
            <span className="font-semibold">🏆 Championship Tracker</span>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/history" className="text-sm text-gray-600 hover:text-gray-900">
              History &amp; Dinner Ledger
            </Link>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
