-- Explicit event metadata lets adapters distinguish acknowledgements from
-- confirmations without interpreting presentation text.
alter table public.notifications
  add column event_type text not null default 'booking_changed'
  check (event_type in (
    'request_received', 'booking_confirmed', 'alternative_proposed',
    'booking_changed', 'booking_cancelled', 'enquiry_received'
  ));

-- Preserve any existing previews and delivery state. Unknown historical
-- subjects retain the generic booking_changed classification.
update public.notifications set event_type = case
  when event_key like 'contact:%' then 'enquiry_received'
  when subject = 'Request received — awaiting confirmation from Rose' then 'request_received'
  when subject = 'Your clean is confirmed' then 'booking_confirmed'
  when subject = 'Rose has proposed an alternative for your clean' then 'alternative_proposed'
  when subject = 'Your cleaning request has been cancelled' then 'booking_cancelled'
  else 'booking_changed' end;

create or replace function public.record_booking_event(
  p_booking uuid, p_actor uuid, p_message text
) returns void language plpgsql security definer set search_path = public as $$
declare b bookings; title text; event text;
begin
  select * into b from bookings where id = p_booking;
  insert into booking_events(booking_id,actor_id,status,message)
    values(b.id,p_actor,b.status,p_message);
  title := case b.status
    when 'pending' then 'Request received — awaiting confirmation from Rose'
    when 'confirmed' then 'Your clean is confirmed'
    when 'alternative_proposed' then 'Rose has proposed an alternative for your clean'
    when 'cancelled' then 'Your cleaning request has been cancelled'
    when 'rejected' then 'An update on your cleaning request'
    else 'Your cleaning visit is complete' end;
  event := case b.status
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

create or replace function public.submit_contact(p_key uuid,p_value jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid;
begin
  insert into submissions(idempotency_key,kind,name,email,phone,company,postcode,message)
    values(p_key,p_value->>'kind',p_value->>'name',p_value->>'email',p_value->>'phone',p_value->>'company',p_value->>'postcode',p_value->>'message')
    on conflict(idempotency_key) do nothing returning id into result;
  if result is null then select id into result from submissions where idempotency_key=p_key; end if;
  insert into notifications(event_key,event_type,recipient,subject,body)
    values('contact:'||result,'enquiry_received',p_value->>'email','Rose has received your enquiry',
      'Thank you for contacting Rose Professional Cleaning. Your enquiry has been recorded for the team to review. You can call 07775 170005 to speak with Rose.')
    on conflict(event_key) do nothing;
  return result;
end $$;
