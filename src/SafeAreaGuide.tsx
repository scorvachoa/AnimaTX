import React from "react";

// Preview-only overlay based on the supplied 1080 × 1920 reference.
// The inner polygon is a transparent hole; no image covers the safe area.
export function SafeAreaGuide({
  opacity,
  color = "#707070",
}: {
  opacity: number;
  color?: string;
}) {
  return (
    <svg
      className="safe-area-guide"
      viewBox="0 0 1080 1920"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        fill={color}
        opacity={opacity}
        fillRule="evenodd"
        d="M0 0H1080V1920H0Z M46 115H1033V958H886V1545H46Z M313 133H762V216H313Z"
      />
      <path
        fill="none"
        stroke="#ffffff"
        strokeOpacity={opacity}
        strokeWidth="2"
        strokeDasharray="10 8"
        d="M46 115H1033V958H886V1545H46Z M313 133H762V216H313Z"
      />
    </svg>
  );
}
