const express = require("express")
const router = express.Router()

const { login, cadastro, esqueciSenha } = require("../controllers/authController")

router.post("/login", login)

router.post("/cadastro", cadastro);

router.post("/esqueci-senha", esqueciSenha)


module.exports = router