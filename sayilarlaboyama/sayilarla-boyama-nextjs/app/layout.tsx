import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Sayılarla Boyama",
  description: "Fotoğrafları sayılarla boyama şablonuna dönüştür.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}