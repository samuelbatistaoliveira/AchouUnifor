-- A denúncia passa a ser o relato de uma perda feito pelo aluno (nome, descrição, categoria,
-- local, data e fotos), visto só pelo admin e pelo próprio aluno. Não aponta mais para um item.
-- Só acrescenta: id_item e motivo (formato antigo) ficam opcionais e podem ser removidos depois.
-- Pode rodar de novo: nada é recriado.

ALTER TABLE denuncias
    ALTER COLUMN id_item DROP NOT NULL,
    ALTER COLUMN motivo DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS nome_objeto  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS descricao    TEXT,
    ADD COLUMN IF NOT EXISTS local_perda  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data_perda   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS id_categoria INTEGER REFERENCES categorias (id_categoria);

CREATE TABLE IF NOT EXISTS imagens_denuncias (
    id_imagem   SERIAL PRIMARY KEY,
    id_denuncia INTEGER NOT NULL REFERENCES denuncias (id_denuncia) ON DELETE CASCADE,
    caminho     VARCHAR(255) NOT NULL
);

-- Status da perda, visto pelo aluno em "Minhas denúncias": perdido (padrão) -> encontrado -> devolvido.
-- 'pendente' e 'resolvida' (formato antigo) seguem aceitos só até a develop deixar de usá-los.
ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncias_status_check;
ALTER TABLE denuncias ADD CONSTRAINT denuncias_status_check
    CHECK (status IN ('perdido', 'encontrado', 'devolvido', 'pendente', 'resolvida'));
ALTER TABLE denuncias ALTER COLUMN status SET DEFAULT 'perdido';
