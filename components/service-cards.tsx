import Image from "next/image";
import Link from "next/link";
import {
  serviceDestination,
  serviceImage,
  type PublicService,
} from "@/lib/service-catalogue";

export function ServiceCards({
  services,
  signedIn = false,
}: {
  services: PublicService[];
  signedIn?: boolean;
}) {
  return (
    <div className="photo-services-grid">
      {services.map((service) => (
        <article className="photo-service" key={service.id}>
          <div className="service-photo">
            <Image
              src={serviceImage(service)}
              alt={service.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
              style={{ objectPosition: service.position }}
            />
          </div>
          <div className="service-copy">
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <Link
              className="text-link"
              href={serviceDestination(service, signedIn)}
              aria-label={`Request: ${service.name}`}
            >
              Request
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
