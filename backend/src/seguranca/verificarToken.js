const jwt = require("jsonwebtoken")

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization

    if(!authHeader){
        return res.status(401).json({
            mensagem: "Token não fornecido."
        })
    }

    const token = authHeader.split(" ")[1]

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = usuario
        next()
    } catch (erro) {
         return res.status(401).json({
        mensagem: "Token inválido ou expirado."
    })
    }
}

module.exports = {
    verificarToken
}