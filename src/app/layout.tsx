import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "yoink — spotify downloader",
  description: "paste a spotify link. get the mp3. metadata included.",
  metadataBase: new URL("https://yoink.chasefrazier.dev"),
  openGraph: {
    title: "yoink — spotify downloader",
    description: "paste a spotify link. get the mp3. metadata included.",
    siteName: "yoink",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "yoink — spotify downloader",
    description: "paste a spotify link. get the mp3. metadata included.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
