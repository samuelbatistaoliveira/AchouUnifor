const express = require('express');
const router = express.Router();
const { getItens, criarItem } = require('../controllers/itensController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', getItens);
router.post('/', verificarToken, verificarAdmin, criarItem);

module.exports = router;
