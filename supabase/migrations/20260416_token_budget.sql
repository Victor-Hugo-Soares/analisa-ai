CREATE TABLE IF NOT EXISTS token_budget (
  data DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  tokens_usados INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE token_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role acesso total" ON token_budget USING (true) WITH CHECK (true);
