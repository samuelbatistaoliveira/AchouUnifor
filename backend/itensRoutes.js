const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ajuste o caminho se o db.js estiver noutra pasta

// Rota para listar todos os objetos (Vai responder em GET /itens)
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM itens ORDER BY data_ocorrencia DESC');
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao procurar itens:', erro);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

module.exports = router;