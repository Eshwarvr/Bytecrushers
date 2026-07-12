-- Enum types
create type public.asset_status as enum ('available', 'allocated', 'retired');
create type public.transfer_status as enum ('pending', 'approved', 'rejected');

-- Assets table
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  tag text unique, -- Will be filled by trigger
  name text not null,
  type text not null,
  status public.asset_status not null default 'available',
  category_id uuid references public.asset_categories(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Asset Tag Generation
create sequence public.asset_tag_seq start 1;

create or replace function public.generate_asset_tag()
returns trigger as $$
begin
  new.tag := 'AF-' || lpad(nextval('public.asset_tag_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger tr_assets_tag
  before insert on public.assets
  for each row execute procedure public.generate_asset_tag();

-- Allocations table
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  allocated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  returned_at timestamp with time zone
);

-- Transfer Requests table
create table public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  from_employee_id uuid references public.employees(id) on delete cascade,
  to_employee_id uuid references public.employees(id) on delete cascade,
  status public.transfer_status not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.assets enable row level security;
alter table public.allocations enable row level security;
alter table public.transfer_requests enable row level security;
alter table public.bookings enable row level security;

-- Policies for ASSETS
create policy "Asset managers can manage assets"
  on public.assets for all to authenticated
  using (public.get_current_user_role() = 'AssetManager')
  with check (public.get_current_user_role() = 'AssetManager');

create policy "All authenticated users can select assets"
  on public.assets for select to authenticated
  using (true);

-- Policies for ALLOCATIONS
create policy "Asset managers can manage allocations"
  on public.allocations for all to authenticated
  using (public.get_current_user_role() = 'AssetManager')
  with check (public.get_current_user_role() = 'AssetManager');

create policy "Employees can view own allocations"
  on public.allocations for select to authenticated
  using (employee_id = (select id from public.employees where auth_user_id = auth.uid()));

-- Policies for TRANSFER_REQUESTS
create policy "Employees can create and view own transfer requests"
  on public.transfer_requests for all to authenticated
  using (from_employee_id = (select id from public.employees where auth_user_id = auth.uid()) or to_employee_id = (select id from public.employees where auth_user_id = auth.uid()))
  with check (from_employee_id = (select id from public.employees where auth_user_id = auth.uid()));

-- Policies for BOOKINGS
create policy "Employees can manage own bookings"
  on public.bookings for all to authenticated
  using (employee_id = (select id from public.employees where auth_user_id = auth.uid()))
  with check (employee_id = (select id from public.employees where auth_user_id = auth.uid()));

create policy "Asset managers can view all bookings"
  on public.bookings for select to authenticated
  using (public.get_current_user_role() = 'AssetManager');

-- ADDING INDEXES:

-- Assets
create index idx_assets_status on public.assets(status);
create index idx_assets_category_id on public.assets(category_id);
create index idx_assets_name on public.assets(name);

-- Allocations
create index idx_allocations_asset_id on public.allocations(asset_id);
create index idx_allocations_employee_id on public.allocations(employee_id);
create index idx_allocations_dates on public.allocations(allocated_at, returned_at);

-- Transfer Requests
create index idx_transfer_requests_asset_id on public.transfer_requests(asset_id);
create index idx_transfer_requests_from_employee_id on public.transfer_requests(from_employee_id);
create index idx_transfer_requests_to_employee_id on public.transfer_requests(to_employee_id);
create index idx_transfer_requests_status on public.transfer_requests(status);

-- Bookings
create index idx_bookings_asset_id on public.bookings(asset_id);
create index idx_bookings_employee_id on public.bookings(employee_id);
-- Composite index for booking overlap validation: asset_id + time range
create index idx_bookings_overlap on public.bookings(asset_id, start_time, end_time);
