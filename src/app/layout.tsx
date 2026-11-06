import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rssfusion.local";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "RSSFusion — Information Intelligence Platform",
    template: "%s | RSSFusion",
  },
  description:
    "Aggregated information intelligence platform for monitoring RSS feeds, tech publications, and critical keywords in real time.",
  keywords: [
    "RSS",
    "Atom",
    "Feed Reader",
    "Information Intelligence",
    "Keyword Monitoring",
    "Tech News",
    "RSS Aggregator",
  ],
  authors: [{ name: "RSSFusion Team" }],
  openGraph: {
    title: "RSSFusion — Information Intelligence Platform",
    description: "Monitor RSS feeds, tech publications, and keywords with automated background ingestion.",
    url: baseUrl,
    siteName: "RSSFusion",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RSSFusion — Information Intelligence Platform",
    description: "Monitor RSS feeds and keywords with automated background ingestion.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
