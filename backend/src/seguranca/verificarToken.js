const jwt = require("jsonwebtoken")

/**
 * Middleware que valida o token JWT enviado no cabeçalho `Authorization: Bearer <token>`.
 * Caso seja válido, anexa o payload decodificado (`{ id_usuario, tipo_usuario }`) em `req.usuario`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || typeof authHeader !== "string") {
        return res.status(401).json({
            mensagem: "Token não fornecido."
        })
    }

    const [esquema, token] = authHeader.trim().split(/\s+/)

    if (esquema !== "Bearer" || !token) {
        return res.status(401).json({
            mensagem: "Formato de token inválido. Use: Bearer <token>."
        })
    }

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"]
        })
        req.usuario = usuario
        next()
    } catch {
        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        })
    }
}

module.exports = {
    verificarToken
}
