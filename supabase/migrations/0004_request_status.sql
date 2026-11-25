-- Kept separate: PostgreSQL must commit a new enum value before it is used.
alter type public.booking_status add value if not exists 'pending_confirmation';
