-- Denúncias feitas por alunos sobre itens + matrícula do aluno (exibida no painel do admin).
-- Aplicado no Supabase em 2026-10-17. Pode rodar de novo: nada é recriado.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(20) UNIQUE;

CREATE TABLE IF NOT EXISTS denuncias (
    id_denuncia   SERIAL PRIMARY KEY,
    id_item       INTEGER NOT NULL REFERENCES itens (id_item),
    id_usuario    INTEGER NOT NULL REFERENCES usuarios (id_usuario),
    motivo        TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'resolvida')),
    data_denuncia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
