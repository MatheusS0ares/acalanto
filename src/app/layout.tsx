import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunito = localFont({
  src: [
    { path: "./fonts/nunito-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/nunito-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/nunito-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/nunito-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/nunito-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Casa Portal — Gestão Familiar",
  description: "Portal completo para gestão da sua família: finanças, documentos, compras, saúde e muito mais.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1a1816",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
