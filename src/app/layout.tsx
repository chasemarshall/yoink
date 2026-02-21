import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spot.dl — Spotify Downloader",
  description: "Paste a Spotify link. Get the MP3. Metadata included.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL || "https://downloader-production-f05e.up.railway.app"
  ),
  openGraph: {
    title: "spot.dl",
    description: "Paste a Spotify link. Get the MP3. Metadata included.",
    siteName: "spot.dl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "spot.dl",
    description: "Paste a Spotify link. Get the MP3. Metadata included.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
