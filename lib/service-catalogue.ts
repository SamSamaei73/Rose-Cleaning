import { customerEntryHref } from "./navigation";

/** Public presentation and account entry. Existing service IDs are retained.
 * Photography attribution is recorded in docs/PHOTOGRAPHY.md.
 */
export const serviceCategories = [
  {
    id: "home",
    name: "Home cleaning",
    description: "Everyday care and fresh starts for your home.",
  },
  {
    id: "workplace",
    name: "Workplace",
    description: "A clean, welcoming place to work.",
  },
  {
    id: "specialist",
    name: "Specialist",
    description: "Focused care for the areas that need it.",
  },
  {
    id: "outdoor",
    name: "Outdoor",
    description: "A tidy, refreshed space outside your door.",
  },
  {
    id: "vehicle",
    name: "Vehicle",
    description: "A fresh finish for your car.",
  },
] as const;
export type ServiceCategory = (typeof serviceCategories)[number]["id"];
export type PublicService = {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  image: string;
  alt: string;
  journey: "booking" | "quote" | "office";
  featured?: boolean;
  position?: string;
};
export const serviceCatalogue: PublicService[] = [
  {
    id: "regular",
    name: "Regular Domestic Cleaning",
    description: "A regular clean to keep your home feeling cared for.",
    category: "home",
    image: "regular-whatsapp",
    alt: "A woman wiping a kitchen cabinet with a blue cloth.",
    position: "50% 45%",
    journey: "booking",
    featured: true,
  },
  {
    id: "deep",
    name: "Deep Cleaning",
    description: "A thorough refresh for the areas that need extra attention.",
    category: "home",
    image: "deep",
    alt: "A woman carefully wiping a glass hob in a bright kitchen.",
    position: "50% 55%",
    journey: "booking",
    featured: true,
  },
  {
    id: "end-of-tenancy",
    name: "End of Tenancy Cleaning",
    description: "Leave a clean space for the next chapter.",
    category: "home",
    image: "end-of-tenancy",
    alt: "A bright, empty apartment with a clean tiled floor.",
    position: "50% 60%",
    journey: "booking",
    featured: true,
  },
  {
    id: "kitchen-cleaning",
    name: "Kitchen Cleaning",
    description: "A focused clean for your kitchen and its surfaces.",
    category: "home",
    image: "kitchen",
    alt: "A tidy contemporary kitchen with warm wood cabinets and a white island.",
    position: "50% 50%",
    journey: "quote",
  },
  {
    id: "bathroom-cleaning",
    name: "Bathroom Cleaning",
    description: "Freshen up your bathroom, fittings and surfaces.",
    category: "home",
    image: "bathroom",
    alt: "A yellow-gloved hand cleaning a bathroom tap with a soapy sponge.",
    position: "50% 50%",
    journey: "quote",
  },
  {
    id: "dusting-surfaces",
    name: "Dusting & Surface Cleaning",
    description: "Remove dust and refresh the surfaces around your home.",
    category: "home",
    image: "dusting",
    alt: "Pink-gloved hands wiping a white shelf with a blue cloth.",
    position: "50% 50%",
    journey: "quote",
  },
  {
    id: "office-cleaning",
    name: "Office Cleaning",
    description: "Cleaning arranged around your workplace and its needs.",
    category: "workplace",
    image: "office",
    alt: "Office desks and chairs beside large windows.",
    position: "50% 50%",
    journey: "office",
  },
  {
    id: "window-cleaning",
    name: "Window Cleaning",
    description: "A clearer view, with the scope and access agreed first.",
    category: "specialist",
    image: "windows",
    alt: "A gloved hand wiping a window with a green sponge.",
    position: "50% 35%",
    journey: "quote",
  },
  {
    id: "after-builders",
    name: "After-Builders Cleaning",
    description: "Help clear the dust and mess after building work.",
    category: "specialist",
    image: "after-builders",
    alt: "A room nearing the end of renovation, with a ladder and materials on the floor.",
    position: "50% 55%",
    journey: "quote",
  },
  {
    id: "carpet-upholstery",
    name: "Carpet & Upholstery Cleaning",
    description:
      "Focused cleaning to refresh carpets and upholstered furniture.",
    category: "specialist",
    image: "carpet",
    alt: "A person using a steam-cleaning tool on a rug in a light room.",
    position: "50% 75%",
    journey: "quote",
  },
  {
    id: "front-garden",
    name: "Front Garden Cleaning",
    description: "Clear and tidy your front garden's outdoor surfaces.",
    category: "outdoor",
    image: "front-garden",
    alt: "A person sweeping fallen leaves from a paved path beside greenery.",
    position: "50% 35%",
    journey: "quote",
  },
  {
    id: "back-garden",
    name: "Back Garden Cleaning",
    description: "Refresh your back garden and patio with a focused clean.",
    category: "outdoor",
    image: "back-garden",
    alt: "A person washing outdoor paving with a pressure washer.",
    position: "50% 55%",
    journey: "quote",
  },
  {
    id: "wheelie-bin",
    name: "Wheelie Bin Cleaning",
    description: "A dedicated wash to freshen up your wheelie bins.",
    category: "outdoor",
    image: "wheelie-bin",
    alt: "Four wheelie bins standing outdoors against a wooden fence.",
    position: "50% 50%",
    journey: "quote",
  },
  {
    id: "mobile-car-wash",
    name: "Mobile Car Wash",
    description:
      "Car washing at your location, with the details agreed by Rose.",
    category: "vehicle",
    image: "car-wash",
    alt: "Hands washing a car window with a sponge and soapy water.",
    position: "50% 45%",
    journey: "quote",
  },
];
export function serviceImage(service: PublicService) {
  return `/images/photography/${service.image}.webp`;
}
export function serviceDestination(service: PublicService, signedIn = false) {
  return customerEntryHref(signedIn, service.id);
}
export const findPublicService = (id?: string) =>
  serviceCatalogue.find((service) => service.id === id);
