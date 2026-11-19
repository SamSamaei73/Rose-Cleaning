import Image from "next/image";
export function CleaningReveal() {
  return (
    <section className="signature-clean" aria-labelledby="signature-title">
      <div className="signature-heading container" data-reveal>
        <span className="overline">A fresh perspective</span>
        <h2 id="signature-title">
          See your space
          <br />
          <em>in a new light.</em>
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
        <div className="signature-edge" aria-hidden="true" />
        <div className="signature-caption">
          <span>The care is in the details.</span>
          <span>Rose Professional Cleaning</span>
        </div>
      </div>
      <p className="signature-note container">
        One photograph. A visual cleaning effect. Illustrative stock, not a
        customer before-and-after.
      </p>
    </section>
  );
}
