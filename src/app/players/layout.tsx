import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "music players — yoink",
  description:
    "best music players for flac, alac, and mp3 files on mac, windows, ios, and android. plays your yoink downloads with full metadata and lyrics.",
  alternates: { canonical: "/players" },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
