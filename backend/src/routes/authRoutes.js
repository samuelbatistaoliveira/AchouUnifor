const express = require("express")
const router = express.Router()

const {
    login,
    cadastro,
    esqueciSenha,
    validarTokenRecuperacao,
    redefinirSenha
} = require("../controllers/authController")

// Rate limiting em memória por IP para mitigar força bruta e flood de e-mails nas rotas de autenticação
const JANELA_MS = 60 * 1000 // 1 minuto
const MAX_TENTATIVAS = 20
const tentativasPorIp = new Map()

setInterval(() => {
    const agora = Date.now()
    for (const [ip, registro] of tentativasPorIp.entries()) {
        if (agora > registro.expiraEm) tentativasPorIp.delete(ip)
    }
}, JANELA_MS).unref()

function limitarTentativasAuth(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || "desconhecido"
    const agora = Date.now()
    const atual = tentativasPorIp.get(ip)

    if (!atual || agora > atual.expiraEm) {
        tentativasPorIp.set(ip, { contagem: 1, expiraEm: agora + JANELA_MS })
        return next()
    }

    atual.contagem += 1
    if (atual.contagem > MAX_TENTATIVAS) {
        return res.status(429).json({
            mensagem: "Muitas tentativas realizadas. Aguarde um minuto e tente novamente."
        })
    }

    next()
}

router.use(limitarTentativasAuth)

router.post("/login", login)
router.post("/cadastro", cadastro)
router.post("/esqueci-senha", esqueciSenha)
router.get("/validar-token", validarTokenRecuperacao)
router.post("/redefinir-senha", redefinirSenha)

module.exports = router
