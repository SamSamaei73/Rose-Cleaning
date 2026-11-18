export const brand = {
  name: 'Rose Professional Cleaning', shortName: 'Rose',
  phone: '07775 170005', phoneHref: 'tel:+447775170005',
  location: 'London', timezone: 'Europe/London',
  website: 'https://www.roseprofessionalcleaning.co.uk',
  // Replace these paths once the owner supplies the assets. Never represent a stock van as Rose’s.
  logo: null as string | null,
  removalsVan: null as string | null,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || null,
  hours: process.env.NEXT_PUBLIC_OPENING_HOURS || null,
};
