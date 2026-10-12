-- Planes de suscripción, tarjetas de prueba y RLS de catálogos.

-- ponytail: el cliente escribe su propio plan bajo la RLS de profiles (prototipo);
-- mover a un RPC security definer que exija pago cuando haya cobro real.
alter table public.profiles
  add column if not exists plan text not null default 'gratis'
  check (plan in ('gratis', 'pro', 'negocios'));

-- Solo marca y últimos 4 dígitos: nunca se guarda el número completo.
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  last4 char(4) not null,
  holder text not null,
  exp_month int not null check (exp_month between 1 and 12),
  exp_year int not null,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "payment_methods are user-isolated" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_payment_methods_user on public.payment_methods (user_id);

alter table public.gastos
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete set null;

-- Catálogos SAT: lectura pública, escritura bloqueada.
do $$
declare t text;
begin
  foreach t in array array['regimenes_fiscales','cfdi_usos','codigos_postales','metodos_pago','formas_pago','tipos_relacion'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s is readable" on public.%I for select to anon, authenticated using (true)', t, t);
  end loop;
end $$;
