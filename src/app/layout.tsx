import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASAYA Homebase KINnect",
  description: "Smart Family Meal Planner and Dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Navigation from "@/components/Navigation";
import AutoRefresh from "@/components/AutoRefresh";
import FamilyScreensaver from "@/components/FamilyScreensaver";
import { getFamilyPhotos } from "@/lib/drivePhotos";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch family photos server-side for the screensaver
  const familyPhotos = await getFamilyPhotos();

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        <AutoRefresh intervalMs={5 * 60 * 1000} />
        <FamilyScreensaver photos={familyPhotos} />
        <div className="container">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
