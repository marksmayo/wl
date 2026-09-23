import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { BadgeToastHost } from "@/components/BadgeToastHost";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { SwipeNav } from "@/components/SwipeNav";
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
  title: "The Hungry Games — Weight Loss Competition",
  description: "Track your progress and compete Sep 4 – Dec 12.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
        <ConfettiBurst />
        <BadgeToastHost />
        {/* Reads the current pathname, which only exists at request time —
            the boundary keeps it out of the prerendered shell. */}
        <Suspense fallback={null}>
          <SwipeNav />
        </Suspense>
      </body>
    </html>
  );
}
