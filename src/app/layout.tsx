import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinnect HomeBase",
  description: "Smart Family Meal Planner and Dashboard",
};

import Navigation from "@/components/Navigation";
import AutoRefresh from "@/components/AutoRefresh";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        <AutoRefresh intervalMs={5 * 60 * 1000} />
        <div className="container">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
