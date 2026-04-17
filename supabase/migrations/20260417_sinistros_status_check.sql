-- Adiciona 'aguardando_informacoes' ao CHECK constraint da coluna status em sinistros
ALTER TABLE sinistros
DROP CONSTRAINT IF EXISTS sinistros_status_check;

ALTER TABLE sinistros
ADD CONSTRAINT sinistros_status_check
CHECK (status IN ('pendente', 'em_analise', 'aguardando_informacoes', 'concluido', 'suspeito'));
