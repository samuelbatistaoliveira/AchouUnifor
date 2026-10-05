const pool = require("../config/database")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

async function login(req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase()
        const senha = req.body.senha

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "E-mail e senha são obrigatórios."
            })
        }

        if (!email.endsWith("@edu.unifor.br")) {
            return res.status(400).json({
                mensagem: "Use seu e-mail institucional (@edu.unifor.br)."
            })
        }

        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE LOWER(email_institucional) = $1",
            [email]
        )

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            })
        }

        const usuario = resultado.rows[0]

        if (usuario.status !== "ativo") {
            return res.status(403).json({
                mensagem: "Usuário inativo."
            })
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        )

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            })
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                tipo_usuario: usuario.tipo_usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        )

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token: token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email_institucional,
                tipo_usuario: usuario.tipo_usuario
            }
        })

    } catch (erro) {
        console.error("Erro no login:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

module.exports = {
    login
}