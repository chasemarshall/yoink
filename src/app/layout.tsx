import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "yoink — download your music, your way",
    template: "%s — yoink",
  },
  description:
    "download music in lossless flac, alac, or 320kbps mp3 with full metadata, album art, and lyrics. paste a link, get the file.",
  keywords: [
    "music downloader",
    "flac downloader",
    "alac downloader",
    "mp3 converter",
    "lossless music download",
    "music metadata tagger",
    "album art embedding",
    "lyrics embedding",
    "music file converter",
    "yoink",
  ],
  metadataBase: new URL("https://yoink.chasefrazier.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "yoink — download your music, your way",
    description:
      "download music in lossless flac, alac, or 320kbps mp3. metadata, album art, and lyrics included.",
    siteName: "yoink",
    type: "website",
    locale: "en_US",
    url: "https://yoink.chasefrazier.dev",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "yoink — download your music, your way",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "yoink — download your music, your way",
    description:
      "download music in lossless flac, alac, or 320kbps mp3. metadata, album art, and lyrics included.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Static JSON-LD structured data for SEO - no user input, safe to inline
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "yoink",
  url: "https://yoink.chasefrazier.dev",
  description:
    "Download music in lossless FLAC, ALAC, or 320kbps MP3 with full metadata, album art, and lyrics.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Lossless FLAC download",
    "Lossless ALAC download",
    "320kbps MP3 conversion",
    "ID3v2 metadata embedding",
    "Album art embedding",
    "Synced lyrics embedding",
    "Playlist and album support",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
        <Script
          defer
          src="https://umami-production-95b1.up.railway.app/script.js"
          data-website-id="eea5d900-bc1a-456f-a5c7-463d9afccb09"
        />
      </body>
    </html>
  );
}
