"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  serviceCatalogue,
  serviceCategories,
  serviceDestination,
  serviceImage,
  type ServiceCategory,
} from "@/lib/service-catalogue";

export function ServiceCatalogue({ featured = false }: { featured?: boolean }) {
  const [category, setCategory] = useState<ServiceCategory>("home");
  const [selectedId, setSelectedId] = useState("regular");
  const services = featured
    ? serviceCatalogue.filter((s) => s.featured)
    : serviceCatalogue.filter((s) => s.category === category);
  const selected = services.find((s) => s.id === selectedId) || services[0];
  const index = services.indexOf(selected);
  const group = serviceCategories.find((c) => c.id === category)!;
  const prefix = featured ? "featured" : "catalogue";
  return (
    <div
      className={`service-explorer ${featured ? "service-explorer-featured" : ""}`}
    >
      {!featured && (
        <nav className="category-nav" aria-label="Service categories">
          {serviceCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              aria-controls={`${prefix}-list`}
              onClick={() => {
                setCategory(item.id);
                setSelectedId(
                  serviceCatalogue.find((s) => s.category === item.id)!.id,
                );
              }}
            >
              {item.name}
            </button>
          ))}
        </nav>
      )}
      {!featured && (
        <div className="category-intro">
          <h2 id="category-title">{group.name}</h2>
          <p>{group.description}</p>
        </div>
      )}
      <div className="service-explorer-layout">
        <div className="service-index-list" id={`${prefix}-list`}>
          <p className="overline">
            {featured ? "Choose your fresh start" : "Explore this collection"}
          </p>
          {services.map((service, i) => (
            <div
              className="service-index-item"
              key={service.id}
              data-selected={selected.id === service.id}
            >
              <button
                type="button"
                aria-expanded={selected.id === service.id}
                aria-controls={`${prefix}-${service.id}-detail`}
                onClick={() => setSelectedId(service.id)}
                onFocus={() => setSelectedId(service.id)}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setSelectedId(service.id);
                }}
              >
                <span className="service-index-number">0{i + 1}</span>
                <span>{service.name}</span>
                <span className="service-index-toggle" aria-hidden="true">
                  {selected.id === service.id ? "−" : "+"}
                </span>
              </button>
              <div
                className="service-index-detail"
                id={`${prefix}-${service.id}-detail`}
                hidden={selected.id !== service.id}
              >
                <p>{service.description}</p>
                <Link
                  className="text-link"
                  href={serviceDestination(service)}
                  aria-label={`${service.journey === "booking" ? "Request a clean" : "Get a quote"}: ${service.name}`}
                >
                  {service.journey === "booking"
                    ? "Request a clean"
                    : "Get a quote"}
                </Link>
                {selected.id === service.id && (
                  <div className="service-inline-photo">
                    <Image
                      src={serviceImage(service)}
                      alt={service.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, 1px"
                      style={{ objectPosition: service.position }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {featured && (
            <Link href="/services" className="collection-link">
              View all services <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
        <figure className="service-explorer-visual">
          <div className="service-explorer-photo" key={selected.id}>
            <Image
              src={serviceImage(selected)}
              alt={selected.alt}
              fill
              sizes="(max-width: 800px) 100vw, 55vw"
              style={{ objectPosition: selected.position }}
            />
          </div>
          <figcaption>
            <span>{selected.name}</span>
            <span>
              0{index + 1} / 0{services.length}
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
