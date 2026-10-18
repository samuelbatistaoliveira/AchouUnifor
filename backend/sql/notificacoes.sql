-- Notificações que o admin envia aos alunos (tela "Nova notificação").
-- id_destinatario NULL = para todos os alunos. Pode rodar de novo: nada é recriado.

CREATE TABLE IF NOT EXISTS notificacoes (
    id_notificacao  SERIAL PRIMARY KEY,
    titulo          VARCHAR(100) NOT NULL,
    mensagem        TEXT NOT NULL,
    id_destinatario INTEGER REFERENCES usuarios (id_usuario),
    id_autor        INTEGER NOT NULL REFERENCES usuarios (id_usuario),
    data_criacao    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
