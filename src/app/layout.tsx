import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Dacar — Groceries, Food & Parcels in Garissa",
  description:
    "Order groceries, food, and parcel delivery across Garissa town.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${workSans.variable} ${jetbrainsMono.variable} font-sans bg-dacar-bg text-dacar-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}