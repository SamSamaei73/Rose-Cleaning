-- Runs in the disposable test database after legacy assertions.
update operational_settings set config=jsonb_set(config,'{configured}','false');
select (submit_cleaning_request('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',test_draft()||'{"propertyDetails":"Two bedroom flat","windowId":"flexible"}')).id as request_id \gset
select submit_cleaning_request('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',test_draft()||'{"propertyDetails":"Two bedroom flat","windowId":"flexible"}');
select test_assert((select count(*) from bookings where idempotency_key='40000000-0000-4000-8000-000000000001')=1,'Request retries are idempotent');
select test_assert((select status='pending_confirmation' and quote->>'kind'='unpriced' and quote->>'totalPence' is null and cleaner_id is null and reserved_start is null from bookings where id=:'request_id'),'Requests have server-controlled status and no invented price or reservation');
select test_assert((select count(*) from booking_events where booking_id=:'request_id')=1,'A retry does not duplicate history');
select test_assert((select event_type from notifications where event_key=:'request_id'||':1')='request_received','New status uses request notification');
do $$ begin
  begin perform submit_cleaning_request('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',test_draft()||'{"propertyDetails":"Different details"}'); raise exception 'TEST FAILED: reused key changed request'; exception when others then if sqlerrm<>'IDEMPOTENCY_CONFLICT' then raise; end if; end;
  begin perform transition_booking('10000000-0000-4000-8000-000000000001',(select id from bookings where idempotency_key='40000000-0000-4000-8000-000000000001'),1,'confirm'); raise exception 'TEST FAILED: customer confirmed request'; exception when others then if sqlerrm<>'INVALID_TRANSITION' then raise; end if; end;
end $$;
select submit_contact('50000000-0000-4000-8000-000000000001','{"kind":"contact","name":"Alice Test","email":"alice@example.test","phone":"","company":"","postcode":"","subject":"Kitchen","message":"Test enquiry only"}', 'rose.cleaning.uk@icloud.com') as contact_id \gset
select submit_contact('50000000-0000-4000-8000-000000000001','{"kind":"contact","name":"Alice Test","email":"alice@example.test","phone":"","company":"","postcode":"","subject":"Kitchen","message":"Test enquiry only"}', 'rose.cleaning.uk@icloud.com');
select test_assert((select count(*) from submissions where id=:'contact_id')=1,'Contact submission saved once');
select test_assert((select count(*) from notifications where submission_id=:'contact_id')=1,'Contact queue saved atomically once');
select test_assert((select recipient='rose.cleaning.uk@icloud.com' and reply_to='alice@example.test' and status='queued' from notifications where submission_id=:'contact_id'),'Owner recipient and customer Reply-To are distinct');
select claim_notification((select id from notifications where submission_id=:'contact_id'));
select test_assert((select count(*) from claim_notification((select id from notifications where submission_id=:'contact_id')))=0,'Only one dispatcher can claim a contact email');
update notifications set attempted_at=now()-interval '6 minutes' where submission_id=:'contact_id';
select recover_notification_claims();
select test_assert((select status='uncertain' from notifications where submission_id=:'contact_id'),'Interrupted sending is traceable, not reported as delivery');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
select test_assert((select count(*) from bookings where id=:'request_id')=0,'A second customer cannot read the first request');
select test_assert((select count(*) from booking_events where booking_id=:'request_id')=0,'A second customer cannot read the first history');
select test_assert((select count(*) from submissions)=0,'Customers cannot read contact submissions');
select test_assert(not has_function_privilege('authenticated','public.submit_cleaning_request(uuid,uuid,jsonb)','EXECUTE'),'Forged request RPC has no customer grant');
select test_assert(not has_function_privilege('authenticated','public.submit_contact(uuid,jsonb,text)','EXECUTE'),'Public contact RPC cannot bypass validation');
select test_assert(not has_table_privilege('authenticated','public.addresses','INSERT'),'Address writes cannot bypass validation');
select test_assert(not has_column_privilege('authenticated','public.profiles','full_name','UPDATE'),'Profile writes cannot bypass validation');
reset role;
update operational_settings set config=jsonb_set(config,'{configured}','true');
