const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
  listarDenuncias,
  listarMinhasDenuncias,
  criarDenuncia,
  atualizarStatusDenuncia,
  removerDenuncia,
} = require('../controllers/denunciasController');
const { uploadImagemDenuncia } = require('../controllers/imagensController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', verificarToken, verificarAdmin, listarDenuncias);
router.get('/minhas', verificarToken, listarMinhasDenuncias);
router.post('/', verificarToken, criarDenuncia);
router.post('/:id_denuncia/imagens', verificarToken, upload.single('imagem'), uploadImagemDenuncia);
router.patch('/:id_denuncia/status', verificarToken, verificarAdmin, atualizarStatusDenuncia);
router.delete('/:id_denuncia', verificarToken, removerDenuncia); // o controller só deixa o dono remover

module.exports = router;
