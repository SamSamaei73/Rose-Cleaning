import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  House,
  KeyRound,
  Sparkles,
  Sun,
  Truck,
  Check,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";
import { initialServices } from "@/lib/catalogue";
import { brand } from "@/lib/brand";
import type { Service } from "@/lib/types";
const icons = [House, Sun, Sparkles, KeyRound];
export function ServiceCards({
  services = initialServices,
}: {
  services?: Service[];
}) {
  return (
    <div className="services-grid">
      {services
        .filter((s) => s.kind === "service" && s.active)
        .map((service, index) => {
          const Icon = icons[index % 4];
          return (
            <article className="service-card" key={service.id}>
              <span className="service-number">0{index + 1}</span>
              <span className="service-icon">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <Link href={`/book?service=${service.id}`}>
                Explore & request <ArrowUpRight size={16} />
              </Link>
            </article>
          );
        })}
    </div>
  );
}
export function Cta() {
  return (
    <section className="container">
      <div className="cta">
        <div>
          <h2>Come home to a fresh start.</h2>
          <p>Tell us about your space. We’ll take it from there.</p>
        </div>
        <Link className="btn white" href="/book">
          Request a clean <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}
export function Removals() {
  return (
    <section className="removals">
      <div className="container section split">
        <div>
          <span className="eyebrow">A little help with your next chapter</span>
          <h2>
            Moving home?
            <br />
            Meet the Rose family.
          </h2>
          <p className="lead">
            A move is more than moving boxes. Alongside your cleaning request,
            you can ask us about our sister business, Rose Removals.
          </p>
          <p style={{ fontSize: 13, marginBottom: 25 }}>
            Separate services, a familiar name. Speak with the team about
            cleaning and removals for your move.
          </p>
          <Link href="/contact?subject=Moving%20home" className="text-link">
            Let’s talk about your move <ArrowRight size={16} />
          </Link>
        </div>
        {brand.removalsVan ? (
          <Image
            src={brand.removalsVan}
            alt="The white Rose Removals van, belonging to our sister business"
            width={650}
            height={420}
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="asset-placeholder">
            <Truck size={38} strokeWidth={1} />
            <strong>Rose Removals</strong>
            <p>
              Original white van photograph to be added.
              <br />
              The supplied Rose Removals image is required for this space.
            </p>
            <span className="pill">Image placeholder · Sister business</span>
          </div>
        )}
      </div>
    </section>
  );
}
export function Approach() {
  return (
    <div className="stack" style={{ gap: 0 }}>
      {[
        {
          icon: HeartHandshake,
          title: "Your booking is with Rose",
          text: "Rose manages the team and your service, giving you one company to speak with.",
        },
        {
          icon: MessageCircle,
          title: "A conversation before a commitment",
          text: "We review your property details, priorities and preferred time before confirming.",
        },
        {
          icon: Check,
          title: "Clear details, agreed together",
          text: "The service scope and complete price are agreed with you. A request is only confirmed when Rose says so.",
        },
      ].map(({ icon: Icon, title, text }) => (
        <div className="value-row" key={title}>
          <Icon size={22} strokeWidth={1.5} />
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Process() {
  return (
    <section className="soft-section">
      <div className="container section">
        <span className="eyebrow">Refreshingly simple</span>
        <div className="section-heading">
          <h2>
            A cleaner home.
            <br />
            In three simple steps.
          </h2>
          <p>
            From the first request to the final details, know exactly what
            happens next.
          </p>
        </div>
        <div className="steps">
          {[
            {
              title: "Tell us about your home",
              text: "Choose your service and share a few details about your space and cleaning priorities.",
            },
            {
              title: "Request your preferred time",
              text: "Choose a date and arrival window that suit you, then review your request.",
            },
            {
              title: "We’ll confirm the details",
              text: "Rose reviews your request and agrees the service, time and price with you.",
            },
          ].map((s, i) => (
            <div key={s.title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export { CalendarDays };
