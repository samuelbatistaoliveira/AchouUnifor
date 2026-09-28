const pool = require("../config/database")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

async function login(req, res) {
    try {
        const matricula = req.body.matricula
        const senha = req.body.senha

        if (!matricula || !senha) {
            return res.status(400).json({
                mensagem: "Matrícula e senha são obrigatórias."
            })
        }

        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE matricula = $1",
            [matricula]
        )

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensagem: "Matrícula ou senha inválida."
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
                mensagem: "Matrícula ou senha inválida."
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
                matricula: usuario.matricula,
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