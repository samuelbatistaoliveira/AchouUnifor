const express = require('express');
const router = express.Router();
const { getItens } = require('../controllers/itensController');
const { verificarToken } = require('../seguranca/verificarToken');

router.get('/',verificarToken, getItens);

module.exports = router;