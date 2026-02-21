import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "download",
  description:
    "paste a spotify track or playlist link and download high-quality mp3 files with full metadata and album art.",
  alternates: {
    canonical: "/app",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
