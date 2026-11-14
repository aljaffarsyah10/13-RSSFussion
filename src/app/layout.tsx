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
  applicationName: "RSSFusion",
  keywords: [
    "RSS",
    "Atom",
    "Feed Reader",
    "Information Intelligence",
    "Keyword Monitoring",
    "Tech News",
    "RSS Aggregator",
    "SaaS",
    "AI News Monitor",
  ],
  authors: [{ name: "RSSFusion Team" }],
  creator: "RSSFusion",
  publisher: "RSSFusion",
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "RSSFusion — Information Intelligence Platform",
    description: "Monitor RSS feeds, tech publications, and keywords with automated background ingestion.",
    url: baseUrl,
    siteName: "RSSFusion",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RSSFusion — Information Intelligence Platform",
    description: "Monitor RSS feeds and keywords with automated background ingestion.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RSSFusion",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "RSSFusion",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: baseUrl,
      description:
        "High-performance automated RSS feed aggregator and keyword monitoring platform with real-time analytics.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "Organization",
      name: "RSSFusion",
      url: baseUrl,
      logo: `${baseUrl}/icon.svg`,
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
