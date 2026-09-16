import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://bolicash-webdinamica.vercel.app"
  ),
  title: "Bolicash - Dinámicas Deportivas en Vivo",
  description:
    "Participa en las dinámicas deportivas de Bolicash y gana premios en efectivo. ¡Acierta y gana dinero real!",
  openGraph: {
    title: "Bolicash - Dinámicas Deportivas en Vivo",
    description:
      "¡Participa en las dinámicas deportivas de Bolicash y gana premios en efectivo! Acierta el resultado y gana.",
    url: "/",
    siteName: "Bolicash",
    locale: "es_BO",
    type: "website",
    images: [
      {
        url: "/og-bolicash.jpg",
        width: 1200,
        height: 630,
        alt: "Bolicash - Dinámicas Deportivas en Vivo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolicash - Dinámicas Deportivas en Vivo",
    description:
      "¡Participa en las dinámicas deportivas de Bolicash y gana premios en efectivo!",
    images: ["/og-bolicash.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}