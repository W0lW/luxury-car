import type { Metadata } from "next";
import "./globals.css";

// Font e token arrivano con il design system (US-017); lingua e metadati per pagina con US-015.
export const metadata: Metadata = {
  title: "VELOCI PRIVATE | Luxury Car Rental Firenze",
  description: "Noleggio di auto di lusso a Firenze.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
