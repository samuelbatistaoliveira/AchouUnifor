const pool = require("../config/database")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { enviarEmailRecuperacao } = require("../services/emailService")

const DOMINIO_INSTITUCIONAL = "@edu.unifor.br"
const SENHA_MIN = 8
const SENHA_MAX = 72 // Limite seguro do algoritmo bcrypt (evita truncamento silencioso e DoS de CPU)

/**
 * Valida um token JWT de recuperação de senha garantindo que:
 * 1. Possui estrutura válida e `tipo === "recuperacao_senha"`;
 * 2. O usuário existe no banco e está com `status === "ativo"`;
 * 3. A assinatura composta (`JWT_SECRET + usuario.senha_hash`) ainda é válida.
 *
 * Como o hash da senha atual compõe o segredo de assinatura, qualquer alteração de senha
 * invalida automaticamente os links emitidos anteriormente (uso único stateless).
 *
 * @param {string} token Token JWT recebido na query ou no body.
 * @returns {Promise<{ ok: true, usuario: object } | { ok: false, status: number, mensagem: string }>}
 */
async function obterUsuarioDoTokenRecuperacao(token) {
    let payload
    try {
        payload = jwt.decode(token)
    } catch {
        return { ok: false, status: 400, mensagem: "Token inválido." }
    }

    if (!payload || !payload.id_usuario || payload.tipo !== "recuperacao_senha") {
        return { ok: false, status: 400, mensagem: "Token de recuperação inválido." }
    }

    const resultado = await pool.query(
        "SELECT id_usuario, email_institucional, status, senha_hash FROM usuarios WHERE id_usuario = $1",
        [payload.id_usuario]
    )

    if (resultado.rows.length === 0) {
        return { ok: false, status: 404, mensagem: "Usuário não encontrado." }
    }

    const usuario = resultado.rows[0]

    if (usuario.status !== "ativo") {
        return {
            ok: false,
            status: 403,
            mensagem: "Esta conta está desativada. Procure a administração."
        }
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET + usuario.senha_hash, {
            algorithms: ["HS256"]
        })
    } catch (erroJwt) {
        if (erroJwt.name === "TokenExpiredError") {
            return {
                ok: false,
                status: 400,
                mensagem: "O link de recuperação expirou. Solicite um novo."
            }
        }
        return {
            ok: false,
            status: 400,
            mensagem: "O link de recuperação é inválido ou já foi utilizado."
        }
    }

    return { ok: true, usuario }
}

async function login(req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase()
        const senha = req.body.senha

        if (!email || typeof senha !== "string" || !senha) {
            return res.status(400).json({
                mensagem: "E-mail e senha são obrigatórios."
            })
        }

        if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
            return res.status(400).json({
                mensagem: `Use seu e-mail institucional (${DOMINIO_INSTITUCIONAL}).`
            })
        }

        if (senha.length > SENHA_MAX) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
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

        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha_hash
        )

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            })
        }

        if (usuario.status !== "ativo") {
            return res.status(403).json({
                mensagem: "Usuário inativo."
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

async function cadastro(req, res) {
    try {
        const nome = String(req.body.nome || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const senha = req.body.senha;

        if (!nome || !email || typeof senha !== "string") {
            return res.status(400).json({
                mensagem: "Nome, e-mail e senha são obrigatórios."
            });
        }

        if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
            return res.status(400).json({
                mensagem: `Use seu e-mail institucional (${DOMINIO_INSTITUCIONAL}).`
            });
        }

        if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) {
            return res.status(400).json({
                mensagem: `A senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.`
            });
        }

        const senhaHash = await bcrypt.hash(senha, 12);

        const resultado = await pool.query(
            `INSERT INTO usuarios
                (nome, email_institucional, senha_hash, tipo_usuario)
             VALUES ($1, $2, $3, 'aluno')
             RETURNING id_usuario, nome, email_institucional, tipo_usuario`,
            [nome, email, senhaHash]
        );

        return res.status(201).json({
            mensagem: "Cadastro realizado com sucesso.",
            usuario: resultado.rows[0]
        });

    } catch (erro) {
        if (erro.code === "23505") {
            return res.status(409).json({
                mensagem: "Este e-mail já está cadastrado."
            });
        }

        console.error("Erro no cadastro:", erro);

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        });
    }
}

/**
 * Solicita a recuperação de senha para um e-mail institucional.
 * Responde sempre com mensagem genérica quando a conta não existe ou está inativa,
 * evitando enumeração de usuários cadastrados.
 */
async function esqueciSenha(req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase()

        if (!email) {
            return res.status(400).json({
                mensagem: "Informe seu e-mail institucional."
            })
        }

        if (!email.endsWith(DOMINIO_INSTITUCIONAL)) {
            return res.status(400).json({
                mensagem: `Use seu e-mail institucional (${DOMINIO_INSTITUCIONAL}).`
            })
        }

        const mensagemGenerica = "Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha."

        const resultado = await pool.query(
            "SELECT id_usuario, nome, email_institucional, status, senha_hash FROM usuarios WHERE LOWER(email_institucional) = $1",
            [email]
        )

        if (resultado.rows.length === 0 || resultado.rows[0].status !== "ativo") {
            return res.status(200).json({
                mensagem: mensagemGenerica
            })
        }

        const usuario = resultado.rows[0]

        // Gera token temporário assinado com o hash da senha atual
        // Assim que a senha for alterada, o token anterior é invalidado automaticamente
        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                email: usuario.email_institucional,
                tipo: "recuperacao_senha"
            },
            process.env.JWT_SECRET + usuario.senha_hash,
            { expiresIn: "1h" }
        )

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
        const link = `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`

        const envio = await enviarEmailRecuperacao({
            destinatario: usuario.email_institucional,
            nome: usuario.nome,
            link
        })

        if (!envio?.sucesso) {
            return res.status(500).json({
                mensagem: "Não foi possível enviar o e-mail de recuperação no momento. Tente novamente."
            })
        }

        return res.status(200).json({
            mensagem: mensagemGenerica
        })

    } catch (erro) {
        console.error("Erro ao recuperar senha:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

// Valida se o token de recuperação é válido, não expirou e a senha ainda não foi alterada
async function validarTokenRecuperacao(req, res) {
    try {
        const token = String(req.query.token || "").trim()

        if (!token) {
            return res.status(400).json({
                valido: false,
                mensagem: "Token de recuperação não foi fornecido."
            })
        }

        const validacao = await obterUsuarioDoTokenRecuperacao(token)

        if (!validacao.ok) {
            return res.status(validacao.status).json({
                valido: false,
                mensagem: validacao.mensagem
            })
        }

        return res.status(200).json({
            valido: true,
            email: validacao.usuario.email_institucional,
            mensagem: "Token válido."
        })

    } catch (erro) {
        console.error("Erro ao validar token de recuperação:", erro)

        return res.status(500).json({
            valido: false,
            mensagem: "Erro interno do servidor."
        })
    }
}

// Redefine a senha do usuário utilizando o token validado
async function redefinirSenha(req, res) {
    try {
        const token = String(req.body.token || "").trim()
        const novaSenha = req.body.novaSenha

        if (!token || !novaSenha || typeof novaSenha !== "string") {
            return res.status(400).json({
                mensagem: "Token e nova senha são obrigatórios."
            })
        }

        if (novaSenha.length < SENHA_MIN || novaSenha.length > SENHA_MAX) {
            return res.status(400).json({
                mensagem: `A nova senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.`
            })
        }

        const validacao = await obterUsuarioDoTokenRecuperacao(token)

        if (!validacao.ok) {
            return res.status(validacao.status).json({
                mensagem: validacao.mensagem
            })
        }

        const senhaHash = await bcrypt.hash(novaSenha, 12)

        await pool.query(
            "UPDATE usuarios SET senha_hash = $1, ultima_atualizacao = NOW() WHERE id_usuario = $2",
            [senhaHash, validacao.usuario.id_usuario]
        )

        return res.status(200).json({
            mensagem: "Senha redefinida com sucesso."
        })

    } catch (erro) {
        console.error("Erro ao redefinir senha:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

module.exports = {
    login,
    cadastro,
    esqueciSenha,
    validarTokenRecuperacao,
    redefinirSenha
}
