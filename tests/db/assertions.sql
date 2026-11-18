\set ON_ERROR_STOP on
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','alice@example.test','{"full_name":"Alice Fixture"}'),
('10000000-0000-4000-8000-000000000002','bob@example.test','{"full_name":"Bob Fixture"}'),
('10000000-0000-4000-8000-000000000003','staff@example.test','{"full_name":"Staff Fixture"}');
insert into staff_members(user_id) values('10000000-0000-4000-8000-000000000003');
update operational_settings set config=jsonb_set(jsonb_set(jsonb_set(config,'{configured}','true'),'{workingDays}','[0,1,2,3,4,5,6]'),'{capacity}','1');
insert into pricing_versions(version,config,approved) values('fixture-v1','{}',true);
create function public.test_assert(ok boolean,message text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'TEST FAILED: %',message;end if;end $$;
grant execute on function public.test_assert(boolean,text) to anon,authenticated,service_role;
create function public.test_draft() returns jsonb language sql as $$select jsonb_build_object('postcode','SW1A 1AA','serviceId','regular','propertyType','flat','bedrooms',1,'bathrooms',1,'address','1 Fixture Road','extras','[]'::jsonb,'date',(now() at time zone 'Europe/London')::date+3,'windowId','morning','notes','','pets','','access','')$$;
create function public.test_quote() returns jsonb language sql as $$select '{"version":"fixture-v1","kind":"approved","service":"Fixture clean","property":"Fixture home","durationMinutes":120,"teamSize":1,"lines":[{"label":"Fixture","quantity":1,"unitPence":5000,"totalPence":5000}],"totalPence":5000,"note":"Test only"}'::jsonb$$;
select (submit_booking('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',test_draft(),test_quote(),null)).id as alice_booking \gset
select (submit_booking('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',test_draft(),test_quote(),null)).id as bob_booking \gset
select test_assert((select count(*) from bookings where reserved_start is not null)=0,'Pending requests must not reserve capacity');
select submit_booking('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',test_draft(),test_quote(),null);
select test_assert((select count(*) from bookings)=2,'Repeated submission must not create a duplicate');
select test_assert((select count(*) from notifications)=2,'Repeated submission must not enqueue duplicate mail');
insert into addresses(customer_id,label,address,postcode) values('10000000-0000-4000-8000-000000000001','Home','Alice private address','SW1A 1AA'),('10000000-0000-4000-8000-000000000002','Home','Bob private address','SW1A 1AA');
insert into internal_notes(booking_id,actor_id,body) values(:'alice_booking','10000000-0000-4000-8000-000000000003','Staff-only fixture note');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
select test_assert((select count(*) from profiles)=1,'Customer profile isolation');
select test_assert((select count(*) from bookings)=1,'Customer booking isolation');
select test_assert((select count(*) from booking_events)=1,'Customer event isolation');
select test_assert((select count(*) from addresses)=1,'Customer address isolation');
select test_assert((select count(*) from internal_notes)=0,'Internal notes must remain private');
select test_assert((select count(*) from notifications)=0,'Notification outbox must remain private');
select test_assert((select count(*) from staff_members)=0,'Customer cannot read protected staff membership');
select test_assert((select count(*) from pricing_versions)=0,'Draft pricing table must remain private');
select test_assert(not has_table_privilege('authenticated','public.staff_members','INSERT'),'Customer cannot grant themselves staff access');
select test_assert(not has_table_privilege('authenticated','public.bookings','UPDATE'),'Customer cannot bypass booking operations');
select test_assert(not has_function_privilege('authenticated','public.transition_booking(uuid,uuid,integer,text,jsonb)','EXECUTE'),'RPC cannot be forged through Supabase REST');
select test_assert(not has_column_privilege('authenticated','public.profiles','email','UPDATE'),'Customer cannot overwrite trusted email');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
select test_assert((select count(*) from bookings)=2,'Staff can review all requests');
select test_assert((select count(*) from internal_notes)=1,'Staff can read internal notes');
reset role;
set role anon;
select test_assert((select count(*) from services)=4,'Public service catalogue is readable');
select test_assert(not has_table_privilege('anon','public.bookings','SELECT'),'Anonymous private data access blocked');
reset role;
do $$ begin
  begin perform transition_booking('10000000-0000-4000-8000-000000000001',(select id from bookings where customer_id='10000000-0000-4000-8000-000000000001'),1,'confirm');raise exception 'TEST FAILED: Customer confirmation accepted';exception when others then if sqlerrm<>'INVALID_TRANSITION' then raise;end if;end;
  begin perform transition_booking('10000000-0000-4000-8000-000000000002',(select id from bookings where customer_id='10000000-0000-4000-8000-000000000001'),1,'cancel');raise exception 'TEST FAILED: Foreign cancellation accepted';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
  begin perform submit_booking('10000000-0000-4000-8000-000000000001',gen_random_uuid(),test_draft(),test_quote()||'{"version":"tampered"}',null);raise exception 'TEST FAILED: stale pricing accepted';exception when others then if sqlerrm<>'QUOTE_CHANGED' then raise;end if;end;
end $$;
select transition_booking('10000000-0000-4000-8000-000000000003',:'alice_booking',1,'confirm');
select transition_booking('10000000-0000-4000-8000-000000000003',:'alice_booking',1,'confirm');
select test_assert((select count(*) from booking_events where booking_id=:'alice_booking')=2,'Repeated confirmation adds no duplicate event');
select test_assert((select count(*) from notifications)=3,'Repeated confirmation adds no duplicate email');
do $$ begin
  begin perform transition_booking('10000000-0000-4000-8000-000000000003',(select id from bookings where customer_id='10000000-0000-4000-8000-000000000002'),1,'confirm');raise exception 'TEST FAILED: conflicting confirmation accepted';exception when others then if sqlerrm<>'CAPACITY_CONFLICT' then raise;end if;end;
end $$;
select transition_booking('10000000-0000-4000-8000-000000000003',:'alice_booking',2,'propose',jsonb_build_object('date',(now() at time zone 'Europe/London')::date+4,'windowId','morning','quote',test_quote()||'{"totalPence":6000}','message','An explicitly reviewed alternative'));
select test_assert((select reserved_start is not null from bookings where id=:'alice_booking'),'Alternative proposal holds an existing confirmed reservation');
select test_assert((select (quote->>'totalPence')::int from bookings where id=:'alice_booking')=5000,'Proposal does not silently change agreed price');
select transition_booking('10000000-0000-4000-8000-000000000001',:'alice_booking',3,'accept');
select test_assert((select status='confirmed' and (quote->>'totalPence')::int=6000 from bookings where id=:'alice_booking'),'Customer acceptance applies proposed arrangement');
select transition_booking('10000000-0000-4000-8000-000000000001',:'alice_booking',4,'cancel');
select test_assert((select reserved_start is null from bookings where id=:'alice_booking'),'Cancellation frees capacity');
select test_assert((select count(*) from pg_tables where schemaname='public' and not rowsecurity)=0,'Every application table has RLS');
-- Two pending requests for the parallel conflict test.
select submit_booking('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003',test_draft()||jsonb_build_object('date',(now() at time zone 'Europe/London')::date+6),test_quote(),null);
select submit_booking('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004',test_draft()||jsonb_build_object('date',(now() at time zone 'Europe/London')::date+6),test_quote(),null);
select 'Database assertions passed' as result;
