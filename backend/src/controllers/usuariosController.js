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

const TIPOS_USUARIO = ["aluno", "administrador"]

// Lista para o painel do administrador: só usuários ativos e nunca a senha
async function listarUsuarios(req, res) {
    try {
        const resultado = await pool.query(
            `SELECT id_usuario, nome, email_institucional, telefone, tipo_usuario
             FROM usuarios
             WHERE status = 'ativo'
             ORDER BY nome`
        )

        return res.status(200).json(resultado.rows)

    } catch (erro) {
        console.error("Erro ao listar usuários:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

async function editarUsuario(req, res) {
    try {
        const nome = String(req.body.nome || "").trim()
        const telefone = String(req.body.telefone || "").replace(/\D/g, "")
        const { tipo_usuario } = req.body
        const id = Number(req.params.id_usuario)

        if (!nome) {
            return res.status(400).json({
                mensagem: "Informe o nome."
            })
        }

        if (telefone && (telefone.length < 10 || telefone.length > 11)) {
            return res.status(400).json({
                mensagem: "Telefone inválido. Use DDD + número."
            })
        }

        if (!TIPOS_USUARIO.includes(tipo_usuario)) {
            return res.status(400).json({
                mensagem: "Tipo de usuário inválido."
            })
        }

        // evita que o administrador perca o próprio acesso ao painel
        if (id === req.usuario.id_usuario && tipo_usuario !== "administrador") {
            return res.status(400).json({
                mensagem: "Você não pode remover seu próprio acesso de administrador."
            })
        }

        const resultado = await pool.query(
            `UPDATE usuarios
             SET nome = $1, telefone = $2, tipo_usuario = $3, ultima_atualizacao = NOW()
             WHERE id_usuario = $4 AND status = 'ativo'
             RETURNING id_usuario, nome, email_institucional, telefone, tipo_usuario`,
            [nome, telefone || null, tipo_usuario, id]
        )

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            })
        }

        return res.status(200).json(resultado.rows[0])

    } catch (erro) {
        console.error("Erro ao editar usuário:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

// Desativa em vez de apagar: os itens dele continuam no sistema e o login passa a recusar
async function removerUsuario(req, res) {
    try {
        const id = Number(req.params.id_usuario)

        if (id === req.usuario.id_usuario) {
            return res.status(400).json({
                mensagem: "Você não pode remover a si mesmo."
            })
        }

        const resultado = await pool.query(
            `UPDATE usuarios
             SET status = 'inativo', ultima_atualizacao = NOW()
             WHERE id_usuario = $1 AND status = 'ativo'
             RETURNING id_usuario`,
            [id]
        )

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            })
        }

        return res.status(204).end()

    } catch (erro) {
        console.error("Erro ao remover usuário:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

module.exports = {
    getMeuPerfil,
    atualizarTelefone,
    listarUsuarios,
    editarUsuario,
    removerUsuario
}
