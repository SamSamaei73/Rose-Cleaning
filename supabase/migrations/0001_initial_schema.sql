-- Rose: service-role-only mutations, RLS-protected reads, no marketplace or payments.
begin;
create extension if not exists pgcrypto;
create type public.booking_status as enum ('pending','alternative_proposed','confirmed','completed','cancelled','rejected');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name)<=120),
  email text not null, phone text not null default '' check (length(phone)<=30), created_at timestamptz not null default now()
);
create table public.staff_members (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from staff_members where user_id=auth.uid()) $$;
create table public.addresses (id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id) on delete cascade, label text not null, address text not null, postcode text not null);
create table public.services (
  id text primary key, name text not null, description text not null, detail text not null default '', kind text not null check(kind in ('service','extra')),
  active boolean not null default true, duration_minutes int not null check(duration_minutes between 15 and 720), team_size int not null check(team_size between 1 and 10), sort_order int not null default 0
);
create table public.pricing_versions (
  id uuid primary key default gen_random_uuid(), version text unique not null, config jsonb not null, approved boolean not null default false,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), approved_at timestamptz
);
create table public.operational_settings (id boolean primary key default true check(id), config jsonb not null, updated_at timestamptz not null default now());
create table public.policy_versions (id uuid primary key default gen_random_uuid(), title text not null, content text not null, approved boolean not null default false, created_at timestamptz not null default now());
create table public.cleaners (id uuid primary key default gen_random_uuid(), name text not null, active boolean not null default true);
create table public.bookings (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), customer_name text not null, customer_email text not null, customer_phone text not null,
  idempotency_key uuid not null, status public.booking_status not null default 'pending', draft jsonb not null, quote jsonb not null, proposal jsonb,
  revision int not null default 1, cleaner_id uuid references public.cleaners(id), policy_version uuid references public.policy_versions(id), acknowledged_at timestamptz not null default now(),
  reserved_start timestamptz, reserved_end timestamptz, reserved_units int,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(customer_id,idempotency_key),
  check ((reserved_start is null and reserved_end is null and reserved_units is null) or (reserved_start < reserved_end and reserved_units > 0))
);
create index bookings_customer on public.bookings(customer_id,created_at desc);
create index bookings_status on public.bookings(status);
create index bookings_reservations on public.bookings(reserved_start,reserved_end) where reserved_start is not null;
create table public.booking_events (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), actor_id uuid not null references public.profiles(id), status public.booking_status not null, message text not null, created_at timestamptz not null default now());
create table public.internal_notes (id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id), actor_id uuid not null references public.profiles(id), body text not null check(length(body) between 1 and 3000), created_at timestamptz not null default now());
create table public.submissions (id uuid primary key default gen_random_uuid(), idempotency_key uuid unique not null, kind text not null check(kind in ('contact','office')), name text not null, email text not null, phone text not null default '', company text not null default '', postcode text not null default '', message text not null, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), event_key text unique not null, recipient text not null, subject text not null, body text not null, status text not null default 'queued' check(status in ('preview','queued','sending','submitted','failed','uncertain')), provider_id text, error text, created_at timestamptz not null default now(), attempted_at timestamptz);
create table public.account_requests (id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), kind text not null default 'deletion' check(kind='deletion'), status text not null default 'requested' check(status in ('requested','in_review','completed')), created_at timestamptz not null default now());
create unique index one_open_deletion_request on public.account_requests(customer_id) where status <> 'completed';
create table public.rate_limits (key text primary key, count int not null default 1, expires_at timestamptz not null);

create function public.create_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,full_name) values(new.id,new.email,left(coalesce(new.raw_user_meta_data->>'full_name',''),120));
  return new;
end $$;
create trigger create_profile after insert on auth.users for each row execute function public.create_profile();

-- Every exposed table has RLS. Clients have no booking/status/role mutation grants.
alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.addresses enable row level security;
alter table public.services enable row level security;
alter table public.pricing_versions enable row level security;
alter table public.operational_settings enable row level security;
alter table public.policy_versions enable row level security;
alter table public.cleaners enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.internal_notes enable row level security;
alter table public.submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.account_requests enable row level security;
alter table public.rate_limits enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy staff_read on public.staff_members for select to authenticated using(user_id=auth.uid());
create policy addresses_owner on public.addresses for all to authenticated using(customer_id=auth.uid()) with check(customer_id=auth.uid());
create policy services_read on public.services for select to anon,authenticated using(active or public.is_staff());
create policy pricing_staff on public.pricing_versions for select to authenticated using(public.is_staff());
create policy settings_read on public.operational_settings for select to anon,authenticated using(true);
create policy policies_read on public.policy_versions for select to anon,authenticated using(approved or public.is_staff());
create policy bookings_read on public.bookings for select to authenticated using(customer_id=auth.uid() or public.is_staff());
create policy events_read on public.booking_events for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and (b.customer_id=auth.uid() or public.is_staff())));
create policy cleaners_staff on public.cleaners for select to authenticated using(public.is_staff());
create policy notes_staff on public.internal_notes for select to authenticated using(public.is_staff());
create policy submissions_staff on public.submissions for select to authenticated using(public.is_staff());
create policy notifications_staff on public.notifications for select to authenticated using(public.is_staff());
create policy account_requests_read on public.account_requests for select to authenticated using(customer_id=auth.uid() or public.is_staff());
revoke all on all tables in schema public from anon,authenticated;
grant usage on schema public to anon,authenticated,service_role;
grant select on public.services,public.operational_settings,public.policy_versions to anon,authenticated;
grant select on public.profiles,public.staff_members,public.addresses,public.pricing_versions,public.cleaners,public.bookings,public.booking_events,public.internal_notes,public.submissions,public.notifications,public.account_requests to authenticated;
grant update(full_name,phone) on public.profiles to authenticated;
grant insert,update,delete on public.addresses to authenticated;
grant all on all tables in schema public to service_role;

create function public.require_staff(p_actor uuid) returns void language plpgsql security definer set search_path=public as $$
begin if not exists(select 1 from staff_members where user_id=p_actor) then raise exception 'FORBIDDEN'; end if; end $$;

create function public.record_booking_event(p_booking uuid,p_actor uuid,p_message text) returns void language plpgsql security definer set search_path=public as $$
declare b bookings; title text;
begin
  select * into b from bookings where id=p_booking;
  insert into booking_events(booking_id,actor_id,status,message) values(b.id,p_actor,b.status,p_message);
  title := case b.status when 'pending' then 'Request received — awaiting confirmation from Rose' when 'confirmed' then 'Your clean is confirmed' when 'alternative_proposed' then 'Rose has proposed an alternative for your clean' when 'cancelled' then 'Your cleaning request has been cancelled' when 'rejected' then 'An update on your cleaning request' else 'Your cleaning visit is complete' end;
  insert into notifications(event_key,recipient,subject,body) values(b.id::text||':'||b.revision,b.customer_email,title,title||E'\n\n'||p_message||E'\n\nPlease sign in to your Rose account to view the details. Reference: '||left(b.id::text,8)) on conflict(event_key) do nothing;
end $$;

create function public.submit_booking(p_actor uuid,p_key uuid,p_draft jsonb,p_quote jsonb,p_policy uuid) returns public.bookings language plpgsql security definer set search_path=public as $$
declare b bookings; p profiles; current_version text;
begin
  -- Serialises identical submissions and catalogue changes, including racing retries.
  perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  select * into b from bookings where customer_id=p_actor and idempotency_key=p_key;
  if found then return b; end if;
  select * into p from profiles where id=p_actor;
  if not found then raise exception 'UNAUTHENTICATED'; end if;
  select version into current_version from pricing_versions where approved order by created_at desc,id desc limit 1;
  if coalesce(current_version,'unapproved') <> p_quote->>'version' then raise exception 'QUOTE_CHANGED'; end if;
  if p_policy is distinct from (select id from policy_versions where approved order by created_at desc limit 1) then raise exception 'POLICY_CHANGED'; end if;
  insert into bookings(customer_id,customer_name,customer_email,customer_phone,idempotency_key,draft,quote,policy_version)
    values(p.id,p.full_name,p.email,p.phone,p_key,p_draft,p_quote,p_policy) returning * into b;
  perform record_booking_event(b.id,p_actor,'Rose will review your request, price and preferred time. This is not yet a confirmed booking.');
  return b;
end $$;

create function public.reserve_visit(p_booking uuid,p_date date,p_window text,p_quote jsonb) returns void language plpgsql security definer set search_path=public as $$
declare cfg jsonb; win jsonb; a timestamptz; z timestamptz; units int; cap int; peak int;
begin
  -- One lock protects overlapping ranges, including adjacent days and changed windows.
  perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  select config into cfg from operational_settings where id;
  if not coalesce((cfg->>'configured')::boolean,false) then raise exception 'AVAILABILITY_UNCONFIGURED'; end if;
  if p_quote->>'kind' <> 'approved' or p_quote->>'totalPence' is null then raise exception 'PRICE_UNAPPROVED'; end if;
  if not (cfg->'workingDays' @> to_jsonb(extract(dow from p_date)::int)) or cfg->'blackoutDates' @> to_jsonb(p_date::text) then raise exception 'UNAVAILABLE'; end if;
  select value into win from jsonb_array_elements(cfg->'windows') where value->>'id'=p_window;
  if win is null then raise exception 'UNAVAILABLE'; end if;
  a := (p_date + (win->>'start')::time) at time zone 'Europe/London';
  z := ((p_date + (win->>'end')::time) at time zone 'Europe/London') + ((p_quote->>'durationMinutes')::int * interval '1 minute');
  if a < now() + ((cfg->>'leadHours')::int * interval '1 hour') or p_date > (now() at time zone 'Europe/London')::date + (cfg->>'horizonDays')::int then raise exception 'UNAVAILABLE'; end if;
  units := (p_quote->>'teamSize')::int; cap := (cfg->>'capacity')::int;
  if units < 1 or (p_quote->>'durationMinutes')::int not between 1 and 720 then raise exception 'INVALID_DURATION'; end if;
  select coalesce(max(load),0) into peak from (
    select sum(delta) over(order by point,delta rows unbounded preceding) as load from (
      select a as point,units as delta union all select z,-units
      union all select greatest(reserved_start,a),reserved_units from bookings where id<>p_booking and reserved_start<z and reserved_end>a
      union all select least(reserved_end,z),-reserved_units from bookings where id<>p_booking and reserved_start<z and reserved_end>a
    ) points
  ) loads;
  if peak>cap then raise exception 'CAPACITY_CONFLICT'; end if;
  update bookings set reserved_start=a,reserved_end=z,reserved_units=units where id=p_booking;
end $$;

create function public.transition_booking(p_actor uuid,p_id uuid,p_revision int,p_action text,p_proposal jsonb default null) returns public.bookings language plpgsql security definer set search_path=public as $$
declare b bookings; staff boolean; target booking_status; msg text;
begin
  perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  select * into b from bookings where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  staff := exists(select 1 from staff_members where user_id=p_actor);
  if not staff and b.customer_id<>p_actor then raise exception 'FORBIDDEN'; end if;
  -- A stale replay returns the current row; no duplicated event, reservation or email.
  if b.revision<>p_revision then return b; end if;
  if p_action='cancel' and b.status in ('pending','alternative_proposed','confirmed') then target:='cancelled'; msg:='The request was cancelled. Contact Rose if you need another arrangement.';
  elsif p_action='accept' and b.customer_id=p_actor and b.status='alternative_proposed' then
    perform reserve_visit(b.id,(b.proposal->>'date')::date,b.proposal->>'windowId',b.proposal->'quote');
    b.draft := b.draft || jsonb_build_object('date',b.proposal->>'date','windowId',b.proposal->>'windowId'); b.quote:=b.proposal->'quote'; b.proposal:=null;
    target:='confirmed'; msg:='The customer accepted the proposed time and quotation.';
  elsif staff and p_action='confirm' and b.status='pending' then
    perform reserve_visit(b.id,(b.draft->>'date')::date,b.draft->>'windowId',b.quote); target:='confirmed'; msg:='Rose confirmed the requested visit and quotation.';
  elsif staff and p_action='propose' and b.status in ('pending','alternative_proposed','confirmed') then
    if p_proposal is null or p_proposal->>'date' is null then raise exception 'INVALID_PROPOSAL'; end if;
    b.proposal:=p_proposal; target:='alternative_proposed'; msg:='Please review and accept the proposed date, arrival window and quotation. Any existing reservation is held until you accept or cancel.';
  elsif staff and p_action='reject' and b.status in ('pending','alternative_proposed') then target:='rejected'; msg:='Rose is unable to fulfil this request. Please contact us to discuss other options.';
  elsif staff and p_action='complete' and b.status='confirmed' then target:='completed'; msg:='Rose marked the visit as completed.';
  else raise exception 'INVALID_TRANSITION'; end if;
  update bookings set status=target,draft=b.draft,quote=b.quote,proposal=b.proposal,revision=revision+1,updated_at=now(),
    reserved_start=case when target in ('cancelled','rejected','completed') then null else reserved_start end,
    reserved_end=case when target in ('cancelled','rejected','completed') then null else reserved_end end,
    reserved_units=case when target in ('cancelled','rejected','completed') then null else reserved_units end where id=b.id returning * into b;
  perform record_booking_event(b.id,p_actor,msg); return b;
end $$;

create function public.save_staff_settings(p_actor uuid,p_kind text,p_value jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
  perform require_staff(p_actor); perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  if p_kind='availability' then
    -- Do not silently reinterpret existing confirmed reservations after operational changes.
    if exists(select 1 from bookings where reserved_end>now()) then raise exception 'ACTIVE_RESERVATIONS'; end if;
    update operational_settings set config=p_value,updated_at=now() where id;
  elsif p_kind='pricing' then
    insert into pricing_versions(version,config,approved,created_by,approved_at) values(p_value->>'version',p_value,(p_value->>'approved')::boolean,p_actor,case when (p_value->>'approved')::boolean then now() end);
  elsif p_kind='service' then
    insert into services(id,name,description,detail,kind,active,duration_minutes,team_size,sort_order) values(p_value->>'id',p_value->>'name',p_value->>'description',p_value->>'detail',p_value->>'kind',(p_value->>'active')::boolean,(p_value->>'duration_minutes')::int,(p_value->>'team_size')::int,(p_value->>'sort_order')::int)
    on conflict(id) do update set name=excluded.name,description=excluded.description,detail=excluded.detail,active=excluded.active,duration_minutes=excluded.duration_minutes,team_size=excluded.team_size,sort_order=excluded.sort_order;
  else raise exception 'INVALID_SETTINGS'; end if;
end $$;

create function public.consume_rate_limit(p_key text,p_limit int,p_seconds int) returns boolean language plpgsql security definer set search_path=public as $$
declare n int;
begin
  insert into rate_limits(key,count,expires_at) values(p_key,1,now()+p_seconds*interval '1 second') on conflict(key) do update set count=case when rate_limits.expires_at<now() then 1 else rate_limits.count+1 end, expires_at=case when rate_limits.expires_at<now() then now()+p_seconds*interval '1 second' else rate_limits.expires_at end returning count into n;
  delete from rate_limits where expires_at<now()-interval '1 day';
  return n<=p_limit;
end $$;
create function public.submit_contact(p_key uuid,p_value jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
  insert into submissions(idempotency_key,kind,name,email,phone,company,postcode,message) values(p_key,p_value->>'kind',p_value->>'name',p_value->>'email',p_value->>'phone',p_value->>'company',p_value->>'postcode',p_value->>'message') on conflict(idempotency_key) do nothing returning id into result;
  if result is null then select id into result from submissions where idempotency_key=p_key; end if;
  insert into notifications(event_key,recipient,subject,body) values('contact:'||result,p_value->>'email','Rose has received your enquiry','Thank you for contacting Rose Professional Cleaning. Your enquiry has been recorded for the team to review. You can call 07775 170005 to speak with Rose.') on conflict(event_key) do nothing;
  return result;
end $$;
create function public.claim_notification(p_id uuid) returns setof public.notifications language sql security definer set search_path=public as $$
  update notifications set status='sending',attempted_at=now() where id=p_id and status='queued' returning *;
$$;
-- Private functions: API routes validate authenticated users, then pass their verified ID.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_staff() to anon,authenticated;
grant execute on all functions in schema public to service_role;
commit;
