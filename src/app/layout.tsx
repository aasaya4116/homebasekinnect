import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinnect HomeBase",
  description: "Smart Family Meal Planner and Dashboard",
};

import Navigation from "@/components/Navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body>
        <div className="container" style={{ paddingBottom: '0' }}>
          <Navigation />
        </div>
        {children}
      </body>
    </html>
  );
}
