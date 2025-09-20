
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  display_name text,
  anon boolean default true,
  created_at timestamp default now()
);

create table if not exists mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  device_id text,
  mood int check (mood between 1 and 5),
  created_at timestamp default now()
);

create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  device_id text,
  content text,
  created_at timestamp default now(),
  time_capsule_at timestamp,
  resurfaced boolean default false
);

create table if not exists prefs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  theme text default 'bluey',
  stigma_shield boolean default false
);

create table if not exists community_mood (
  week_id text primary key,
  by_day jsonb,
  updated_at timestamp default now()
);

-- demo seed
insert into community_mood (week_id, by_day) values
('currentWeek', '{"Mon":3.3,"Tue":3.8,"Wed":3.5,"Thu":3.9,"Fri":3.6,"Sat":3.4,"Sun":3.5}')
on conflict (week_id) do nothing;
