const pool = require('../config/database');

const NOME_DUPLICADO = '23505'; // código do Postgres para violar o UNIQUE (nome)
const MAX_NOME_CATEGORIA = 50;
const idValido = (valor) => /^[1-9]\d*$/.test(valor);

/**
 * Lista todas as categorias ativas em ordem alfabética, incluindo a contagem total de itens
 * vinculados a cada categoria (`total_itens`).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listarCategorias(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT categorias.id_categoria, categorias.nome, COUNT(itens.id_item)::int AS total_itens
      FROM categorias
      LEFT JOIN itens ON itens.id_categoria = categorias.id_categoria
      WHERE categorias.status = 'ativo'
      GROUP BY categorias.id_categoria
      ORDER BY categorias.nome
    `);
    res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao listar categorias:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

/**
 * Cria uma nova categoria ou reativa uma categoria anteriormente desativada com o mesmo nome.
 * Utiliza `ON CONFLICT (nome) DO UPDATE ... WHERE categorias.status = 'inativo'` para evitar
 * duplicação e preservar o histórico de itens antigos.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function criarCategoria(req, res) {
  try {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';

    if (!nome) {
      return res.status(400).json({ mensagem: 'Informe o nome da categoria.' });
    }

    if (nome.length > MAX_NOME_CATEGORIA) {
      return res.status(400).json({
        mensagem: `O nome da categoria pode ter no máximo ${MAX_NOME_CATEGORIA} caracteres.`
      });
    }

    // um nome removido antes volta a ficar ativo em vez de duplicar
    const resultado = await pool.query(
      `INSERT INTO categorias (nome)
       VALUES ($1)
       ON CONFLICT (nome) DO UPDATE SET status = 'ativo'
       WHERE categorias.status = 'inativo'
       RETURNING id_categoria, nome`,
      [nome]
    );

    if (resultado.rows.length === 0) {
      return res.status(409).json({ mensagem: 'Já existe uma categoria com esse nome.' });
    }

    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao criar categoria:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

/**
 * Renomeia uma categoria ativa existente, respeitando a restrição UNIQUE do banco.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function renomearCategoria(req, res) {
  try {
    if (!idValido(req.params.id_categoria)) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }

    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';

    if (!nome) {
      return res.status(400).json({ mensagem: 'Informe o nome da categoria.' });
    }

    if (nome.length > MAX_NOME_CATEGORIA) {
      return res.status(400).json({
        mensagem: `O nome da categoria pode ter no máximo ${MAX_NOME_CATEGORIA} caracteres.`
      });
    }

    const resultado = await pool.query(
      `UPDATE categorias SET nome = $1
       WHERE id_categoria = $2 AND status = 'ativo'
       RETURNING id_categoria, nome`,
      [nome, req.params.id_categoria]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    if (erro.code === NOME_DUPLICADO) {
      return res.status(409).json({ mensagem: 'Já existe uma categoria com esse nome.' });
    }
    console.error('Erro ao renomear categoria:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

/**
 * Realiza a exclusão lógica (soft delete) da categoria alterando seu status para 'inativo'.
 * Dessa forma, os itens já registrados permanecem íntegros apontando para a chave estrangeira.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function removerCategoria(req, res) {
  try {
    if (!idValido(req.params.id_categoria)) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }

    const resultado = await pool.query(
      `UPDATE categorias SET status = 'inativo'
       WHERE id_categoria = $1 AND status = 'ativo'
       RETURNING id_categoria`,
      [req.params.id_categoria]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada.' });
    }

    res.status(204).end();

  } catch (erro) {
    console.error('Erro ao remover categoria:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

module.exports = { listarCategorias, criarCategoria, renomearCategoria, removerCategoria };
