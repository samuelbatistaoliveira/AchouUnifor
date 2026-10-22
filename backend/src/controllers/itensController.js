const pool = require('../config/database');
const supabase = require('../config/supabase');

// Busca em lote (batch) a imagem de capa de cada item e gera signed URLs em uma única chamada
async function anexarFotosCapa(itens) {
  if (!itens || itens.length === 0) return itens;

  const ids = itens.map((item) => item.id_item);

  // Busca a primeira imagem de cada item (menor id_imagem)
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (id_item) id_item, caminho
     FROM imagens_itens
     WHERE id_item = ANY($1)
     ORDER BY id_item, id_imagem ASC`,
    [ids]
  );

  const fotos = {};
  if (rows.length > 0) {
    const caminhos = rows.map((r) => r.caminho);
    const { data, error } = await supabase.storage
      .from('itens')
      .createSignedUrls(caminhos, 3600);

    if (error) {
      console.error('Erro ao gerar URLs assinadas das imagens de capa:', error);
    } else if (Array.isArray(data)) {
      rows.forEach((r, i) => {
        if (data[i]?.signedUrl) {
          fotos[r.id_item] = data[i].signedUrl;
        }
      });
    }
  }

  return itens.map((item) => ({
    ...item,
    imagem_url: fotos[item.id_item] ?? null,
    foto: fotos[item.id_item] ?? null,
  }));
}

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
    const itensComCapa = await anexarFotosCapa(resultado.rows);
    res.json(itensComCapa);

  } catch (erro) {
    console.error('Erro ao buscar itens:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Visão do aluno: só itens perdidos e só o básico (sem local, descrição nem quem registrou)
async function listarPerdidos(req, res) {
  try {
    const { busca, categoria } = req.query;
    const valores = [];
    let query = `
      SELECT itens.id_item, itens.nome_objeto, itens.data_horario, categorias.nome AS categoria
      FROM itens
      JOIN categorias ON itens.id_categoria = categorias.id_categoria
      WHERE itens.status = 'perdido'
    `;

    if (busca) {
      valores.push(`%${busca}%`);
      query += ` AND itens.nome_objeto ILIKE $${valores.length}`;
    }

    if (categoria) {
      valores.push(categoria);
      query += ` AND categorias.nome = $${valores.length}`;
    }

    const resultado = await pool.query(query + ' ORDER BY itens.data_horario DESC', valores);
    const itensComCapa = await anexarFotosCapa(resultado.rows);
    res.json(itensComCapa);

  } catch (erro) {
    console.error('Erro ao buscar itens perdidos:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// id da URL (/itens/abc ou /itens/-1 viram 404, não erro do banco)
const idValido = (valor) => /^\d+$/.test(valor);

// Um item pelo id, com tudo (admin): abre /itens/:id e /gerenciar/:id no frontend
async function buscarItem(req, res) {
  try {
    if (!idValido(req.params.id_item)) return res.status(404).json({ mensagem: 'Item não encontrado.' });

    const resultado = await pool.query(
      `SELECT itens.*, categorias.nome AS categoria
       FROM itens
       JOIN categorias ON itens.id_categoria = categorias.id_categoria
       WHERE itens.id_item = $1`,
      [req.params.id_item]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ mensagem: 'Item não encontrado.' });
    res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao buscar item:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Um item perdido pelo id, só com o básico (aluno): mesmos campos de listarPerdidos
async function buscarPerdido(req, res) {
  try {
    if (!idValido(req.params.id_item)) return res.status(404).json({ mensagem: 'Item não encontrado.' });

    const resultado = await pool.query(
      `SELECT itens.id_item, itens.nome_objeto, itens.data_horario, categorias.nome AS categoria
       FROM itens
       JOIN categorias ON itens.id_categoria = categorias.id_categoria
       WHERE itens.status = 'perdido' AND itens.id_item = $1`,
      [req.params.id_item]
    );

    if (resultado.rows.length === 0) return res.status(404).json({ mensagem: 'Item não encontrado.' });
    res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao buscar item perdido:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

const STATUS_NOVO_ITEM = ['achado', 'perdido'];

// Campos comuns de registrar e editar; devolve a mensagem de erro ou ''
function validarItem({ nome_objeto, categoria, data_horario, local_encontrado }) {
  if (!nome_objeto?.trim() || !categoria || !data_horario || !local_encontrado?.trim()) {
    return 'Preencha nome, categoria, data, horário e local.';
  }
  if (Number.isNaN(Date.parse(data_horario))) return 'Data ou horário inválido.';
  return '';
}

async function criarItem(req, res) {
  try {
    const { nome_objeto, descricao, categoria, data_horario, local_encontrado } = req.body;
    const status = req.body.status ?? 'achado';

    const invalido = validarItem(req.body);
    if (invalido) return res.status(400).json({ mensagem: invalido });

    if (!STATUS_NOVO_ITEM.includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido.' });
    }

    const resultado = await pool.query(
      `INSERT INTO itens (nome_objeto, descricao, data_horario, local_encontrado, id_categoria, id_usuario, status)
       SELECT $1, $2, $3, $4, id_categoria, $6, $7
       FROM categorias
       WHERE nome = $5 AND status = 'ativo'
       RETURNING *`,
      [nome_objeto.trim(), descricao?.trim() || null, data_horario, local_encontrado.trim(), categoria, req.usuario.id_usuario, status]
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

// Edita as informações do item; o status muda só pela rota de status
async function editarItem(req, res) {
  try {
    const { nome_objeto, descricao, categoria, data_horario, local_encontrado } = req.body;

    const invalido = validarItem(req.body);
    if (invalido) return res.status(400).json({ mensagem: invalido });

    const resultado = await pool.query(
      `UPDATE itens
       SET nome_objeto = $1, descricao = $2, data_horario = $3, local_encontrado = $4, id_categoria = categorias.id_categoria
       FROM categorias
       WHERE itens.id_item = $6 AND categorias.nome = $5 AND categorias.status = 'ativo'
       RETURNING itens.*`,
      [nome_objeto.trim(), descricao?.trim() || null, data_horario, local_encontrado.trim(), categoria, req.params.id_item]
    );

    if (resultado.rows.length === 0) {
      const existe = await pool.query('SELECT 1 FROM itens WHERE id_item = $1', [req.params.id_item]);
      return existe.rows.length === 0
        ? res.status(404).json({ mensagem: 'Item não encontrado.' })
        : res.status(400).json({ mensagem: 'Categoria não encontrada.' });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao editar item:', erro);
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

module.exports = {
  getItens,
  listarPerdidos,
  buscarItens: getItens,
  buscarItensPerdidos: listarPerdidos,
  buscarItem,
  buscarPerdido,
  criarItem,
  editarItem,
  atualizarStatus,
};