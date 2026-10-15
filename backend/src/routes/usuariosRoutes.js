const express = require("express")
const router = express.Router()

const { verificarToken } = require("../seguranca/verificarToken")
const { getMeuPerfil, atualizarTelefone } = require("../controllers/usuariosController")

router.get("/me", verificarToken, getMeuPerfil)
router.put("/me/telefone", verificarToken, atualizarTelefone)

module.exports = router
