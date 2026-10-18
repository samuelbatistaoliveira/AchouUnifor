const express = require('express');
const router = express.Router();
const { listarDenuncias, atualizarStatusDenuncia, criarDenuncia } = require('../controllers/denunciasController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', verificarToken, verificarAdmin, listarDenuncias);
router.post('/', verificarToken, criarDenuncia);
router.patch('/:id_denuncia/status', verificarToken, verificarAdmin, atualizarStatusDenuncia);

module.exports = router;
