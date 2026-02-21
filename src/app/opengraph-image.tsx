import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "spot.dl — Spotify Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1e1e2e",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, #313244 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.5,
          }}
        />

        {/* Top border accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, #b4befe, transparent)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            zIndex: 1,
          }}
        >
          {/* Status dot */}
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#a6e3a1",
              marginBottom: "8px",
            }}
          />

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span
              style={{
                fontSize: "96px",
                fontWeight: 700,
                color: "#cdd6f4",
                letterSpacing: "-2px",
              }}
            >
              spot
            </span>
            <span
              style={{
                fontSize: "96px",
                fontWeight: 700,
                color: "#b4befe",
                letterSpacing: "-2px",
              }}
            >
              .dl
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: "22px",
              color: "#a6adc8",
              letterSpacing: "0.5px",
            }}
          >
            paste a spotify link. get the mp3. metadata included.
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            gap: "32px",
            fontSize: "14px",
            color: "#6c7086",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          <span>spotify downloader</span>
          <span style={{ color: "#313244" }}>·</span>
          <span>metadata included</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
