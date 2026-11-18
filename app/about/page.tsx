import { Approach, Cta, PageHeading, Removals } from "@/components/public";
export const metadata = { title: "About Rose" };
export default function About() {
  return (
    <>
      <div className="container">
        <PageHeading
          eyebrow="Hello, we’re Rose"
          title="A little care makes a big difference."
        >
          Managed cleaning for London homes, with your needs at the heart of the
          conversation.
        </PageHeading>
        <div
          className="split"
          style={{ paddingBottom: 80, alignItems: "start" }}
        >
          <div className="prose" style={{ paddingBottom: 0 }}>
            <h2>A company you can speak with.</h2>
            <p>
              Rose Professional Cleaning brings household cleaning services
              together under one name. Your booking is with Rose. We manage our
              staff and the delivery of your service.
            </p>
            <p>
              Whether you need help with the regular routine, a one-off refresh,
              a deeper clean or a property around a move, the first step is
              understanding your space.
            </p>
            <p>
              Share your priorities and preferred time. Rose will review the
              details and agree the service and price with you before your
              request becomes a confirmed visit.
            </p>
            <p>
              We serve London, with exact service areas being finalised. Add
              your postcode to your request so we can check your location.
            </p>
          </div>
          <Approach />
        </div>
      </div>
      <Removals />
      <div style={{ height: 70 }} />
      <Cta />
    </>
  );
}
