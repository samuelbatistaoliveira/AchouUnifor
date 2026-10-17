const pool = require('../config/database');

async function getItens(req, res) {
  try {
    const { busca, categoria, bloco, status } = req.query;

    let query = `
      SELECT itens.*, categorias.nome AS categoria
      FROM itens
      JOIN categorias ON itens.id_categoria = categorias.id_categoria
    `;
    const condicoes = [];
    const valores = [];

    if (busca) {
      valores.push(`%${busca}%`);
      condicoes.push(`itens.nome_objeto ILIKE $${valores.length}`);
    }

    if (categoria) {
      valores.push(categoria);
      condicoes.push(`categorias.nome = $${valores.length}`);
    }

    if (bloco) {
      valores.push(`%${bloco}%`);
      condicoes.push(`itens.local_encontrado ILIKE $${valores.length}`);
    }

    if (status) {
      valores.push(status);
      condicoes.push(`itens.status = $${valores.length}`);
    }

    if (condicoes.length > 0) {
      query += ' WHERE ' + condicoes.join(' AND ');
    }

    const resultado = await pool.query(query, valores);
    res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao buscar itens:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

async function criarItem(req, res) {
  try {
    const { nome_objeto, descricao, categoria, data_horario, local_encontrado } = req.body;

    if (!nome_objeto?.trim() || !categoria || !data_horario || !local_encontrado?.trim()) {
      return res.status(400).json({ mensagem: 'Preencha nome, categoria, data, horário e local.' });
    }

    if (Number.isNaN(Date.parse(data_horario))) {
      return res.status(400).json({ mensagem: 'Data ou horário inválido.' });
    }

    const resultado = await pool.query(
      `INSERT INTO itens (nome_objeto, descricao, data_horario, local_encontrado, id_categoria, id_usuario)
       SELECT $1, $2, $3, $4, id_categoria, $6
       FROM categorias
       WHERE nome = $5
       RETURNING *`,
      [nome_objeto.trim(), descricao?.trim() || null, data_horario, local_encontrado.trim(), categoria, req.usuario.id_usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({ mensagem: 'Categoria não encontrada.' });
    }

    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao criar item:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

const STATUS_VALIDOS = ['achado', 'perdido', 'devolvido'];

async function atualizarStatus(req, res) {
  try {
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido.' });
    }

    const resultado = await pool.query(
      'UPDATE itens SET status = $1 WHERE id_item = $2 RETURNING *',
      [status, req.params.id_item]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao atualizar status:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

module.exports = { getItens, criarItem, atualizarStatus };