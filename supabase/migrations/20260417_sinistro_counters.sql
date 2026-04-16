-- Contador atômico por empresa para geração de IDs sequenciais sem race condition.
-- INSERT ... ON CONFLICT DO UPDATE é executado atomicamente pelo PostgreSQL,
-- garantindo que dois requests simultâneos nunca recebem o mesmo número.

CREATE TABLE IF NOT EXISTS sinistro_counters (
  empresa_id UUID PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
  contador   INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE sinistro_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role acesso total" ON sinistro_counters USING (true) WITH CHECK (true);

-- Função RPC chamada pelo backend para incrementar e retornar o próximo número.
-- O INSERT ... ON CONFLICT DO UPDATE é atômico: nunca dois chamadores
-- simultâneos recebem o mesmo valor.
CREATE OR REPLACE FUNCTION increment_sinistro_counter(p_empresa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contador INTEGER;
BEGIN
  INSERT INTO sinistro_counters (empresa_id, contador)
  VALUES (p_empresa_id, 1)
  ON CONFLICT (empresa_id) DO UPDATE
    SET contador = sinistro_counters.contador + 1
  RETURNING contador INTO v_contador;

  RETURN v_contador;
END;
$$;
