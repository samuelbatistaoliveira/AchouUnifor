const express = require('express');
const router = express.Router();
const { getMetricas } = require('../controllers/relatoriosController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', verificarToken, verificarAdmin, getMetricas);

module.exports = router;
