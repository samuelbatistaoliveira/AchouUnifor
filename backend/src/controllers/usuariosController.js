const pool = require("../config/database")

async function getMeuPerfil(req, res) {
    try {
        const resultado = await pool.query(
            "SELECT nome, email_institucional, telefone, curso, tipo_usuario FROM usuarios WHERE id_usuario = $1",
            [req.usuario.id_usuario]
        )

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            })
        }

        return res.status(200).json(resultado.rows[0])

    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

async function atualizarTelefone(req, res) {
    try {
        const telefone = String(req.body.telefone || "").replace(/\D/g, "")

        if (telefone.length < 10 || telefone.length > 11) {
            return res.status(400).json({
                mensagem: "Telefone inválido. Use DDD + número."
            })
        }

        await pool.query(
            "UPDATE usuarios SET telefone = $1, ultima_atualizacao = NOW() WHERE id_usuario = $2",
            [telefone, req.usuario.id_usuario]
        )

        return res.status(200).json({ telefone })

    } catch (erro) {
        console.error("Erro ao atualizar telefone:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

module.exports = {
    getMeuPerfil,
    atualizarTelefone
}
