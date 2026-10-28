const pool = require('../config/database');

// Relatório consolidado e métricas do AchouUNIFOR para o painel administrativo
async function getMetricas(req, res) {
  try {
    // 1. Contagem de itens por status
    const { rows: itensPorStatus } = await pool.query(`
      SELECT status, COUNT(*)::int as total
      FROM itens
      GROUP BY status
    `);

    // 2. Contagem de itens por categoria
    const { rows: itensPorCategoria } = await pool.query(`
      SELECT c.nome as categoria, COUNT(i.id_item)::int as total
      FROM categorias c
      LEFT JOIN itens i ON i.id_categoria = c.id_categoria
      GROUP BY c.id_categoria, c.nome
      ORDER BY total DESC, c.nome ASC
    `);

    // 3. Top locais com mais ocorrências
    const { rows: topLocais } = await pool.query(`
      SELECT local_encontrado as local, COUNT(*)::int as total
      FROM itens
      WHERE local_encontrado IS NOT NULL AND local_encontrado != ''
      GROUP BY local_encontrado
      ORDER BY total DESC
      LIMIT 10
    `);

    // 4. Denúncias por status
    const { rows: denunciasPorStatus } = await pool.query(`
      SELECT status, COUNT(*)::int as total
      FROM denuncias
      GROUP BY status
    `);

    // 5. Total de usuários por tipo
    const { rows: usuariosPorTipo } = await pool.query(`
      SELECT tipo_usuario, COUNT(*)::int as total
      FROM usuarios
      GROUP BY tipo_usuario
    `);

    // 6. Itens registrados nos últimos 30 dias
    const { rows: itensRecentes } = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM itens
      WHERE data_horario >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // 7. Devoluções nos últimos 30 dias
    const { rows: devolucoesRecentes } = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM itens
      WHERE status = 'devolvido'
    `);

    res.json({
      itensPorStatus,
      itensPorCategoria,
      topLocais,
      denunciasPorStatus,
      usuariosPorTipo,
      itensRecentes: itensRecentes[0]?.total ?? 0,
      devolucoesRecentes: devolucoesRecentes[0]?.total ?? 0,
    });

  } catch (erro) {
    console.error('Erro ao gerar relatórios:', erro);
    res.status(500).json({ mensagem: 'Erro interno ao gerar relatórios.' });
  }
}

module.exports = { getMetricas };
