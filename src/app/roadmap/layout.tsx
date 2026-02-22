import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "roadmap — yoink",
  description:
    "what we've shipped, what we're building, and what's planned next for yoink — the lossless spotify downloader.",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
