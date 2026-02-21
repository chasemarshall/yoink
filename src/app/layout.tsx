import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spot.dl — spotify downloader",
  description: "paste a spotify link. get the mp3. metadata included.",
  metadataBase: new URL("https://spotdl.chasefrazier.dev"),
  openGraph: {
    title: "spot.dl",
    description: "paste a spotify link. get the mp3. metadata included.",
    siteName: "spot.dl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "spot.dl",
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
