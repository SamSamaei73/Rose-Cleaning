import Image from "next/image";

export function CleaningReveal() {
  return (
    <section className="signature-clean" aria-labelledby="signature-title">
      <div className="signature-heading container" data-reveal>
        <h2 id="signature-title">
          See your space
          <br />
          <em>in a new light</em>
        </h2>
      </div>
      <div className="signature-photo" data-wipe>
        <Image
          src="/images/photography/kitchen.webp"
          alt="A tidy kitchen with warm wood cabinets and a white island"
          fill
          sizes="100vw"
        />
        <div className="signature-haze" aria-hidden="true" />
        <div className="signature-sweep" aria-hidden="true">
          <div className="signature-edge" />
          <svg
            className="signature-squeegee"
            viewBox="0 0 80 160"
            fill="none"
            focusable="false"
          >
            <defs>
              <linearGradient
                id="rose-wipe-metal"
                x1="8"
                y1="0"
                x2="27"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--copper)" />
                <stop offset="0.38" stopColor="var(--highlight)" />
                <stop offset="0.62" stopColor="var(--copper-light)" />
                <stop offset="1" stopColor="var(--rose)" />
              </linearGradient>
              <linearGradient
                id="rose-wipe-grip"
                x1="0"
                y1="69"
                x2="0"
                y2="91"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="var(--copper-light)" />
                <stop offset="0.4" stopColor="var(--copper)" />
                <stop offset="1" stopColor="var(--berry)" />
              </linearGradient>
            </defs>
            <rect
              x="5"
              y="8"
              width="7"
              height="144"
              rx="2"
              fill="var(--night)"
            />
            <rect
              x="11"
              y="6"
              width="13"
              height="148"
              rx="4"
              fill="url(#rose-wipe-metal)"
            />
            <path d="M24 74H42V86H24" fill="url(#rose-wipe-grip)" />
            <rect
              x="37"
              y="69"
              width="38"
              height="22"
              rx="7"
              fill="url(#rose-wipe-grip)"
            />
            <path
              d="M43 73H68"
              stroke="var(--highlight)"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M15 12V148"
              stroke="var(--highlight)"
              strokeOpacity="0.55"
            />
          </svg>
        </div>
        <div className="signature-sheen" aria-hidden="true" />
      </div>
    </section>
  );
}
