import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          background: "#1e1e2e",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "-1px",
        }}
      >
        <span style={{ color: "#cdd6f4" }}>y</span>
        <span style={{ color: "#b4befe" }}>k</span>
      </div>
    ),
    { ...size }
  );
}
