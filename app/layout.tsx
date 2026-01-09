import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

/**
 * Font Inter - scelto per leggibilità, non personalità
 *
 * Dalle specifiche di design:
 * "leggibilità > personalità"
 *
 * Pesi caricati:
 * - 400 (regular): testo normale
 * - 500 (medium): label, sottotitoli
 * - 600 (semibold): titoli, emphasis
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CompilaloEasy",
  description:
    "Compila documenti in pochi click. Salva i tuoi dati una volta, usali per sempre.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ottieni lingua e traduzioni lato server
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
