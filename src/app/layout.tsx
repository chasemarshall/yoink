import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yoink — spotify downloader",
  description: "paste a spotify link. get the mp3. metadata included.",
  metadataBase: new URL("https://yoink.chasefrazier.dev"),
  openGraph: {
    title: "yoink",
    description: "paste a spotify link. get the mp3. metadata included.",
    siteName: "yoink",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "yoink",
    description: "paste a spotify link. get the mp3. metadata included.",
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
