-- Add facturable column to gastos table
ALTER TABLE public.gastos
ADD COLUMN IF NOT EXISTS facturable boolean NOT NULL DEFAULT true;

-- Optional: index for filtering
CREATE INDEX IF NOT EXISTS idx_gastos_user_facturable ON public.gastos (user_id, facturable);
