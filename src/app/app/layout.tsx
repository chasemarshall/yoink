import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "download",
  description:
    "paste a spotify, apple music, or youtube link and download tracks or playlists in lossless flac, alac, or 320kbps mp3 with full metadata.",
  alternates: {
    canonical: "/app",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
