import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "search — yoink",
  description:
    "search for any song by name and download it in lossless flac, alac, or 320kbps mp3. no spotify link needed.",
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
