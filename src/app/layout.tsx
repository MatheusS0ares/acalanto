import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
