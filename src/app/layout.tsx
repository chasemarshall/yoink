import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spotdl — Spotify Downloader",
  description: "Download Spotify tracks with full metadata",
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
