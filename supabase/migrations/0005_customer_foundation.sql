begin;

-- Preserve existing accounts and make the one-profile-per-user invariant explicit.
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,full_name)
    values(new.id,coalesce(new.email,''),left(coalesce(new.raw_user_meta_data->>'full_name',''),120))
    on conflict(id) do nothing;
  return new;
end $$;
insert into profiles(id,email,full_name)
select id,coalesce(email,''),left(coalesce(raw_user_meta_data->>'full_name',''),120) from auth.users
on conflict(id) do nothing;

-- All writes go through validated server operations; RLS still protects reads.
revoke update(full_name,phone) on profiles from authenticated;
revoke insert,update,delete on addresses from authenticated;
alter table addresses add column created_at timestamptz not null default now();
alter table addresses add column updated_at timestamptz not null default now();

-- Specialist services have no assumed duration or price until Rose reviews them.
alter table services alter column duration_minutes drop not null;

create function public.submit_cleaning_request(p_actor uuid,p_key uuid,p_draft jsonb)
returns public.bookings language plpgsql security definer set search_path=public as $$
declare b bookings; p profiles; s services; q jsonb; day date; cfg jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('rose-request:'||p_actor::text||':'||p_key::text,0));
  select * into b from bookings where customer_id=p_actor and idempotency_key=p_key;
  if found then
    if b.draft is distinct from p_draft then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return b;
  end if;
  select * into p from profiles where id=p_actor;
  if not found then raise exception 'UNAUTHENTICATED'; end if;
  select * into s from services where id=p_draft->>'serviceId' and active and kind='service';
  if not found then raise exception 'INVALID_REQUEST'; end if;
  day := (p_draft->>'date')::date;
  select config into cfg from operational_settings where id;
  if day is null or day < (now() at time zone 'Europe/London')::date
    or day > (now() at time zone 'Europe/London')::date + 365
    or coalesce(length(trim(p_draft->>'address')),0) not between 5 and 300
    or coalesce(length(trim(p_draft->>'propertyDetails')),0) not between 3 and 500
    or coalesce(length(p_draft->>'notes'),0)>1500
    or coalesce(p_draft->>'propertyType','') not in ('flat','house','other')
    or coalesce(p_draft->>'postcode','') !~ '^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$'
    or (coalesce(p_draft->>'windowId','') <> 'flexible' and not exists(
      select 1 from jsonb_array_elements(coalesce(cfg->'windows','[]')) w where w->>'id'=p_draft->>'windowId'
    )) then raise exception 'INVALID_REQUEST'; end if;
  q := jsonb_build_object('version','request-only','kind','unpriced','service',s.name,
    'property',p_draft->>'propertyDetails','durationMinutes',coalesce(s.duration_minutes,0),
    'teamSize',s.team_size,'lines','[]'::jsonb,'totalPence',null,'note','Price and scope to be confirmed by Rose.');
  insert into bookings(customer_id,customer_name,customer_email,customer_phone,idempotency_key,status,draft,quote)
    values(p.id,p.full_name,p.email,p.phone,p_key,'pending_confirmation',p_draft,q) returning * into b;
  perform record_booking_event(b.id,p_actor,'Request received — awaiting confirmation from Rose. Your date and time are preferences; price and scope will be agreed with you.');
  return b;
end $$;
revoke all on function public.submit_cleaning_request(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_cleaning_request(uuid,uuid,jsonb) to service_role;

alter table submissions add column subject text not null default 'General enquiry';
alter table notifications add column submission_id uuid references submissions(id);
alter table notifications add column reply_to text;
alter table notifications add column attempts integer not null default 0;
alter table notifications add column accepted_at timestamptz;
create unique index notifications_submission on notifications(submission_id) where submission_id is not null;

-- Saving the enquiry and creating its owner-forwarding job are one transaction.
create function public.submit_contact(p_key uuid,p_value jsonb,p_recipient text)
returns uuid language plpgsql security definer set search_path=public as $$
declare s submissions; contents text;
begin
  perform pg_advisory_xact_lock(hashtextextended('rose-contact:'||p_key::text,0));
  select * into s from submissions where idempotency_key=p_key;
  if found then
    if s.email is distinct from p_value->>'email' or s.message is distinct from p_value->>'message'
      or s.name is distinct from p_value->>'name' or s.subject is distinct from coalesce(p_value->>'subject','General enquiry')
      or s.kind is distinct from p_value->>'kind' or s.phone is distinct from p_value->>'phone'
      or s.company is distinct from p_value->>'company' or s.postcode is distinct from p_value->>'postcode'
      then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  else
    insert into submissions(idempotency_key,kind,name,email,phone,company,postcode,message,subject)
      values(p_key,p_value->>'kind',p_value->>'name',p_value->>'email',p_value->>'phone',p_value->>'company',p_value->>'postcode',p_value->>'message',coalesce(p_value->>'subject','General enquiry'))
      returning * into s;
  end if;
  contents := 'Contact enquiry '||s.id||E'\n\nName: '||s.name||E'\nEmail: '||s.email||E'\nPhone: '||s.phone
    ||E'\nSubject / service: '||s.subject||E'\nCompany: '||s.company||E'\nPostcode: '||s.postcode||E'\n\nMessage:\n'||s.message;
  insert into notifications(event_key,event_type,submission_id,recipient,reply_to,subject,body)
    values('contact-owner:'||s.id,'enquiry_received',s.id,p_recipient,s.email,'Rose contact: '||s.subject,contents)
    on conflict(event_key) do nothing;
  return s.id;
end $$;
-- Older server versions also forward to the owner; no browser has RPC access.
create or replace function public.submit_contact(p_key uuid,p_value jsonb)
returns uuid language sql security definer set search_path=public as $$
  select public.submit_contact(p_key,p_value,'rose.cleaning.uk@icloud.com');
$$;
revoke all on function public.submit_contact(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_contact(uuid,jsonb,text) to service_role;

create or replace function public.claim_notification(p_id uuid) returns setof public.notifications
language sql security definer set search_path=public as $$
  update notifications set status='sending',attempted_at=now(),attempts=attempts+1
    where id=p_id and status='queued' returning *;
$$;

-- Stale claims are uncertain, never blindly resent after the provider's deduplication window.
create function public.recover_notification_claims() returns void
language sql security definer set search_path=public as $$
  update notifications set status='uncertain',error='Processing interrupted. Check provider logs before retrying.'
    where status='sending' and attempted_at < now()-interval '5 minutes';
$$;
revoke all on function public.recover_notification_claims() from public,anon,authenticated;
grant execute on function public.recover_notification_claims() to service_role;

-- Existing status-transition and notification functions are extended below.

create or replace function public.record_booking_event(
  p_booking uuid, p_actor uuid, p_message text
) returns void language plpgsql security definer set search_path = public as $$
declare b bookings; title text; event text;
begin
  select * into b from bookings where id = p_booking;
  insert into booking_events(booking_id,actor_id,status,message)
    values(b.id,p_actor,b.status,p_message);
  title := case b.status
    when 'pending_confirmation' then 'Request received — awaiting confirmation from Rose'
    when 'pending' then 'Request received — awaiting confirmation from Rose'
    when 'confirmed' then 'Your clean is confirmed'
    when 'alternative_proposed' then 'Rose has proposed an alternative for your clean'
    when 'cancelled' then 'Your cleaning request has been cancelled'
    when 'rejected' then 'An update on your cleaning request'
    else 'Your cleaning visit is complete' end;
  event := case b.status
    when 'pending_confirmation' then 'request_received'
    when 'pending' then 'request_received'
    when 'confirmed' then 'booking_confirmed'
    when 'alternative_proposed' then 'alternative_proposed'
    when 'cancelled' then 'booking_cancelled'
    else 'booking_changed' end;
  insert into notifications(event_key,event_type,recipient,subject,body)
    values(b.id::text||':'||b.revision,event,b.customer_email,title,
      title||E'\n\n'||p_message||E'\n\nPlease sign in to your Rose account to view the details. Reference: '||left(b.id::text,8))
    on conflict(event_key) do nothing;
end $$;
create or replace function public.transition_booking(p_actor uuid,p_id uuid,p_revision int,p_action text,p_proposal jsonb default null) returns public.bookings language plpgsql security definer set search_path=public as $$
declare b bookings; staff boolean; target booking_status; msg text;
begin
  perform pg_advisory_xact_lock(hashtextextended('rose-operations',0));
  select * into b from bookings where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  staff := exists(select 1 from staff_members where user_id=p_actor);
  if not staff and b.customer_id<>p_actor then raise exception 'FORBIDDEN'; end if;
  -- A stale replay returns the current row; no duplicated event, reservation or email.
  if b.revision<>p_revision then return b; end if;
  if p_action='cancel' and b.status in ('pending','pending_confirmation','alternative_proposed','confirmed') then target:='cancelled'; msg:='The request was cancelled. Contact Rose if you need another arrangement.';
  elsif p_action='accept' and b.customer_id=p_actor and b.status='alternative_proposed' then
    perform reserve_visit(b.id,(b.proposal->>'date')::date,b.proposal->>'windowId',b.proposal->'quote');
    b.draft := b.draft || jsonb_build_object('date',b.proposal->>'date','windowId',b.proposal->>'windowId'); b.quote:=b.proposal->'quote'; b.proposal:=null;
    target:='confirmed'; msg:='The customer accepted the proposed time and quotation.';
  elsif staff and p_action='confirm' and b.status in ('pending','pending_confirmation') then
    perform reserve_visit(b.id,(b.draft->>'date')::date,b.draft->>'windowId',b.quote); target:='confirmed'; msg:='Rose confirmed the requested visit and quotation.';
  elsif staff and p_action='propose' and b.status in ('pending','pending_confirmation','alternative_proposed','confirmed') then
    if p_proposal is null or p_proposal->>'date' is null then raise exception 'INVALID_PROPOSAL'; end if;
    b.proposal:=p_proposal; target:='alternative_proposed'; msg:='Please review and accept the proposed date, arrival window and quotation. Any existing reservation is held until you accept or cancel.';
  elsif staff and p_action='reject' and b.status in ('pending','pending_confirmation','alternative_proposed') then target:='rejected'; msg:='Rose is unable to fulfil this request. Please contact us to discuss other options.';
  elsif staff and p_action='complete' and b.status='confirmed' then target:='completed'; msg:='Rose marked the visit as completed.';
  else raise exception 'INVALID_TRANSITION'; end if;
  update bookings set status=target,draft=b.draft,quote=b.quote,proposal=b.proposal,revision=revision+1,updated_at=now(),
    reserved_start=case when target in ('cancelled','rejected','completed') then null else reserved_start end,
    reserved_end=case when target in ('cancelled','rejected','completed') then null else reserved_end end,
    reserved_units=case when target in ('cancelled','rejected','completed') then null else reserved_units end where id=b.id returning * into b;
  perform record_booking_event(b.id,p_actor,msg); return b;
end $$;
insert into services(id,name,description,kind,duration_minutes,team_size,sort_order) values
('kitchen-cleaning','Kitchen Cleaning','A focused clean for your kitchen and its surfaces.','service',null,1,10),
('bathroom-cleaning','Bathroom Cleaning','Freshen up your bathroom, fittings and surfaces.','service',null,1,11),
('dusting-surfaces','Dusting & Surface Cleaning','Remove dust and refresh the surfaces around your home.','service',null,1,12),
('office-cleaning','Office Cleaning','Cleaning arranged around your workplace and its needs.','service',null,1,13),
('window-cleaning','Window Cleaning','A clearer view, with the scope and access agreed first.','service',null,1,14),
('after-builders','After-Builders Cleaning','Help clear the dust and mess after building work.','service',null,1,15),
('carpet-upholstery','Carpet & Upholstery Cleaning','Focused cleaning to refresh carpets and upholstered furniture.','service',null,1,16),
('front-garden','Front Garden Cleaning','Clear and tidy your front garden''s outdoor surfaces.','service',null,1,17),
('back-garden','Back Garden Cleaning','Refresh your back garden and patio with a focused clean.','service',null,1,18),
('wheelie-bin','Wheelie Bin Cleaning','A dedicated wash to freshen up your wheelie bins.','service',null,1,19),
('mobile-car-wash','Mobile Car Wash','Car washing at your location, with the details agreed by Rose.','service',null,1,20)
on conflict(id) do nothing;

commit;
