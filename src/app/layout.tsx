import type { Metadata } from "next";
import Script from "next/script";
import DotPulse from "@/components/DotPulse";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "yoink — spotify downloader",
    template: "%s — yoink",
  },
  description:
    "download spotify tracks and playlists as high-quality 320kbps mp3 files with full metadata, album art, and lyrics. no account required.",
  keywords: [
    "spotify downloader",
    "spotify to mp3",
    "download spotify songs",
    "spotify playlist downloader",
    "spotify mp3 converter",
    "free spotify downloader",
    "spotify music downloader",
    "yoink",
  ],
  metadataBase: new URL("https://yoink.chasefrazier.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "yoink — spotify downloader",
    description:
      "download spotify tracks and playlists as high-quality mp3 files. metadata and album art included. no account required.",
    siteName: "yoink",
    type: "website",
    locale: "en_US",
    url: "https://yoink.chasefrazier.dev",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "yoink — spotify downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "yoink — spotify downloader",
    description:
      "download spotify tracks and playlists as high-quality mp3 files. metadata and album art included.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "yoink",
              url: "https://yoink.chasefrazier.dev",
              description:
                "Download Spotify tracks and playlists as high-quality 320kbps MP3 files with full metadata, album art, and lyrics.",
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Spotify track download",
                "Spotify playlist download",
                "ID3v2 metadata embedding",
                "Album art embedding",
                "Lyrics embedding",
                "320kbps MP3 conversion",
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <DotPulse />
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
