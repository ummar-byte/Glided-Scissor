-- Add Gujarati barber names and backfill the seeded barbers.
-- Apply once to the existing Supabase project; fresh installs get this from schema.sql.

alter table public.barbers
  add column if not exists name_gu text not null default '';

update public.barbers
  set name_gu = case id
    when '10000000-0000-0000-0000-000000000001' then 'રવિ'
    when '10000000-0000-0000-0000-000000000002' then 'અમિત'
    when '10000000-0000-0000-0000-000000000003' then 'ઇમરાન'
    else name_gu
  end
  where name_gu = '';

-- Confirm the result:
-- select name, name_gu from public.barbers order by sort_order;
