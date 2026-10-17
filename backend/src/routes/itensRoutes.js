const express = require('express');
const router = express.Router();
const { getItens, criarItem, atualizarStatus } = require('../controllers/itensController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', getItens);
router.post('/', verificarToken, verificarAdmin, criarItem);
router.patch('/:id_item/status', verificarToken, verificarAdmin, atualizarStatus);

module.exports = router;
