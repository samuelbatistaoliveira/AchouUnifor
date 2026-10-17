const pool = require('../config/database');

const STATUS_VALIDOS = ['pendente', 'resolvida'];

// Denúncias com o item, a categoria e o aluno que denunciou; mais recentes primeiro
async function listarDenuncias(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT denuncias.id_denuncia, denuncias.motivo, denuncias.status, denuncias.data_denuncia,
             itens.id_item, itens.nome_objeto, categorias.nome AS categoria,
             usuarios.nome AS aluno, usuarios.matricula
      FROM denuncias
      JOIN itens ON itens.id_item = denuncias.id_item
      LEFT JOIN categorias ON categorias.id_categoria = itens.id_categoria
      JOIN usuarios ON usuarios.id_usuario = denuncias.id_usuario
      ORDER BY denuncias.data_denuncia DESC
    `);
    res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao listar denúncias:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

async function atualizarStatusDenuncia(req, res) {
  try {
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido.' });
    }

    const resultado = await pool.query(
      'UPDATE denuncias SET status = $1 WHERE id_denuncia = $2 RETURNING id_denuncia, status',
      [status, req.params.id_denuncia]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao atualizar denúncia:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

module.exports = { listarDenuncias, atualizarStatusDenuncia };
