begin;
create function public.sync_profile_email() returns trigger language plpgsql security definer set search_path=public as $$
begin update profiles set email=new.email where id=new.id;return new;end $$;
create trigger sync_profile_email after update of email on auth.users for each row when(old.email is distinct from new.email) execute function public.sync_profile_email();
create function public.assign_cleaner(p_actor uuid,p_booking uuid,p_cleaner uuid) returns void language plpgsql security definer set search_path=public as $$
declare b bookings;
begin
  perform require_staff(p_actor);perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  select * into b from bookings where id=p_booking for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if p_cleaner is not null and not exists(select 1 from cleaners where id=p_cleaner and active) then raise exception 'INVALID_CLEANER';end if;
  if p_cleaner is not null and exists(select 1 from bookings where id<>b.id and cleaner_id=p_cleaner and reserved_start<b.reserved_end and reserved_end>b.reserved_start) then raise exception 'CLEANER_CONFLICT';end if;
  if b.cleaner_id is not distinct from p_cleaner then return;end if;
  update bookings set cleaner_id=p_cleaner,updated_at=now() where id=b.id;
  -- Internal operational event; intentionally no customer notification or public status-history entry.
  insert into internal_notes(booking_id,actor_id,body) values(b.id,p_actor,case when p_cleaner is null then 'Cleaner assignment removed.' else 'Assigned internal cleaner: '||(select name from cleaners where id=p_cleaner) end);
end $$;
-- Apply to all reservations, including ones created after a pending request was assigned.
create function public.check_cleaner_reservation() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.cleaner_id is not null and new.reserved_start is not null then
    perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
    if exists(select 1 from bookings where id<>new.id and cleaner_id=new.cleaner_id and reserved_start<new.reserved_end and reserved_end>new.reserved_start) then raise exception 'CLEANER_CONFLICT';end if;
  end if;
  return new;
end $$;
create trigger check_cleaner_reservation before update of reserved_start,reserved_end,cleaner_id on public.bookings for each row execute function public.check_cleaner_reservation();
revoke execute on function public.sync_profile_email(),public.assign_cleaner(uuid,uuid,uuid),public.check_cleaner_reservation() from public,anon,authenticated;
grant execute on function public.assign_cleaner(uuid,uuid,uuid) to service_role;
commit;
