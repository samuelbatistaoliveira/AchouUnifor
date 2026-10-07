const express = require('express');
const router = express.Router();

const upload = require('../config/upload');
const { uploadImagem } = require('../controllers/imagensController');
const { verificarToken } = require('../seguranca/verificarToken');

router.post(
    '/:id_item',
    verificarToken,
    upload.single('imagem'),
    uploadImagem
);

module.exports = router;