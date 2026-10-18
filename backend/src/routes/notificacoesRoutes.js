const express = require('express');
const router = express.Router();
const {
  listarNotificacoes,
  listarMinhasNotificacoes,
  criarNotificacao,
} = require('../controllers/notificacoesController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', verificarToken, verificarAdmin, listarNotificacoes);
router.get('/minhas', verificarToken, listarMinhasNotificacoes);
router.post('/', verificarToken, verificarAdmin, criarNotificacao);

module.exports = router;
