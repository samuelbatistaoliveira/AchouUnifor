
const express = require('express');
const router = express.Router();

const upload = require('../config/upload');

const {
    uploadImagem,
    listarImagensItem,
    excluirImagem
} = require('../controllers/imagensController');

const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.post(
    '/:id_item',
    verificarToken,
    verificarAdmin,
    upload.single('imagem'),
    uploadImagem
);

router.get(
    '/item/:id_item',
    verificarToken,
    listarImagensItem
);

router.delete(
    '/:id_imagem',
    verificarToken,
    verificarAdmin,
    excluirImagem
);

module.exports = router;
