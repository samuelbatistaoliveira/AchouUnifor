const pool = require('../config/database');

const TITULO_MAX = 100;
const MENSAGEM_MAX = 1000;

// Admin: tudo que já foi enviado, com o nome do aluno quando foi para um só; mais recentes primeiro
async function listarNotificacoes(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT notificacoes.id_notificacao, notificacoes.titulo, notificacoes.mensagem, notificacoes.data_criacao,
             notificacoes.id_destinatario, destinatario.nome AS destinatario, autor.nome AS autor
      FROM notificacoes
      LEFT JOIN usuarios destinatario ON destinatario.id_usuario = notificacoes.id_destinatario
      JOIN usuarios autor ON autor.id_usuario = notificacoes.id_autor
      ORDER BY notificacoes.data_criacao DESC, notificacoes.id_notificacao DESC
    `);
    res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao listar notificações:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Aluno: as enviadas para todos e as enviadas só para ele
async function listarMinhasNotificacoes(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT id_notificacao, titulo, mensagem, data_criacao, (id_destinatario IS NOT NULL) AS para_mim
       FROM notificacoes
       WHERE id_destinatario IS NULL OR id_destinatario = $1
       ORDER BY data_criacao DESC, id_notificacao DESC`,
      [req.usuario.id_usuario]
    );
    res.json(resultado.rows);

  } catch (erro) {
    console.error('Erro ao listar notificações do usuário:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

// Admin envia uma notificação para todos os alunos (sem id_destinatario) ou para um aluno
async function criarNotificacao(req, res) {
  try {
    const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
    const mensagem = typeof req.body.mensagem === 'string' ? req.body.mensagem.trim() : '';
    const { id_destinatario } = req.body;

    if (!titulo || !mensagem) {
      return res.status(400).json({ mensagem: 'Preencha o título e a mensagem.' });
    }
    if (titulo.length > TITULO_MAX) {
      return res.status(400).json({ mensagem: `O título pode ter no máximo ${TITULO_MAX} caracteres.` });
    }
    if (mensagem.length > MENSAGEM_MAX) {
      return res.status(400).json({ mensagem: `A mensagem pode ter no máximo ${MENSAGEM_MAX} caracteres.` });
    }

    const paraTodos = id_destinatario === undefined || id_destinatario === null || id_destinatario === '';
    if (!paraTodos) {
      const id = Number(id_destinatario);
      const existe = Number.isInteger(id) && (await pool.query(
        "SELECT 1 FROM usuarios WHERE id_usuario = $1 AND tipo_usuario = 'aluno' AND status = 'ativo'",
        [id]
      )).rows.length > 0;
      if (!existe) {
        return res.status(400).json({ mensagem: 'Aluno não encontrado.' });
      }
    }

    const resultado = await pool.query(
      `INSERT INTO notificacoes (titulo, mensagem, id_destinatario, id_autor)
       VALUES ($1, $2, $3, $4)
       RETURNING id_notificacao`,
      [titulo, mensagem, paraTodos ? null : Number(id_destinatario), req.usuario.id_usuario]
    );

    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    console.error('Erro ao criar notificação:', erro);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

module.exports = { listarNotificacoes, listarMinhasNotificacoes, criarNotificacao };
