-- ============================================================================
-- ODONTOKRIS: Creación de la Tabla historial_medico en Supabase
-- Ejecute este script en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.historial_medico (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paciente_id BIGINT NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
    cita_id BIGINT REFERENCES public.cita(id) ON DELETE SET NULL,
    doctor_id BIGINT REFERENCES public.doctor(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo_consulta TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    alergias TEXT,
    antecedentes TEXT,
    medicamentos TEXT,
    observaciones TEXT
);

-- Índices para búsquedas optimizadas
CREATE INDEX IF NOT EXISTS idx_historial_paciente_id ON public.historial_medico(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON public.historial_medico(fecha DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.historial_medico ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para el cliente anónimo / autenticado
DROP POLICY IF EXISTS "Permitir select público en historial_medico" ON public.historial_medico;
CREATE POLICY "Permitir select público en historial_medico"
ON public.historial_medico FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir insert público en historial_medico" ON public.historial_medico;
CREATE POLICY "Permitir insert público en historial_medico"
ON public.historial_medico FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update público en historial_medico" ON public.historial_medico;
CREATE POLICY "Permitir update público en historial_medico"
ON public.historial_medico FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete público en historial_medico" ON public.historial_medico;
CREATE POLICY "Permitir delete público en historial_medico"
ON public.historial_medico FOR DELETE
USING (true);

-- Notificar recarga de caché de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
