const express = require("express")
const router = express.Router()

const {
    login,
    cadastro,
    esqueciSenha,
    validarTokenRecuperacao,
    redefinirSenha
} = require("../controllers/authController")

router.post("/login", login)
router.post("/cadastro", cadastro)
router.post("/esqueci-senha", esqueciSenha)
router.get("/validar-token", validarTokenRecuperacao)
router.post("/redefinir-senha", redefinirSenha)

module.exports = router