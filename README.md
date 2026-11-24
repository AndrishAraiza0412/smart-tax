# SmartTax — Control de Gastos Fiscal México

App móvil y web (Expo + React Native) para registrar gastos, escanear tickets con IA,
saber qué es facturable y consultar a un asesor fiscal con IA. Es un **prototipo**: no
usa APIs de pago; los cobros y las tarjetas son simulados.

## Qué hace hoy

- **Cuenta**: registro con RFC y régimen fiscal, login con email, Face ID, Apple y Google, sesión persistente.
- **Dashboard**: totales, monto deducible, barras de 12 meses, dona por categoría y gastos recientes, calculados en vivo desde `gastos`.
- **Escáner con IA**: foto, galería o archivo → Gemini Vision extrae descripción, monto, fecha y categoría, lee los artículos y los clasifica, y marca si el gasto es facturable con su razón. Se puede cancelar el análisis, cambiar la foto y capturar a mano si la IA falla (con reintentos y errores claros).
- **Gasto manual**: formulario con validación (Zod); la IA sugiere si es facturable.
- **Mis gastos**: lista, edición y borrado.
- **Asesor fiscal con IA**: chat con memoria conversacional y contexto real del usuario (RFC, régimen, últimos gastos), en español. Sin clave de Gemini usa respuestas locales predefinidas.
- **Planes y tarjetas (simulados)**: `gratis`, `pro` y `negocios`. El plan gratis limita gastos al mes; pro y negocios desbloquean escáner IA, asesor, importación CFDI y tarjetas. De las tarjetas de prueba solo se guarda marca y últimos 4 dígitos.
- **Configuración**: perfil fiscal, tema claro/oscuro, idioma, conexión bancaria (Belvo sandbox), planes y cierre de sesión.

## Stack

| Capa | Tecnología |
|------|------------|
| App | Expo SDK 58 + React Native 0.88 + React 19 + Expo Router |
| UI | NativeWind v4, modo claro/oscuro, `expo-linear-gradient`, `react-native-svg` |
| Validación | React Hook Form + Zod (`packages/shared`) |
| Backend | Supabase: PostgreSQL + Auth + RLS + Storage + Edge Functions (Deno) |
| IA | Edge Function `asesor-ia` + Gemini (`gemini-3.8-flash` por defecto, respaldo `gemini-3.5-flash-lite`; configurables con `GEMINI_MODEL` y `GEMINI_FALLBACK_MODEL`) |
| Open Banking | Belvo sandbox: widget + webhook `belvo-webhook` (requiere credenciales) |
| Nativo | `expo-local-authentication` (Face ID), `expo-image-picker`, Apple/Google Sign-In |
| Calidad | ESLint 9, TypeScript, Playwright (E2E), GitHub Actions |

## Estructura (pnpm workspaces)

```
smart-tax/
├── apps/mobile/                  # App Expo Router
│   ├── app/(auth)/               # login, registro, recuperar contraseña
│   ├── app/(app)/                # dashboard, escanear, gasto-manual, mis-gastos,
│   │                             #   asesor, configuraciones, planes
│   ├── components/               # ui/ (button, card, input, skeletons…), expense-row, card-form…
│   ├── hooks/                    # useAuth, useGastos, useCards, usePlan, useFiscalProfile
│   ├── lib/                      # supabase, plan, cards, fiscal, belvo, i18n, social-auth…
│   └── e2e/                      # prueba de humo con Playwright
├── packages/shared/              # Zod (RFC, CP, GastoManual), catálogos SAT y tipos
├── packages/logistics-contracts/ # contratos y validaciones compartidas
└── supabase/
    ├── migrations/               # 001 schema+RLS, 002 storage CFDI, 003 rol admin,
    │                             #   004 categoría, 005 facturable, 006 planes y tarjetas
    ├── seed.sql                  # catálogos SAT
    └── functions/                # asesor-ia, belvo-webhook
```

La especificación original está en `docs/Especificacion-SmartTax.docx`.

## Prerrequisitos

- Node.js 20+ y pnpm 9+
- Supabase CLI
- Expo Go (última versión) en el celular, o un navegador para la versión web
- Cuentas gratuitas: Supabase y Google AI Studio (Gemini). Opcional: Belvo sandbox

## Instalación

```bash
git clone https://github.com/AndrishAraiza0412/smart-tax.git
cd smart-tax
pnpm install
```

### 1. Supabase

```bash
supabase link --project-ref <tu-project-ref>
supabase db push          # migraciones 001–006
```

Después carga `supabase/seed.sql` (SQL Editor del dashboard). Para pruebas sin fricción,
desactiva **Confirm email** en Authentication → Providers → Email.

### 2. Variables de la app

Copia `.env.example` a `apps/mobile/.env.local` (Expo solo lee ese archivo):

```
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-publishable-key>
```

### 3. Asesor y escáner con IA

```bash
supabase functions deploy asesor-ia
supabase secrets set GEMINI_API_KEY=<tu-key-de-aistudio.google.com>
```

La función expone las acciones `chat`, `detect_facturable` y `analyze_ticket`. Sin
`GEMINI_API_KEY` el chat responde con textos locales y el escáner devuelve un error
con opción de captura manual.

### 4. Conexión bancaria (opcional)

```bash
supabase functions deploy belvo-webhook
supabase secrets set BELVO_SECRET_ID=... BELVO_SECRET_PASSWORD=... BELVO_WEBHOOK_SECRET=...
```

## Correr el proyecto

```bash
cd apps/mobile
pnpm expo start -c        # QR para Expo Go
pnpm expo start --web     # versión web
```

Otros comandos:

```bash
pnpm typecheck                         # desde la raíz
pnpm lint                              # ESLint
cd apps/mobile && pnpm exec playwright test   # E2E
```

## CI

GitHub Actions (`.github/workflows/ci.yml`): valida Conventional Commits, typecheck, lint,
build de `shared`, typecheck y export web de la app, y E2E con Playwright.

## Estado y pendientes

- ✅ Auth (email, Face ID, Apple, Google), dashboard dinámico, gastos (crear, editar, borrar), modo oscuro
- ✅ Escáner con Gemini Vision: artículos por categoría, facturable con razón, cancelar, cambiar foto, captura manual
- ✅ Asesor fiscal con IA: memoria y contexto real
- ✅ Planes y tarjetas de prueba (simulados)
- ⏳ Belvo real (necesita credenciales sandbox y webhook configurado)
- ⏳ Timbrado CFDI: removido del alcance del prototipo (requeriría un PAC de pago)
- ⏳ Cobro real de planes (hoy es simulado)
- ⏳ Icono y splash personalizados

## Licencia

MIT — uso libre para prototipos y proyectos fiscales en México.
