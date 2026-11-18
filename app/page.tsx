import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import {
  Approach,
  Cta,
  Process,
  Removals,
  ServiceCards,
} from "@/components/public";
const faqs = [
  [
    "Which cleaning service should I choose?",
    "Regular cleaning is for ongoing help, one-off cleaning is for a single visit, and deep cleaning gives a space more attention. End of tenancy cleaning is for a property around a move. Rose will help agree the right scope.",
  ],
  [
    "Is my booking confirmed straight away?",
    "No. Your submission is a request. Rose reviews the property, price and preferred time before confirming. If we suggest an alternative, you can review it in your account before accepting.",
  ],
  [
    "How much will my clean cost?",
    "Final service prices are being agreed. In connected mode, unapproved rates are shown as “Price to be confirmed”. Demonstration estimates in the preview are fictional and are not public offers.",
  ],
  [
    "Where in London do you clean?",
    "Rose serves London. Exact service areas are still to be confirmed, so please include your postcode in your request for the team to review.",
  ],
  [
    "Do I pay to create an account?",
    "Registration is free. Cleaning services are paid services. This website does not collect payments at this stage.",
  ],
];
export default function Home() {
  return (
    <>
      <section className="container hero">
        <div className="hero-copy">
          <span className="eyebrow">A fresh perspective on home cleaning</span>
          <h1>
            A fresh home.
            <br />A little more
            <br />
            <span className="serif" style={{ color: "var(--rose)" }}>
              room for life.
            </span>
          </h1>
          <p className="lead">
            Thoughtful cleaning for London homes. Let Rose take care of your
            space, so you can get back to what matters to you.
          </p>
          <div className="actions">
            <Link href="/book" className="btn">
              Request a clean <ArrowUpRight size={17} />
            </Link>
            <Link href="/services" className="btn secondary">
              Explore our services
            </Link>
          </div>
          <div className="hero-foot">
            <span>
              <MapPin size={14} /> London homes
            </span>
            <span>
              <Check size={14} /> Managed by Rose
            </span>
            <span>
              <MessageCircle size={14} /> A personal approach
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            className="hero-image"
            src="/images/home-illustration.svg"
            alt="Illustration of a calm, tidy living room with a cream sofa, rose cushions and natural light"
            width={1000}
            height={1100}
            loading="eager"
            sizes="(max-width:640px) 100vw, 50vw"
          />
          <div className="hero-badge">
            <span className="icon-box">
              <Sparkles size={23} strokeWidth={1.5} />
            </span>
            <div>
              <strong>Your space, beautifully cared for.</strong>
              <small>A little less to do. A little more you time.</small>
            </div>
          </div>
          <span className="image-caption">
            Interior illustration · Photography to follow
          </span>
        </div>
      </section>
      <div className="container">
        <div className="trust-strip">
          <span>
            <HeartHandshake size={20} strokeWidth={1.5} /> One company, from
            start to finish
          </span>
          <span>
            <CalendarDays size={20} strokeWidth={1.5} /> A time that works for
            you
          </span>
          <span>
            <MessageCircle size={20} strokeWidth={1.5} /> Details agreed before
            your clean
          </span>
          <span>
            <Sparkles size={20} strokeWidth={1.5} /> A fresh start for your home
          </span>
        </div>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">There’s a clean for every chapter</span>
            <h2>
              Your home. Your routine.
              <br />
              Our care.
            </h2>
          </div>
          <Link href="/services" className="text-link">
            All cleaning services <ArrowRight size={16} />
          </Link>
        </div>
        <ServiceCards />
        <div className="services-foot">
          A workspace that needs some care?{" "}
          <Link href="/office-quote" className="text-link">
            Ask about office cleaning <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
      <Process />
      <section className="container section split">
        <div className="about-art">
          <Image
            src="/images/home-illustration.svg"
            alt="Illustrative fresh and welcoming home interior"
            width={1000}
            height={1100}
            sizes="(max-width:640px) 100vw, 50vw"
          />
          <span className="image-caption">Interior illustration</span>
        </div>
        <div>
          <span className="eyebrow">Hello, we’re Rose</span>
          <h2>
            A personal touch.
            <br />A professional clean.
          </h2>
          <p className="lead">
            Home is where life happens. We’re here to help you keep it feeling
            good.
          </p>
          <p style={{ marginBottom: 25 }}>
            Rose Professional Cleaning is a managed cleaning company serving
            London. You book with Rose, and Rose manages the team and your
            service.
          </p>
          <Link href="/about" className="text-link">
            Get to know Rose <ArrowRight size={16} />
          </Link>
          <div style={{ marginTop: 20 }}>
            <Approach />
          </div>
        </div>
      </section>
      <Removals />
      <section className="container section faq-grid">
        <div>
          <span className="eyebrow">A little clarity</span>
          <h2>
            Good questions.
            <br />
            Clear answers.
          </h2>
          <p style={{ marginBottom: 22 }}>
            Something else on your mind?
            <br />
            We’d love to hear from you.
          </p>
          <Link href="/contact" className="text-link">
            Talk to the Rose team <ArrowRight size={16} />
          </Link>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <Cta />
    </>
  );
}
