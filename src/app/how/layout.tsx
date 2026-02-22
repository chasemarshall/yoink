import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "how to use spotify local files",
  description:
    "step-by-step guide to enabling spotify local files. download lossless flac or mp3 with yoink, add it to spotify, and listen ad-free. works on desktop and mobile.",
  alternates: {
    canonical: "/how",
  },
};

export default function HowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
