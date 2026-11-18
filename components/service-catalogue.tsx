"use client";
import { useState } from "react";
import {
  serviceCatalogue,
  serviceCategories,
  type ServiceCategory,
} from "@/lib/service-catalogue";
import { ServiceCards } from "./service-cards";

export function ServiceCatalogue() {
  const [category, setCategory] = useState<ServiceCategory>("home");
  const selected = serviceCategories.find((item) => item.id === category)!;
  const services = serviceCatalogue.filter(
    (service) => service.category === category,
  );
  return (
    <div className="catalogue-browser">
      <nav className="category-nav" aria-label="Service categories">
        {serviceCategories.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            aria-controls="category-services"
            onClick={() => setCategory(item.id)}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <section id="category-services" aria-labelledby="category-title">
        <div className="category-intro" aria-live="polite">
          <div>
            <h2 id="category-title">{selected.name}</h2>
            <p>{selected.description}</p>
          </div>
          <span>
            {services.length} {services.length === 1 ? "service" : "services"}
          </span>
        </div>
        <ServiceCards services={services} />
      </section>
    </div>
  );
}
