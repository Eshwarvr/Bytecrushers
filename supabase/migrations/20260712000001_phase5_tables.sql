-- Create Assets table
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_tag text not null unique,
  category_id uuid references public.asset_categories(id) on delete set null,
  serial_number text,
  acquisition_date date,
  acquisition_cost numeric,
  condition text,
  location text,
  photo_url text,
  is_shared_bookable boolean default false,
  status text not null default 'Available' check (status in ('Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed')),
  department_id uuid references public.departments(id) on delete set null,
  custom_attributes jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Allocations table
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  held_by_type text not null check (held_by_type in ('employee', 'department')),
  held_by_id uuid not null, -- could be employee id or department id
  allocated_date timestamp with time zone default timezone('utc'::text, now()) not null,
  expected_return_date timestamp with time zone,
  returned_date timestamp with time zone,
  status text not null default 'Active' check (status in ('Active', 'Returned', 'TransferRequested')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Transfers table
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  from_employee_id uuid references public.employees(id),
  to_employee_id uuid references public.employees(id),
  status text not null default 'Requested' check (status in ('Requested', 'Approved', 'Rejected')),
  requested_by uuid references public.employees(id),
  approved_by uuid references public.employees(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Bookings table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  resource_asset_id uuid references public.assets(id) on delete cascade,
  booked_by uuid references public.employees(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'Upcoming' check (status in ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Maintenance Requests table
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  raised_by uuid references public.employees(id),
  issue_description text not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  photo_url text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'TechnicianAssigned', 'InProgress', 'Resolved')),
  approved_by uuid references public.employees(id),
  technician_id uuid references public.employees(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Audit Cycles table
create table if not exists public.audit_cycles (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('department', 'location')),
  scope_value text not null,
  date_range_start date not null,
  date_range_end date not null,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  created_by uuid references public.employees(id),
  auditor_ids uuid[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Audit Items table
create table if not exists public.audit_items (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references public.audit_cycles(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  verification_status text not null default 'Verified' check (verification_status in ('Verified', 'Missing', 'Damaged')),
  notes text,
  verified_by uuid references public.employees(id),
  verified_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Activity Logs table
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  actor_id uuid references public.employees(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  entity_name text not null,
  details text,
  category text not null default 'All' check (category in ('Alerts', 'Approvals', 'Bookings', 'All')),
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  entity_type text not null,
  entity_id uuid not null,
  is_read boolean default false,
  user_id uuid references public.employees(id), -- the person receiving it
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
