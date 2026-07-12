-- Create departments table (without head_id first to avoid circular reference issues)
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  head_id uuid, -- foreign key constraint will be added later
  parent_department_id uuid references public.departments(id) on delete set null,
  employee_count integer not null default 0,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create employees table
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  department_id uuid references public.departments(id) on delete set null,
  role text not null default 'Employee' check (role in ('Employee', 'DepartmentHead', 'AssetManager', 'Admin')),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key constraint to departments.head_id referencing employees.id
alter table public.departments 
  add constraint fk_departments_head foreign key (head_id) references public.employees(id) on delete set null;

-- Create asset_categories table
create table public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  custom_fields jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helper functions for policies
create or replace function public.get_current_user_role()
returns text as $$
declare
  user_role text;
begin
  select role into user_role from public.employees where auth_user_id = auth.uid() limit 1;
  return coalesce(user_role, 'Employee');
end;
$$ language plpgsql security definer;

create or replace function public.get_current_user_dept()
returns uuid as $$
declare
  dept_id uuid;
begin
  select department_id into dept_id from public.employees where auth_user_id = auth.uid() limit 1;
  return dept_id;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create an employee record when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.employees (id, name, email, role, status, auth_user_id)
  values (
    gen_random_uuid(),
    coalesce(new.raw_user_meta_data->>'name', 'New Employee'),
    new.email,
    'Employee',
    'Active',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to automatically update employee counts in departments
create or replace function public.update_department_employee_count()
returns trigger as $$
begin
  -- Decrement old department count
  if (tg_op = 'UPDATE' or tg_op = 'DELETE') and old.department_id is not null then
    update public.departments
    set employee_count = greatest(0, employee_count - 1)
    where id = old.department_id;
  end if;

  -- Increment new department count
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') and new.department_id is not null then
    update public.departments
    set employee_count = employee_count + 1
    where id = new.department_id;
  end if;

  return null;
end;
$$ language plpgsql security definer;

create trigger tr_employees_dept_count
  after insert or update or delete on public.employees
  for each row execute procedure public.update_department_employee_count();

-- Enable Row-Level Security (RLS)
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.asset_categories enable row level security;

-- RLS Policies: DEPARTMENTS
create policy "Admins have full access on departments"
  on public.departments for all to authenticated
  using (public.get_current_user_role() = 'Admin')
  with check (public.get_current_user_role() = 'Admin');

create policy "Asset managers can select departments"
  on public.departments for select to authenticated
  using (public.get_current_user_role() = 'AssetManager');

create policy "Dept heads and employees can select own department"
  on public.departments for select to authenticated
  using (id = public.get_current_user_dept());

-- RLS Policies: EMPLOYEES
create policy "Admins have full access on employees"
  on public.employees for all to authenticated
  using (public.get_current_user_role() = 'Admin')
  with check (public.get_current_user_role() = 'Admin');

create policy "Asset managers can select all employees"
  on public.employees for select to authenticated
  using (public.get_current_user_role() = 'AssetManager');

create policy "Dept heads can select employees in department"
  on public.employees for select to authenticated
  using (department_id = public.get_current_user_dept());

create policy "Employees can select own profile"
  on public.employees for select to authenticated
  using (auth_user_id = auth.uid());

-- RLS Policies: ASSET_CATEGORIES
create policy "Admins have full access on asset_categories"
  on public.asset_categories for all to authenticated
  using (public.get_current_user_role() = 'Admin')
  with check (public.get_current_user_role() = 'Admin');

create policy "All authenticated users can select asset_categories"
  on public.asset_categories for select to authenticated
  using (true);
