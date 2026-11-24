-- Salon Queue — Supabase schema (free tier)
-- Run this whole file once in Supabase → SQL Editor → New query → Run.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_gu text not null,
  minutes int not null check (minutes between 5 and 180),
  price int not null check (price between 0 and 10000),
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  speciality_en text not null default '',
  speciality_gu text not null default '',
  active boolean not null default true,
  on_break boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  token_no int not null,
  token_day date not null,
  customer_name text not null,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  source text not null default 'online' check (source in ('online','walk_in')),
  services jsonb not null default '[]'::jsonb,
  total_minutes int not null default 0,
  total_price int not null default 0,
  barber_preference uuid references public.barbers(id),
  assigned_barber uuid references public.barbers(id),
  status text not null default 'waiting' check (status in ('waiting','called','in_chair','done','cancelled','no_show')),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  unique (token_day, token_no)
);

create table if not exists public.settings (
  id int primary key check (id = 1),
  queue_open boolean not null default true,
  close_time text not null default '21:00',
  staff_pin text not null default '4821'
);

create table if not exists public.counters (
  day date primary key,
  next_no int not null default 0
);

-- One active spot per phone number (cancelled/no-show/done are free to rejoin).
create unique index if not exists tickets_one_active_phone
  on public.tickets (phone) where status in ('waiting','called','in_chair');

-- Forward-only status transitions, enforced in the database as well as the UI.
create or replace function public.enforce_status_transition()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if not (
      (old.status = 'waiting' and new.status in ('called','cancelled')) or
      (old.status = 'called'  and new.status in ('in_chair','cancelled','no_show')) or
      (old.status = 'in_chair' and new.status = 'done')
    ) then
      raise exception 'Invalid status transition: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tickets_status_guard on public.tickets;
create trigger tickets_status_guard
  before update on public.tickets
  for each row execute function public.enforce_status_transition();

-- Atomic daily token allocation + one-spot-per-phone, safe against double clicks.
create or replace function public.join_queue(
  p_name text,
  p_phone text,
  p_services uuid[],
  p_barber uuid default null,
  p_source text default 'online'
) returns public.tickets
language plpgsql security definer set search_path = public as $$
declare
  v_day date := (now() at time zone 'Asia/Kolkata')::date;
  v_no int;
  v_row public.tickets;
  v_snapshot jsonb;
  v_minutes int;
  v_price int;
begin
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'Invalid name'; end if;
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Invalid phone'; end if;
  if coalesce(array_length(p_services, 1), 0) not between 1 and 3 then
    raise exception 'Pick between 1 and 3 services';
  end if;

  select * into v_row from public.tickets
   where phone = p_phone and status in ('waiting','called','in_chair')
   order by joined_at desc limit 1;
  if found then return v_row; end if;

  insert into public.counters (day, next_no) values (v_day, 1)
    on conflict (day) do update set next_no = public.counters.next_no + 1
    returning next_no into v_no;

  select jsonb_agg(jsonb_build_object(
           'id', id, 'name_en', name_en, 'name_gu', name_gu,
           'minutes', minutes, 'price', price) order by sort_order),
         coalesce(sum(minutes), 0), coalesce(sum(price), 0)
    into v_snapshot, v_minutes, v_price
    from public.services
   where id = any(p_services) and active = true;
  if v_snapshot is null then raise exception 'No active services selected'; end if;

  insert into public.tickets
    (token_no, token_day, customer_name, phone, source, services,
     total_minutes, total_price, barber_preference, status, joined_at)
  values
    (v_no, v_day, trim(p_name), p_phone, p_source, v_snapshot,
     v_minutes, v_price, p_barber, 'waiting', now())
  returning * into v_row;
  return v_row;
end $$;

-- Earliest Waiting customer who chose this barber or "Any", with all rule checks.
create or replace function public.call_next(p_barber uuid)
returns public.tickets
language plpgsql security definer set search_path = public as $$
declare
  v_barber public.barbers;
  v_ticket public.tickets;
begin
  select * into v_barber from public.barbers where id = p_barber;
  if not found or not v_barber.active or v_barber.on_break then
    raise exception 'Barber is not available';
  end if;
  if exists (select 1 from public.tickets
              where assigned_barber = p_barber and status in ('called','in_chair')) then
    raise exception 'Barber is already serving someone';
  end if;
  select * into v_ticket from public.tickets
   where status = 'waiting'
     and (barber_preference is null or barber_preference = p_barber)
   order by joined_at asc, token_no asc limit 1;
  if not found then raise exception 'No eligible customer waiting'; end if;

  update public.tickets
     set status = 'called', assigned_barber = p_barber, called_at = now()
   where id = v_ticket.id
  returning * into v_ticket;
  return v_ticket;
end $$;

-- Lab-only open policies. Replace with real auth rules for a production deployment.
alter table public.services enable row level security;
alter table public.barbers  enable row level security;
alter table public.tickets  enable row level security;
alter table public.settings enable row level security;
alter table public.counters enable row level security;

drop policy if exists lab_all on public.services;
drop policy if exists lab_all on public.barbers;
drop policy if exists lab_all on public.tickets;
drop policy if exists lab_all on public.settings;
drop policy if exists lab_all on public.counters;

create policy lab_all on public.services for all to anon, authenticated using (true) with check (true);
create policy lab_all on public.barbers  for all to anon, authenticated using (true) with check (true);
create policy lab_all on public.tickets  for all to anon, authenticated using (true) with check (true);
create policy lab_all on public.settings for all to anon, authenticated using (true) with check (true);
create policy lab_all on public.counters for all to anon, authenticated using (true) with check (true);

grant all on all tables in schema public to anon, authenticated;
grant execute on function public.join_queue(text,text,uuid[],uuid,text) to anon, authenticated;
grant execute on function public.call_next(uuid) to anon, authenticated;

-- Realtime so phone / reception / barber / TV update without refresh.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public'
                   and tablename = 'tickets') then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public'
                   and tablename = 'barbers') then
    alter publication supabase_realtime add table public.barbers;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public'
                   and tablename = 'services') then
    alter publication supabase_realtime add table public.services;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public'
                   and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;

-- Seed data (re-running this file will not overwrite edits).
insert into public.services (id, name_en, name_gu, minutes, price, active, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Haircut',   'હેરકટ',    30, 150, true, 1),
  ('00000000-0000-0000-0000-000000000002', 'Beard trim','દાઢી ટ્રિમ',15,  80, true, 2),
  ('00000000-0000-0000-0000-000000000003', 'Hair spa',  'હેર સ્પા',  45, 400, true, 3),
  ('00000000-0000-0000-0000-000000000004', 'Colour',    'રંગ',      60, 900, true, 4),
  ('00000000-0000-0000-0000-000000000005', 'Shave',     'શેવિંગ',    20, 120, true, 5),
  ('00000000-0000-0000-0000-000000000006', 'Kids cut',  'બાળકોનો કટ',20, 120, true, 6)
on conflict (id) do nothing;

insert into public.barbers (id, name, speciality_en, speciality_gu, active, on_break, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Ravi',  'Classic cuts & fades', 'ક્લાસિક કટ અને ફેડ', true, false, 1),
  ('10000000-0000-0000-0000-000000000002', 'Amit',  'Beards & styling',    'દાઢી અને સ્ટાઇલિંગ', true, false, 2),
  ('10000000-0000-0000-0000-000000000003', 'Imran', 'Colour & hair spa',   'રંગ અને હેર સ્પા',   true, true,  3)
on conflict (id) do nothing;

insert into public.settings (id, queue_open, close_time, staff_pin) values (1, true, '21:00', '4821')
on conflict (id) do nothing;
