const pool = require('../config/database');
const supabase = require('../config/supabase');

// perdido (ao criar) -> encontrado (o admin achou) -> devolvido (o aluno retirou)
const STATUS_VALIDOS = ['perdido', 'encontrado', 'devolvido'];
// campo: [limite de caracteres, nome mostrado na mensagem]
const LIMITES = { nome_objeto: [100, 'O nome'], descricao: [1000, 'A descrição'], local_perda: [255, 'O local'] };

// Campos da denúncia de perda que o admin e o próprio aluno veem
const CAMPOS = `
  denuncias.id_denuncia, denuncias.nome_objeto, denuncias.descricao, denuncias.local_perda,
  denuncias.data_perda, denuncias.status, denuncias.data_denuncia, categorias.nome AS categoria
`;

// Junta a cada denúncia as URLs das suas fotos (assinadas por 1h, como as dos itens)
async function comFotos(denuncias) {
  if (denuncias.length === 0) return denuncias;

  const { rows } = await pool.query(
    'SELECT id_denuncia, caminho FROM imagens_denuncias WHERE id_denuncia = ANY($1) ORDER BY id_imagem',
    [denuncias.map((d) => d.id_denuncia)]
  );

  const fotos = {};
  if (rows.length > 0) {
    const { data, error } = await supabase.storage
      .from('itens')
      .createSignedUrls(rows.map((r) => r.caminho), 3600);
    if (error) throw error;

    rows.forEach((r, i) => {
      if (data[i]?.signedUrl) (fotos[r.id_denuncia] ??= []).push(data[i].signedUrl);
    });
  }

  return denuncias.map((d) => ({ ...d, fotos: fotos[d.id_denuncia] ?? [] }));
}

// Admin: todas as denúncias, com o aluno que denunciou; mais recentes primeiro
async function listarDenuncias(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT ${CAMPOS}, usuarios.nome AS aluno, usuarios.matricula
      FROM denuncias
      LEFT JOIN categorias ON categorias.id_categoria = denuncias.id_categoria
      JOIN usuarios ON usuarios.id_usuario = denuncias.id_usuario
      ORDER BY denuncias.data_denuncia DESC
    `);
    res.json(await comFotos(resultado.rows));

  } catch (erro) {
    console.error('Erro ao listar denúncias:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Aluno: só as denúncias que ele mesmo fez
async function listarMinhasDenuncias(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT ${CAMPOS}
       FROM denuncias
       LEFT JOIN categorias ON categorias.id_categoria = denuncias.id_categoria
       WHERE denuncias.id_usuario = $1
       ORDER BY denuncias.data_denuncia DESC`,
      [req.usuario.id_usuario]
    );
    res.json(await comFotos(resultado.rows));

  } catch (erro) {
    console.error('Erro ao listar denúncias do aluno:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Aluno denuncia a perda de um objeto; as fotos vão depois em POST /denuncias/:id/imagens
async function criarDenuncia(req, res) {
  try {
    const { categoria, data_perda } = req.body;
    const texto = (campo) => (typeof req.body[campo] === 'string' ? req.body[campo].trim() : '');
    const nome_objeto = texto('nome_objeto');
    const descricao = texto('descricao');
    const local_perda = texto('local_perda');

    if (!nome_objeto || !categoria || !local_perda || !data_perda) {
      return res.status(400).json({ mensagem: 'Preencha nome, categoria, bloco, data e horário.' });
    }

    const longo = Object.entries({ nome_objeto, descricao, local_perda }).find(([campo, valor]) => valor.length > LIMITES[campo][0]);
    if (longo) {
      const [limite, nome] = LIMITES[longo[0]];
      return res.status(400).json({ mensagem: `${nome} pode ter no máximo ${limite} caracteres.` });
    }

    const quando = Date.parse(data_perda);
    if (Number.isNaN(quando)) {
      return res.status(400).json({ mensagem: 'Data ou horário inválido.' });
    }
    if (quando > Date.now()) {
      return res.status(400).json({ mensagem: 'A data da perda não pode estar no futuro.' });
    }

    const resultado = await pool.query(
      `INSERT INTO denuncias (id_usuario, nome_objeto, descricao, local_perda, data_perda, id_categoria, status)
       SELECT $1, $2, $3, $4, $5, id_categoria, 'perdido'
       FROM categorias
       WHERE nome = $6 AND status = 'ativo'
       RETURNING id_denuncia, nome_objeto`,
      [req.usuario.id_usuario, nome_objeto, descricao || null, local_perda, data_perda, categoria]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({ mensagem: 'Categoria não encontrada.' });
    }

    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao criar denúncia:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

async function atualizarStatusDenuncia(req, res) {
  try {
    const { status } = req.body;

    if (!STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido.' });
    }

    if (!Number.isInteger(Number(req.params.id_denuncia))) {
      return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
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

// Aluno remove a própria denúncia enquanto o objeto ainda está perdido (depois disso ela vira histórico)
async function removerDenuncia(req, res) {
  try {
    const id_denuncia = Number(req.params.id_denuncia);
    if (!Number.isInteger(id_denuncia)) {
      return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
    }

    const { rows: [denuncia] } = await pool.query(
      'SELECT status FROM denuncias WHERE id_denuncia = $1 AND id_usuario = $2',
      [id_denuncia, req.usuario.id_usuario]
    );

    if (!denuncia) {
      return res.status(404).json({ mensagem: 'Denúncia não encontrada.' });
    }
    if (denuncia.status !== 'perdido') {
      return res.status(409).json({ mensagem: 'Só é possível remover denúncias de objetos ainda perdidos.' });
    }

    // as linhas de imagens_denuncias saem junto (ON DELETE CASCADE); os arquivos, logo depois
    const { rows: fotos } = await pool.query('SELECT caminho FROM imagens_denuncias WHERE id_denuncia = $1', [id_denuncia]);
    const removida = await pool.query(
      "DELETE FROM denuncias WHERE id_denuncia = $1 AND id_usuario = $2 AND status = 'perdido'",
      [id_denuncia, req.usuario.id_usuario]
    );

    if (removida.rowCount === 0) {
      return res.status(409).json({ mensagem: 'A denúncia mudou de status. Atualize a página.' });
    }

    if (fotos.length > 0) {
      // a denúncia já saiu: arquivo que sobrar no Storage só vai para o log
      await supabase.storage
        .from('itens')
        .remove(fotos.map((f) => f.caminho))
        .then(({ error }) => error && console.error('Fotos da denúncia ficaram no Storage:', error), console.error);
    }

    res.status(204).end();

  } catch (erro) {
    console.error('Erro ao remover denúncia:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

module.exports = { listarDenuncias, listarMinhasDenuncias, criarDenuncia, atualizarStatusDenuncia, removerDenuncia };
