import Image from "next/image";
import { PhotoFrame } from "./photo-frame";

/** One photograph, with decorative condensation confined to its glass surface. */
export function GlassReveal() {
  return (
    <section
      className="glass-section"
      id="rose-intro"
      aria-label="A fresh perspective on your space"
    >
      <PhotoFrame className="glass-photo-frame">
        <div className="glass-surface" data-glass>
          <Image
            src="/images/photography/hero-home.webp"
            alt="A light-filled living room with a cream sofa and clean wooden floors"
            fill
            sizes="100vw"
          />
          <div className="glass-condensation" aria-hidden="true">
            {[0, 1, 2].map((band) => (
              <div className="glass-mist-band" data-band={band} key={band} />
            ))}
          </div>
          <div className="glass-tool-track" aria-hidden="true">
            <svg
              className="glass-squeegee"
              viewBox="0 0 80 160"
              fill="none"
              focusable="false"
            >
              <defs>
                <linearGradient
                  id="glass-tool-metal"
                  x1="9"
                  y1="0"
                  x2="25"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--copper)" />
                  <stop offset=".35" stopColor="var(--highlight)" />
                  <stop offset=".6" stopColor="var(--copper-light)" />
                  <stop offset="1" stopColor="var(--rose)" />
                </linearGradient>
                <linearGradient
                  id="glass-tool-handle"
                  x1="0"
                  y1="70"
                  x2="0"
                  y2="90"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--copper-light)" />
                  <stop offset=".4" stopColor="var(--copper)" />
                  <stop offset="1" stopColor="var(--burgundy)" />
                </linearGradient>
              </defs>
              <rect
                x="5"
                y="8"
                width="7"
                height="144"
                rx="1"
                fill="var(--night)"
              />
              <rect
                x="11"
                y="6"
                width="13"
                height="148"
                rx="3"
                fill="url(#glass-tool-metal)"
              />
              <path d="M24 74H43V86H24" fill="url(#glass-tool-handle)" />
              <rect
                x="37"
                y="69"
                width="38"
                height="22"
                rx="6"
                fill="url(#glass-tool-handle)"
              />
              <path
                d="M15 12V148M43 73H68"
                stroke="var(--highlight)"
                strokeOpacity=".6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="glass-polish" aria-hidden="true" />
        </div>
      </PhotoFrame>
    </section>
  );
}
