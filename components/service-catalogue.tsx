"use client";
import Image from "next/image";
import Link from "@/components/app-link";
import { useState } from "react";
import { PhotoFrame } from "./photo-frame";
import {
  serviceCatalogue,
  serviceCategories,
  serviceDestination,
  serviceImage,
  type ServiceCategory,
} from "@/lib/service-catalogue";

export function ServiceCatalogue({
  featured = false,
  signedIn = false,
}: {
  featured?: boolean;
  signedIn?: boolean;
}) {
  const [category, setCategory] = useState<ServiceCategory>("home");
  const [selectedId, setSelectedId] = useState("regular");
  const services = featured
    ? serviceCatalogue.filter((s) => s.featured)
    : serviceCatalogue.filter((s) => s.category === category);
  const selected = services.find((s) => s.id === selectedId) || services[0];
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
        </div>
      )}
      <div className="service-explorer-layout">
        <div className="service-index-list" id={`${prefix}-list`}>
          {services.map((service) => (
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
                  className="btn secondary small action-link"
                  href={serviceDestination(service, signedIn)}
                  aria-label={`Request: ${service.name}`}
                >
                  Request
                </Link>
                {selected.id === service.id && (
                  <PhotoFrame className="service-inline-photo">
                    <Image
                      src={serviceImage(service)}
                      alt={service.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, 1px"
                      style={{ objectPosition: service.position }}
                    />
                  </PhotoFrame>
                )}
              </div>
            </div>
          ))}
          {featured && (
            <Link href="/services" className="btn secondary collection-link">
              View all services <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
        <PhotoFrame className="service-explorer-visual">
          <div className="service-explorer-photo" key={selected.id}>
            <Image
              src={serviceImage(selected)}
              alt={selected.alt}
              fill
              sizes="(max-width: 800px) 100vw, 55vw"
              style={{ objectPosition: selected.position }}
            />
          </div>
        </PhotoFrame>
      </div>
    </div>
  );
}
