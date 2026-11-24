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
            id="citeface-mark-spectrum"
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
          stroke="url(#citeface-mark-spectrum)"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <path
          d="M30.6 16.4h8v8"
          fill="none"
          stroke="#17315B"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <path
          d="M29.8 23.8h7.4m-7.4 4.7h5.1"
          fill="none"
          stroke="#17315B"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
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
