const express = require('express');
const router = express.Router();
const {
  listarCategorias,
  criarCategoria,
  renomearCategoria,
  removerCategoria
} = require('../controllers/categoriasController');
const { verificarToken } = require('../seguranca/verificarToken');
const { verificarAdmin } = require('../seguranca/verificarAdmin');

router.get('/', listarCategorias);
router.post('/', verificarToken, verificarAdmin, criarCategoria);
router.put('/:id_categoria', verificarToken, verificarAdmin, renomearCategoria);
router.delete('/:id_categoria', verificarToken, verificarAdmin, removerCategoria);

module.exports = router;
