import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Database, RefreshCcw } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FTMO Crypto Lot Calculator",
  description: "Lot size calculator for FTMO crypto CFD symbols"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-card/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="text-xl font-semibold tracking-normal">
                FTMO Crypto Lot Calculator
              </Link>
              <nav className="flex flex-wrap gap-2 text-sm">
                <Link className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" href="/">
                  <Calculator className="h-4 w-4" /> Calculator
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" href="/symbols">
                  <Database className="h-4 w-4" /> Symbols
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted" href="/admin">
                  <RefreshCcw className="h-4 w-4" /> Admin
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
