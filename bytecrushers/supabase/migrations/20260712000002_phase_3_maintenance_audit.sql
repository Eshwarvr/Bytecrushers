-- Alter asset_status to include under_maintenance and lost
ALTER TYPE public.asset_status ADD VALUE IF NOT EXISTS 'under_maintenance';
ALTER TYPE public.asset_status ADD VALUE IF NOT EXISTS 'lost';

-- Maintenance Management Enums
create type public.maintenance_status as enum ('pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved');
create type public.maintenance_priority as enum ('low', 'medium', 'high', 'critical');

-- Maintenance Requests Table
create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade,
  raised_by uuid references public.employees(id) on delete cascade,
  issue_description text not null,
  priority public.maintenance_priority not null default 'medium',
  photo_url text,
  status public.maintenance_status not null default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  technician_id uuid references public.employees(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  notes text
);

-- Asset Audit Cycles Enums
create type public.audit_scope_type as enum ('department', 'location');
create type public.audit_status as enum ('open', 'closed');
create type public.audit_item_status as enum ('verified', 'missing', 'damaged');

-- Audit Cycles Table
create table public.audit_cycles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scope_type public.audit_scope_type not null,
  scope_value text not null,
  date_range_start timestamp with time zone not null,
  date_range_end timestamp with time zone not null,
  status public.audit_status not null default 'open',
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit Cycle Auditors Table
create table public.audit_cycle_auditors (
  cycle_id uuid references public.audit_cycles(id) on delete cascade,
  auditor_id uuid references public.employees(id) on delete cascade,
  primary key (cycle_id, auditor_id)
);

-- Audit Items Table
create table public.audit_items (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references public.audit_cycles(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  verification_status public.audit_item_status,
  notes text,
  verified_by uuid references public.employees(id) on delete set null,
  verified_at timestamp with time zone,
  unique (cycle_id, asset_id)
);

-- Triggers for State Cascades

-- 1. Maintenance Status Cascade
create or replace function public.cascade_maintenance_status()
returns trigger as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    update public.assets set status = 'under_maintenance' where id = new.asset_id;
  elsif new.status = 'resolved' and old.status != 'resolved' then
    update public.assets set status = 'available' where id = new.asset_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_maintenance_status_change
  after update on public.maintenance_requests
  for each row execute procedure public.cascade_maintenance_status();

-- 2. Audit Cycle Close Cascade
create or replace function public.cascade_audit_cycle_close()
returns trigger as $$
begin
  if new.status = 'closed' and old.status = 'open' then
    -- Mark all 'missing' items in this cycle as 'lost' in the assets table
    update public.assets
    set status = 'lost'
    where id in (
      select asset_id from public.audit_items
      where cycle_id = new.id and verification_status = 'missing'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_audit_cycle_close
  after update on public.audit_cycles
  for each row execute procedure public.cascade_audit_cycle_close();

-- RLS Enable
alter table public.maintenance_requests enable row level security;
alter table public.audit_cycles enable row level security;
alter table public.audit_cycle_auditors enable row level security;
alter table public.audit_items enable row level security;

-- Policies

-- Maintenance Requests
create policy "Employees can view own and manage own pending requests"
  on public.maintenance_requests for all to authenticated
  using (raised_by = (select id from public.employees where auth_user_id = auth.uid()));

create policy "Asset managers can view and update all requests"
  on public.maintenance_requests for all to authenticated
  using (public.get_current_user_role() = 'AssetManager');

-- Audits
create policy "Admins can manage audit cycles"
  on public.audit_cycles for all to authenticated
  using (public.get_current_user_role() = 'Admin');

create policy "Auditors can view assigned cycles"
  on public.audit_cycles for select to authenticated
  using (
    public.get_current_user_role() = 'Admin' 
    or id in (select cycle_id from public.audit_cycle_auditors where auditor_id = (select id from public.employees where auth_user_id = auth.uid()))
  );

create policy "Admins can manage auditors"
  on public.audit_cycle_auditors for all to authenticated
  using (public.get_current_user_role() = 'Admin');

create policy "Auditors can view own auditor assignment"
  on public.audit_cycle_auditors for select to authenticated
  using (
    public.get_current_user_role() = 'Admin' 
    or auditor_id = (select id from public.employees where auth_user_id = auth.uid())
  );

create policy "Admins can view and manage all audit items"
  on public.audit_items for all to authenticated
  using (public.get_current_user_role() = 'Admin');

create policy "Auditors can view and update items in their assigned cycles"
  on public.audit_items for all to authenticated
  using (
    cycle_id in (select cycle_id from public.audit_cycle_auditors where auditor_id = (select id from public.employees where auth_user_id = auth.uid()))
  );
