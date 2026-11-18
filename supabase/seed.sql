-- Safe connected-mode seed. No sample customers, rates, discounts or availability claims.
insert into public.services(id,name,description,detail,kind,duration_minutes,team_size,sort_order) values
('regular','Regular home cleaning','A little more time for the things you love.','Request ongoing help keeping your home feeling fresh. Rose will discuss your priorities and a suitable arrangement. Each visit is confirmed individually at this stage.','service',180,1,1),
('one-off','One-off cleaning','A fresh start, just when you need it.','A single clean before guests arrive or after a busy period. Tell Rose what matters most so the scope can be agreed.','service',180,1,2),
('deep','Deep cleaning','Give your space a little extra attention.','A more thorough clean for spaces that need extra care. Rose will review the condition, priorities and time required before confirming the scope.','service',240,1,3),
('end-of-tenancy','End of tenancy cleaning','Close one chapter. Start another, beautifully.','Cleaning for a property at the end of a tenancy or before a move. Share your requirements so Rose can agree the scope.','service',300,1,4)
on conflict(id) do nothing;
insert into public.operational_settings(id,config) values(true,'{"configured":false,"workingDays":[1,2,3,4,5,6],"windows":[{"id":"morning","label":"Morning","start":"09:00","end":"12:00"},{"id":"afternoon","label":"Afternoon","start":"13:00","end":"17:00"}],"leadHours":0,"capacity":1,"horizonDays":90,"blackoutDates":[]}') on conflict(id) do nothing;
-- Durations above are internal starting defaults, not public service promises. Availability remains unconfigured.
