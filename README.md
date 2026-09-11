# SmartTax — Control de Gastos Fiscal México

App móvil (Expo + React Native) para registro de gastos, timbrado CFDI 4.0,
sincronización bancaria (Belvo) y asesor fiscal con IA. Diseños originales en
Google Stitch, replicados con NativeWind. Stack 100% gratuito en sandbox.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Expo SDK 57 + React Native 0.86 + Expo Router (tabs) + NativeWind v4 |
| UI | Diseños Stitch, modo claro/oscuro, Inter, expo-linear-gradient, react-native-svg |
| Forms/Validación | React Hook Form + Zod (`packages/shared`) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS + Storage + Edge Functions) |
| Asesor IA | Edge Function `asesor-ia` + Gemini (`gemini-3.1-flash-lite`) |
| CFDI 4.0 | Edge Function `timbrado` + Factura.com Sandbox (pendiente de credenciales) |
| Open Banking | Belvo Sandbox: widget + webhook `belvo-webhook` (pendiente de credenciales) |
| Nativo extra | Face ID (`expo-local-authentication`), cámara/galería (`expo-image-picker`) |

## Estructura del monorepo (pnpm workspaces)

```
smart-tax/
├── apps/mobile/               # App Expo Router
│   ├── app/index.tsx          # → redirige a (auth)/login
│   ├── app/(auth)/           # login, register, recover + index→login
│   ├── app/(app)/            # dashboard, escanear, gasto-manual, mis-gastos,
│   │                         #   asesor, configuraciones, planes (+ index→dashboard)
│   ├── components/ui/        # button, card, input, label, select, switch, theme-toggle…
│   ├── hooks/                # useAuth (guardia de sesión), useGastos, useCFDI
│   ├── lib/                  # supabase.ts (cliente), belvo.ts (widget sandbox)
│   └── .env.local            # EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
├── packages/shared/          # Zod (RFC, CP, usoCFDI, GastoManual) + catálogos SAT + tipos
└── supabase/
    ├── migrations/           # 001 schema+RLS, 002 storage CFDI, 003 rol admin, 004 categoria
    ├── seed.sql              # 16 regímenes, 14 usos CFDI, 2 métodos, 31 formas, 2500 CPs
    └── functions/            # timbrado, belvo-webhook, catalogo-cp, asesor-ia (desplegada)
```

## Prerrequisitos

- Node.js 20+, pnpm 9+
- Supabase CLI (`brew install supabase` o `npm i -g supabase`)
- App **Expo Go** (última versión) en iPhone + misma WiFi que tu Mac
- Cuentas gratuitas: Supabase, Google AI Studio (Gemini), y opcionalmente
  Factura.com sandbox, Belvo sandbox y Stripe (test mode)

## Instalación

```bash
git clone <repo> && cd smart-tax
pnpm install
```

### 1. Supabase: base de datos y catálogos

```bash
export SUPABASE_ACCESS_TOKEN=<tu-token>
supabase link --project-ref <tu-project-ref>
supabase db push        # aplica migraciones (tablas + RLS + storage)
supabase db reset --linked --yes   # alternativa: reconstruye todo + seed
```

O pega en el SQL Editor del dashboard, en orden:
`supabase/migrations/001_init_schema.sql`,
`002_cfdi_storage.sql`, `003_admin_role.sql`, `004_gastos_categoria.sql` y `supabase/seed.sql`.

En Authentication → Providers → Email se recomienda activar
**Confirm email OFF** (`mailer_autoconfirm`) para pruebas sin fricción.

### 2. Variables de entorno (app móvil)

Edita `apps/mobile/.env.local` (Expo solo lee el de `apps/mobile/`, no el de la raíz):

```
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-publishable-key>
```

### 3. Asesor IA (Gemini)

```bash
supabase functions deploy asesor-ia
supabase secrets set GEMINI_API_KEY=<tu-key-de-aistudio.google.com>
```

Sin clave, el chat usa respuestas locales de respaldo (funciona offline).

### 4. Funciones pendientes de credenciales externas

```bash
supabase functions deploy timbrado belvo-webhook catalogo-cp
supabase secrets set FACTURACOM_USERNAME=... FACTURACOM_PASSWORD=... \
  BELVO_SECRET_ID=... BELVO_SECRET_PASSWORD=... BELVO_WEBHOOK_SECRET=...
```

## Cómo correr el proyecto

```bash
cd apps/mobile
pnpm expo start -c     # muestra un QR
```

1. Cierra Expo Go por completo en el iPhone.
2. Escanea el QR con la app **Cámara** → "Abrir en Expo Go".
3. Regístrate o entra con `admin@smarttax.mx` (usuario de prueba con datos).

Comandos útiles:

```bash
pnpm exec tsc --noEmit   # typecheck (desde apps/mobile)
pnpm expo start --web    # vista web (sin estilos NativeWind completos)
```

## Flujo principal

1. **Registro**: email + RFC + régimen → Auth + fila en `profiles`.
2. **Login**: email/pass, Face ID o sesión persistente (`useAuth` protege rutas).
3. **Dashboard**: totales, deducible, barras 12 meses, dona por categoría y
   recientes — todo calculado de `gastos` en tiempo real.
4. **Escanear**: foto/galería → extracción → gasto en `borrador`.
5. **Nuevo gasto**: formulario SAT completo → guarda y timbra (requiere `timbrado`).
6. **Asesor**: chat con Gemini contextualizado con tus gastos y perfil.
7. **Configuración**: perfil fiscal, tema, IA, Belvo, planes y cierre de sesión.

## Estado y pendientes

- ✅ Auth, dashboard dinámico, gastos, escanear, asesor IA, config, dark mode
- ⏳ Timbrado real (ocupa credenciales Factura.com sandbox)
- ⏳ Belvo real (ocupa credenciales sandbox + webhook configurado)
- ⏳ Cobro de planes (Stripe Payment Links test mode por cablear)
- ⏳ Icono/splash personalizados (`apps/mobile/assets/`)

## Licencia

MIT — Uso libre para prototipos y proyectos fiscales en México.
