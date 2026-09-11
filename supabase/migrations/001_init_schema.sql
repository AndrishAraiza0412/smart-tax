create table public.regimenes_fiscales (
  clave text primary key,
  descripcion text not null
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rfc text,
  regimen_fiscal text references public.regimenes_fiscales(clave),
  razon_social text,
  csd_certificado text,
  csd_llave text,
  csd_password text,
  created_at timestamptz not null default now()
);

create table public.cfdi_usos (
  clave text primary key,
  descripcion text not null
);

create table public.codigos_postales (
  cp char(5) primary key,
  estado text not null,
  municipio text not null,
  colonia text not null
);

create table public.metodos_pago (
  clave text primary key,
  descripcion text not null
);

create table public.formas_pago (
  clave text primary key,
  descripcion text not null
);

create table public.tipos_relacion (
  clave text primary key,
  descripcion text not null
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monto numeric(14,2) not null,
  fecha date not null,
  categoria_id uuid,
  descripcion text not null,
  rfc_receptor text,
  codigo_postal char(5) references public.codigos_postales(cp),
  uso_cfdi text references public.cfdi_usos(clave),
  metodo_pago text references public.metodos_pago(clave),
  forma_pago text references public.formas_pago(clave),
  cfdi_uuid uuid,
  cfdi_serie text,
  cfdi_folio text,
  cfdi_xml text,
  cfdi_pdf_url text,
  cfdi_estado text,
  timbrado_response jsonb,
  belvo_link_id text,
  belvo_transaction_id text,
  es_automatico boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.gastos enable row level security;

create policy "profiles are user-isolated" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "gastos are user-isolated" on public.gastos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index idx_gastos_user_fecha on public.gastos (user_id, fecha desc);
create index idx_gastos_user_cfdi on public.gastos (user_id, cfdi_estado);
create index idx_gastos_belvo on public.gastos (belvo_transaction_id);
