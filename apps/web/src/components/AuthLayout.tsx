import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "./CitefaceBrand";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  variant?: "standard" | "login";
  children: ReactNode;
}

function ResearchOrbitIllustration() {
  return (
    <svg
      viewBox="0 0 540 330"
      className="citeface-auth__illustration-art"
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <defs>
        <linearGradient
          id="research-card-line"
          x1="188"
          y1="70"
          x2="370"
          y2="260"
        >
          <stop stopColor="#246BDF" />
          <stop offset="1" stopColor="#7654D8" />
        </linearGradient>
        <filter id="research-card-shadow" x="130" y="34" width="300" height="280">
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="13"
            floodColor="#123B7C"
            floodOpacity=".24"
          />
        </filter>
      </defs>

      <ellipse cx="270" cy="164" rx="226" ry="116" stroke="#FFFFFF" strokeOpacity=".25" />
      <ellipse
        cx="270"
        cy="164"
        rx="184"
        ry="91"
        transform="rotate(-18 270 164)"
        stroke="#FFFFFF"
        strokeOpacity=".2"
      />
      <path d="M78 164h92m198 0h95" stroke="#FFFFFF" strokeOpacity=".28" />

      <g filter="url(#research-card-shadow)">
        <rect x="174" y="62" width="192" height="204" rx="22" fill="#FFFFFF" />
        <rect x="197" y="87" width="73" height="9" rx="4.5" fill="#246BDF" />
        <rect x="197" y="108" width="123" height="6" rx="3" fill="#D9E5F8" />
        <rect x="197" y="123" width="102" height="6" rx="3" fill="#D9E5F8" />
        <rect x="197" y="148" width="146" height="91" rx="12" fill="#F2F6FD" />
        <path
          d="M210 219l27-28 22 13 26-35 22 18 23-22"
          stroke="url(#research-card-line)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="237" cy="191" r="5" fill="#F0922E" />
        <circle cx="285" cy="169" r="5" fill="#7654D8" />
        <rect x="197" y="247" width="59" height="6" rx="3" fill="#F0922E" />
        <rect x="263" y="247" width="53" height="6" rx="3" fill="#D9E5F8" />
      </g>

      <circle cx="433" cy="78" r="27" fill="#F0922E" />
      <circle cx="103" cy="235" r="20" fill="#7654D8" />
      <circle cx="425" cy="239" r="12" fill="#FFFFFF" fillOpacity=".9" />
      <circle cx="112" cy="90" r="8" fill="#FFFFFF" />
      <path
        d="M103 235l54-42m278-115-40 40m30 121-40-26"
        stroke="#FFFFFF"
        strokeOpacity=".45"
        strokeDasharray="4 7"
      />
    </svg>
  );
}

export default function AuthLayout({
  eyebrow,
  title,
  description,
  variant = "standard",
  children,
}: AuthLayoutProps) {
  return (
    <main className={`citeface-auth${variant === "login" ? " citeface-auth--login" : ""}`}>
      <div
        className={`citeface-auth__layout${variant === "login" ? " citeface-auth__layout--login" : ""}`}
      >
        <aside className="citeface-auth__story">
          <Link
            className="citeface-auth__brand"
            to="/"
            aria-label="Citeface home"
          >
            <CitefaceBrand inverse large />
          </Link>

          <div className="citeface-auth__message">
            <span className="citeface-auth__kicker">
              {variant === "login"
                ? "A community for discovery"
                : "Research, in conversation"}
            </span>
            <h1>
              {variant === "login"
                ? "Good ideas find their people."
                : "Give good ideas room to travel."}
            </h1>
            <p>
              {variant === "login"
                ? "Pick up a new perspective, share what you know, and keep curiosity moving."
                : "Share your work, meet the people behind new discoveries, and follow ideas wherever they lead."}
            </p>
            <div className="citeface-auth__signals" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          {variant === "login" && (
            <div className="citeface-auth__illustration">
              <ResearchOrbitIllustration />
            </div>
          )}

          <p className="citeface-auth__tagline">
            {variant === "login"
              ? "Research moves further when we move it together."
              : "A place for curiosity, evidence, and connection."}
          </p>
        </aside>

        <section className="citeface-auth__content">
          <div className="citeface-auth__card">
            <span className="citeface-auth__eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p className="citeface-auth__description">{description}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
