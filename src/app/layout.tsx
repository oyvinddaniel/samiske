import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { FloatingSocialBubbles } from "@/components/social/FloatingSocialBubbles";
import { FeedbackBubble } from "@/components/feedback/FeedbackBubble";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "samiske.no - Møtested for det samiske",
  description: "Kommunikasjonsplattform for det samiske miljøet i Trondheim. Del arrangementer, aktiviteter og nyheter.",
  keywords: ["samisk", "trondheim", "arrangementer", "aktiviteter", "sami", "community"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "samiske.no",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1472E6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <ServiceWorkerRegistration />
        {children}
        <FloatingSocialBubbles />
        <FeedbackBubble />
      </body>
    </html>
  );
}
