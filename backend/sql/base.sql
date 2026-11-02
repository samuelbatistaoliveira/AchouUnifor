-- Tabelas principais (usuários, categorias, itens e fotos dos itens), iguais às do Supabase.
-- Para montar um banco do zero, rode nesta ordem:
--   base.sql -> denuncias.sql -> denuncias-perda.sql -> notificacoes.sql
-- Pode rodar de novo: nada é recriado.

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          SERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL,
    email_institucional VARCHAR(150) NOT NULL UNIQUE,
    senha_hash          VARCHAR(255) NOT NULL,
    tipo_usuario        VARCHAR(20)  NOT NULL
                        CONSTRAINT chk_tipo_usuario CHECK (tipo_usuario IN ('aluno', 'administrador')),
    telefone            VARCHAR(20),
    curso               VARCHAR(100),
    status              VARCHAR(10)  NOT NULL DEFAULT 'ativo'
                        CONSTRAINT chk_status_usuario CHECK (status IN ('ativo', 'inativo')),
    data_cadastro       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria  SERIAL PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL UNIQUE,
    status        VARCHAR(10)  NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    data_cadastro TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- status: achado | perdido | devolvido (validado no itensController; o banco não tem CHECK)
CREATE TABLE IF NOT EXISTS itens (
    id_item          SERIAL PRIMARY KEY,
    nome_objeto      VARCHAR(255) NOT NULL,
    descricao        TEXT,
    data_horario     TIMESTAMP    NOT NULL,
    local_encontrado VARCHAR(255) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'achado',
    id_categoria     INTEGER REFERENCES categorias (id_categoria),
    id_usuario       INTEGER REFERENCES usuarios (id_usuario) -- admin que registrou
);

-- caminho = arquivo no bucket "itens" do Supabase Storage (ex.: "12/uuid.jpg")
CREATE TABLE IF NOT EXISTS imagens_itens (
    id_imagem SERIAL PRIMARY KEY,
    id_item   INTEGER NOT NULL REFERENCES itens (id_item),
    caminho   VARCHAR(255) NOT NULL
);
