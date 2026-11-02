const pool = require('../config/database');

/**
 * Gera o relatório consolidado e métricas agregadas para o painel administrativo.
 * Consolida todas as agregações em uma única consulta SQL usando CTEs (`WITH`),
 * utilizando apenas 1 conexão do pool e 1 round-trip de rede até o PostgreSQL.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getMetricas(req, res) {
  try {
    const { rows: [relatorio] } = await pool.query(`
      WITH itens_por_status AS (
        SELECT status, COUNT(*)::int AS total
        FROM itens
        GROUP BY status
      ),
      itens_por_categoria AS (
        SELECT c.nome AS categoria, COUNT(i.id_item)::int AS total
        FROM categorias c
        LEFT JOIN itens i ON i.id_categoria = c.id_categoria
        GROUP BY c.id_categoria, c.nome
        ORDER BY total DESC, c.nome ASC
      ),
      top_locais AS (
        SELECT local_encontrado AS local, COUNT(*)::int AS total
        FROM itens
        WHERE local_encontrado IS NOT NULL AND local_encontrado != ''
        GROUP BY local_encontrado
        ORDER BY total DESC
        LIMIT 10
      ),
      denuncias_por_status AS (
        SELECT status, COUNT(*)::int AS total
        FROM denuncias
        GROUP BY status
      ),
      usuarios_por_tipo AS (
        SELECT tipo_usuario, COUNT(*)::int AS total
        FROM usuarios
        GROUP BY tipo_usuario
      ),
      recentes AS (
        SELECT
          COUNT(*) FILTER (WHERE data_horario >= CURRENT_DATE - INTERVAL '30 days')::int AS itens_recentes,
          COUNT(*) FILTER (
            WHERE status = 'devolvido' AND data_horario >= CURRENT_DATE - INTERVAL '30 days'
          )::int AS devolucoes_recentes
        FROM itens
      )
      SELECT
        COALESCE((SELECT json_agg(itens_por_status) FROM itens_por_status), '[]'::json) AS "itensPorStatus",
        COALESCE((SELECT json_agg(itens_por_categoria) FROM itens_por_categoria), '[]'::json) AS "itensPorCategoria",
        COALESCE((SELECT json_agg(top_locais) FROM top_locais), '[]'::json) AS "topLocais",
        COALESCE((SELECT json_agg(denuncias_por_status) FROM denuncias_por_status), '[]'::json) AS "denunciasPorStatus",
        COALESCE((SELECT json_agg(usuarios_por_tipo) FROM usuarios_por_tipo), '[]'::json) AS "usuariosPorTipo",
        (SELECT itens_recentes FROM recentes) AS "itensRecentes",
        (SELECT devolucoes_recentes FROM recentes) AS "devolucoesRecentes"
    `);

    res.json(relatorio);

  } catch (erro) {
    console.error('Erro ao gerar relatórios:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao gerar relatórios.' });
  }
}

module.exports = { getMetricas };
