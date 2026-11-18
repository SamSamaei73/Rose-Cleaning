import type { BookingStatus, Role } from './types';
export const statusLabels: Record<BookingStatus,string> = { pending:'Pending confirmation', alternative_proposed:'Alternative proposed', confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', rejected:'Rejected' };
export function canTransition(from: BookingStatus, to: BookingStatus, role: Role): boolean {
  if (from === to) return false;
  if (role === 'customer') return (to === 'cancelled' && ['pending','alternative_proposed','confirmed'].includes(from)) || (from === 'alternative_proposed' && to === 'confirmed');
  return ({ pending: ['confirmed','alternative_proposed','rejected','cancelled'], alternative_proposed: ['alternative_proposed','rejected','cancelled'], confirmed: ['completed','cancelled','alternative_proposed'], completed: [], cancelled: [], rejected: [] } as Record<string,string[]>)[from].includes(to);
}
