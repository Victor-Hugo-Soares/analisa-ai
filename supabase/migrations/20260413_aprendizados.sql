CREATE TABLE IF NOT EXISTS aprendizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  sinistro_id TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  conteudo_editado TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  revisado_em TIMESTAMPTZ,
  revisado_por UUID
);

ALTER TABLE aprendizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role acesso total" ON aprendizados USING (true) WITH CHECK (true);
