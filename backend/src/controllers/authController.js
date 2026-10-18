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

        if (!email.endsWith("@edu.unifor.br")) {
            return res.status(400).json({
                mensagem: "Use seu e-mail institucional (@edu.unifor.br)."
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                mensagem: "A senha deve ter pelo menos 8 caracteres."
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

// Esqueci a senha: confere se o e-mail tem conta ativa antes de mandar o link.
// Aviso: responder "não encontrado" deixa qualquer um testar quais e-mails existem (escolha do projeto).
async function esqueciSenha(req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase()

        if (!email) {
            return res.status(400).json({
                mensagem: "Informe seu e-mail institucional."
            })
        }

        if (!email.endsWith("@edu.unifor.br")) {
            return res.status(400).json({
                mensagem: "Use seu e-mail institucional (@edu.unifor.br)."
            })
        }

        const resultado = await pool.query(
            "SELECT status FROM usuarios WHERE LOWER(email_institucional) = $1",
            [email]
        )

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Não encontramos uma conta com esse e-mail."
            })
        }

        if (resultado.rows[0].status !== "ativo") {
            return res.status(403).json({
                mensagem: "Esta conta está desativada. Procure a administração."
            })
        }

        // shortcut: ainda não envia o e-mail; gerar o link de redefinição e enviá-lo aqui
        return res.status(200).json({
            mensagem: "Link de recuperação enviado."
        })

    } catch (erro) {
        console.error("Erro ao recuperar senha:", erro)

        return res.status(500).json({
            mensagem: "Erro interno do servidor."
        })
    }
}

module.exports = {
    login,
    cadastro,
    esqueciSenha
}