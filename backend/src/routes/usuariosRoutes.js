const express = require("express")
const router = express.Router()

const { verificarToken } = require("../seguranca/verificarToken")
const { verificarAdmin } = require("../seguranca/verificarAdmin")
const {
    getMeuPerfil,
    atualizarTelefone,
    listarUsuarios,
    editarUsuario,
    removerUsuario
} = require("../controllers/usuariosController")

router.get("/me", verificarToken, getMeuPerfil)
router.put("/me/telefone", verificarToken, atualizarTelefone)

router.get("/", verificarToken, verificarAdmin, listarUsuarios)
router.put("/:id_usuario", verificarToken, verificarAdmin, editarUsuario)
router.delete("/:id_usuario", verificarToken, verificarAdmin, removerUsuario)

module.exports = router
