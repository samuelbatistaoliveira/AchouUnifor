const express = require('express');
const router = express.Router();
const { getItens } = require('../controllers/itensController');

router.get('/', getItens);

module.exports = router;