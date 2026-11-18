import type { Availability, Catalogue, Pricing, Service } from './types';

export const initialServices: Service[] = [
  { id: 'regular', name: 'Regular home cleaning', description: 'A little more time for the things you love.', detail: 'Request ongoing help keeping your home feeling fresh. Rose will discuss your priorities and a suitable arrangement. Each visit is confirmed individually at this stage.', kind: 'service', active: true, duration_minutes: 180, team_size: 1, sort_order: 1 },
  { id: 'one-off', name: 'One-off cleaning', description: 'A fresh start, just when you need it.', detail: 'A single clean for a home that needs some attention, before guests arrive or after a busy period. Tell Rose what matters most so the scope can be agreed.', kind: 'service', active: true, duration_minutes: 180, team_size: 1, sort_order: 2 },
  { id: 'deep', name: 'Deep cleaning', description: 'Give your space a little extra attention.', detail: 'A more thorough clean for spaces that need extra care. Rose will review the condition, priorities and time required before confirming what is included.', kind: 'service', active: true, duration_minutes: 240, team_size: 1, sort_order: 3 },
  { id: 'end-of-tenancy', name: 'End of tenancy cleaning', description: 'Close one chapter. Start another, beautifully.', detail: 'Cleaning for a property at the end of a tenancy or before a move. Share the property details and any requirements so Rose can agree the scope with you.', kind: 'service', active: true, duration_minutes: 300, team_size: 1, sort_order: 4 },
];
export const emptyPricing: Pricing = { version: 'unapproved', approved: false, demo: false, services: {}, extras: {}, adjustments: [], totalNote: 'Price to be confirmed by Rose.' };
export const preferredAvailability: Availability = { configured: false, workingDays: [1, 2, 3, 4, 5, 6], windows: [{ id: 'morning', label: 'Morning', start: '09:00', end: '12:00' }, { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '17:00' }], leadHours: 0, capacity: 1, horizonDays: 90, blackoutDates: [] };
// Deliberately fictional fixture. Never loaded in connected mode.
export const demoCatalogue: Catalogue = {
  services: [...initialServices,
    { id: 'oven', name: 'Inside oven', description: 'Demonstration extra; final scope to be agreed.', detail: '', kind: 'extra', active: true, duration_minutes: 30, team_size: 1, sort_order: 5 },
    { id: 'fridge', name: 'Inside fridge', description: 'Demonstration extra; final scope to be agreed.', detail: '', kind: 'extra', active: true, duration_minutes: 20, team_size: 1, sort_order: 6 },
    { id: 'windows', name: 'Interior windows', description: 'Demonstration extra; final scope to be agreed.', detail: '', kind: 'extra', active: true, duration_minutes: 30, team_size: 1, sort_order: 7 }],
  pricing: { version: 'demo-v1', approved: false, demo: true, services: {
    regular: { hourlyPence: 2600, baseMinutes: 90, bedroomMinutes: 30, bathroomMinutes: 30, minimumPence: 6500 },
    'one-off': { hourlyPence: 2800, baseMinutes: 90, bedroomMinutes: 30, bathroomMinutes: 30, minimumPence: 7000 },
    deep: { hourlyPence: 3200, baseMinutes: 150, bedroomMinutes: 45, bathroomMinutes: 45, minimumPence: 12000 },
    'end-of-tenancy': { hourlyPence: 3400, baseMinutes: 180, bedroomMinutes: 45, bathroomMinutes: 45, minimumPence: 15000 }
  }, extras: { oven: { pence: 2600, minutes: 30 }, fridge: { pence: 1800, minutes: 20 }, windows: { pence: 2400, minutes: 30 } }, adjustments: [], totalNote: 'Demo estimate — final pricing to be confirmed.' },
  availability: { ...preferredAvailability, configured: true, leadHours: 24, capacity: 3 }, policy: null,
};
