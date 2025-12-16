import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Comme } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration, InstallPrompt } from "@/components/pwa";
import { FloatingSocialBubbles } from "@/components/social/FloatingSocialBubbles";
import { BugReportBubble } from "@/components/bug-reports";
import { BroadcastMessageModal } from "@/components/broadcast/BroadcastMessageModal";
import { Toaster } from "@/components/ui/sonner";
import { ResponsivePreview } from "@/components/dev/ResponsivePreview";
import { Footer } from "@/components/layout/Footer";
import { ActivityTracker } from "@/components/tracking/ActivityTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const comme = Comme({
  variable: "--font-comme",
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
  maximumScale: 1,
  userScalable: false,
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
        className={`${geistSans.variable} ${geistMono.variable} ${comme.variable} antialiased bg-gray-50`}
      >
        <ServiceWorkerRegistration />
        <ActivityTracker />
        <ResponsivePreview>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
          <FloatingSocialBubbles />
          <BugReportBubble />
          <BroadcastMessageModal />
          <InstallPrompt />
        </ResponsivePreview>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
