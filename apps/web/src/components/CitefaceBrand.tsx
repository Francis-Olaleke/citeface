import { useId } from "react";

interface CitefaceBrandProps {
  inverse?: boolean;
  large?: boolean;
  showTagline?: boolean;
}

export default function CitefaceBrand({
  inverse = false,
  large = false,
  showTagline = true,
}: CitefaceBrandProps) {
  const gradientId = `citeface-mark-spectrum-${useId().replace(/:/g, "")}`;
  const classes = [
    "citeface-brand",
    inverse ? "citeface-brand--inverse" : "",
    large ? "citeface-brand--large" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <svg
        className="citeface-brand__mark"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="7"
            y1="8"
            x2="41"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#246BDF" />
            <stop offset=".48" stopColor="#F0922E" />
            <stop offset="1" stopColor="#7654D8" />
          </linearGradient>
        </defs>
        <path
          d="M36.2 13.2A17.2 17.2 0 1 0 36.2 34.8"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth="6.5"
        />
        <path
          d="M28.5 22h7m-7 5h4.8"
          fill="none"
          stroke="#17315B"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
        <circle cx="36" cy="12.5" r="3.1" fill="#F0922E" />
        <circle cx="36" cy="35.5" r="3.1" fill="#7654D8" />
      </svg>
      <span className="citeface-brand__copy">
        <span className="citeface-brand__name">
          Cite<span>face</span>
        </span>
        {showTagline && (
          <small className="citeface-brand__tagline">
            Research. Connect. Discover.
          </small>
        )}
      </span>
    </span>
  );
}
