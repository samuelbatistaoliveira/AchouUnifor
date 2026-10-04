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

module.exports = { getItens };