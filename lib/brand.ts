export const brand = {
  name: "Rose Professional Cleaning",
  shortName: "Rose",
  phone: "07775 170005",
  phoneHref: "tel:+447775170005",
  secondaryPhone: "07443 327500",
  secondaryPhoneHref: "tel:+447443327500",
  location: "London",
  timezone: "Europe/London",
  // Displayed contact identity only. Hosting and Auth origins use NEXT_PUBLIC_SITE_URL.
  website: "https://rosecleaning.uk",
  websiteLabel: "rosecleaning.uk",
  instagram: "@rose.professional.cleaning",
  instagramHref: "https://www.instagram.com/rose.professional.cleaning/",
  // Original JPEG artwork with an alpha cutout outside the circular badge.
  logo: "/brand/Logo-transparent.png",
  logoWidth: 1254,
  logoHeight: 1254,
  // Never represent a stock vehicle as Rose’s own van.
  removalsVan: null as string | null,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@rosecleaning.uk",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || null,
  hours: process.env.NEXT_PUBLIC_OPENING_HOURS || null,
};
