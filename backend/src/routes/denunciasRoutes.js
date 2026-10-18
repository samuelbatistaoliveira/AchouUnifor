const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
  listarDenuncias,
  listarMinhasDenuncias,
  criarDenuncia,
  atualizarStatusDenuncia,
} = require('../controllers/denunciasController');
const { uploadImagemDenuncia } = require('../controllers/imagensController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', verificarToken, verificarAdmin, listarDenuncias);
router.get('/minhas', verificarToken, listarMinhasDenuncias);
router.post('/', verificarToken, criarDenuncia);
router.post('/:id_denuncia/imagens', verificarToken, upload.single('imagem'), uploadImagemDenuncia);
router.patch('/:id_denuncia/status', verificarToken, verificarAdmin, atualizarStatusDenuncia);

module.exports = router;
