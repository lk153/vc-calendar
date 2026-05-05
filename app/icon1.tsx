import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#059669",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M3 10h18M8 3v4M16 3v4" />
          <circle cx="8" cy="14" r="0.9" fill="#ffffff" stroke="none" />
          <circle cx="12" cy="14" r="0.9" fill="#ffffff" stroke="none" />
          <circle cx="16" cy="14" r="0.9" fill="#ffffff" stroke="none" />
          <circle cx="8" cy="18" r="0.9" fill="#ffffff" stroke="none" />
          <circle cx="12" cy="18" r="0.9" fill="#ffffff" stroke="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
