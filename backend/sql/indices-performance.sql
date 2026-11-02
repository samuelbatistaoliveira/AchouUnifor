-- Índices de performance para o PostgreSQL (Supabase).
-- Chaves estrangeiras no PostgreSQL não criam índice automaticamente;
-- estes índices evitam Sequential Scans e ordenações em memória nas rotas mais acessadas.
-- Pode rodar mais de uma vez com segurança (IF NOT EXISTS).

-- 1. Login e recuperação de senha: busca por LOWER(email_institucional)
CREATE INDEX IF NOT EXISTS idx_usuarios_email_lower
    ON usuarios (LOWER(email_institucional));

-- 2. Listagem de categorias ativas ordenada por nome
CREATE INDEX IF NOT EXISTS idx_categorias_status_nome
    ON categorias (status, nome);

-- 3. Listagem de itens por status e ordenação por data_horario DESC (getItens e listarPerdidos)
CREATE INDEX IF NOT EXISTS idx_itens_status_data
    ON itens (status, data_horario DESC);

-- 4. Join e agrupamento de itens por categoria (listarCategorias e filtro de categoria)
CREATE INDEX IF NOT EXISTS idx_itens_categoria_data
    ON itens (id_categoria, data_horario DESC);

-- 5. Busca em lote da foto de capa: DISTINCT ON (id_item) ORDER BY id_item, id_imagem ASC
CREATE INDEX IF NOT EXISTS idx_imagens_itens_item_ordem
    ON imagens_itens (id_item, id_imagem ASC);

-- 6. Denúncias do aluno logado ordenadas por data_denuncia DESC (listarMinhasDenuncias)
CREATE INDEX IF NOT EXISTS idx_denuncias_usuario_data
    ON denuncias (id_usuario, data_denuncia DESC);

-- 7. Listagem geral de denúncias no painel administrativo
CREATE INDEX IF NOT EXISTS idx_denuncias_data
    ON denuncias (data_denuncia DESC);

-- 8. Fotos das denúncias ordenadas por id_imagem (comFotos)
CREATE INDEX IF NOT EXISTS idx_imagens_denuncias_denuncia_ordem
    ON imagens_denuncias (id_denuncia, id_imagem ASC);

-- 9. Notificações do aluno (id_destinatario IS NULL ou id_destinatario = $1) ordenadas por data
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario_data
    ON notificacoes (id_destinatario, data_criacao DESC, id_notificacao DESC);

