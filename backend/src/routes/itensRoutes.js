const express = require('express');
const router = express.Router();
const {
  getItens,
  listarPerdidos,
  buscarItem,
  buscarPerdido,
  criarItem,
  editarItem,
  atualizarStatus,
} = require('../controllers/itensController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

// lista completa traz o local onde o item foi encontrado: só admin
router.get('/', verificarToken, verificarAdmin, getItens);
router.get('/perdidos', verificarToken, listarPerdidos);
router.get('/perdidos/:id_item', verificarToken, buscarPerdido);
router.get('/:id_item', verificarToken, verificarAdmin, buscarItem); // depois de /perdidos para não engolir essa rota
router.post('/', verificarToken, verificarAdmin, criarItem);
router.put('/:id_item', verificarToken, verificarAdmin, editarItem);
router.patch('/:id_item/status', verificarToken, verificarAdmin, atualizarStatus);

module.exports = router;
