import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Cta, PageHeading, ServiceCards } from "@/components/public";
import { initialServices } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/server/repository";
import { isConfigured, isDemo } from "@/lib/server/config";
export const metadata = { title: "Our cleaning services" };
export default async function Services() {
  const services =
    isDemo() || isConfigured()
      ? (await getCatalogue()).services
      : initialServices;
  return (
    <>
      <div className="container">
        <PageHeading
          eyebrow="Space to feel good"
          title="Care for every kind of clean."
        >
          From everyday routines to a new beginning, find the right starting
          point for your home.
        </PageHeading>
        <ServiceCards />
        <div className="grid-2" style={{ padding: "55px 0" }}>
          {services
            .filter((s) => s.kind === "service" && s.active)
            .map((s) => (
              <section className="card stack" key={s.id} id={s.id}>
                <h2 style={{ fontSize: 24 }}>{s.name}</h2>
                <p>{s.detail}</p>
                <p className="small">
                  Included tasks, duration, options and price are agreed with
                  Rose before confirmation.
                </p>
                <Link className="text-link" href={`/book?service=${s.id}`}>
                  Request this service <ArrowUpRight size={15} />
                </Link>
              </section>
            ))}
        </div>
        <div className="notice" style={{ marginBottom: 35 }}>
          Have something specific in mind? Mention it in your request. Optional
          extras are offered only where configured, and Rose will confirm the
          scope.
        </div>
        <section
          className="card grid-2"
          style={{
            marginBottom: 80,
            alignItems: "center",
            background: "var(--pale)",
          }}
        >
          <div>
            <span className="service-icon">
              <Building2 size={24} />
            </span>
            <h2 style={{ fontSize: 29, marginBottom: 15 }}>
              A fresh start for your workspace.
            </h2>
            <p>
              Office cleaning starts with a conversation about your premises,
              schedule and requirements.
            </p>
          </div>
          <div>
            <p style={{ marginBottom: 22 }}>
              Tell us about your office and we’ll review your quote request.
              Office services do not use a fixed household package.
            </p>
            <Link className="btn" href="/office-quote">
              Request an office quote <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </div>
      <Cta />
    </>
  );
}
