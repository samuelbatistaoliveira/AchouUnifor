const nodemailer = require("nodemailer");

let testAccount = null;

async function obterTransporter() {
    // 1. Caso variáveis de ambiente SMTP estejam configuradas
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // 2. Caso serviço predefinido esteja configurado (ex: gmail)
    if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER) {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // 3. Modo de desenvolvimento / teste automático com Ethereal Email
    try {
        if (!testAccount) {
            testAccount = await nodemailer.createTestAccount();
            console.log("Conta de teste Ethereal criada para envio de e-mails.");
        }
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } catch (erro) {
        console.warn("Não foi possível criar conta Ethereal. Operando com simulador de console.", erro.message);
        return null;
    }
}

function escaparHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function enviarEmailRecuperacao({ destinatario, nome, link }) {
    const primeiroNomeRaw = nome ? nome.split(" ")[0] : "Usuário";
    const primeiroNome = escaparHtml(primeiroNomeRaw);
    const remetente = process.env.SMTP_FROM || '"AchouUNIFOR" <suporte@achouunifor.com>';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha - AchouUNIFOR</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f1f5f9;
                margin: 0;
                padding: 30px 15px;
                color: #1e293b;
            }
            .email-container {
                max-width: 560px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                border: 1px solid #e2e8f0;
            }
            .header {
                background-color: #093f97;
                padding: 24px;
                text-align: center;
                color: #ffffff;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }
            .header span {
                color: #60a5fa;
            }
            .content {
                padding: 32px 28px;
                line-height: 1.6;
            }
            .content h2 {
                margin-top: 0;
                font-size: 20px;
                color: #0f172a;
            }
            .content p {
                font-size: 15px;
                color: #475569;
                margin: 14px 0;
            }
            .btn-container {
                text-align: center;
                margin: 32px 0;
            }
            .btn-reset {
                background-color: #093f97;
                color: #ffffff !important;
                padding: 14px 28px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
            }
            .link-alt {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 12px;
                border-radius: 6px;
                word-break: break-all;
                font-size: 13px;
                color: #0284c7;
            }
            .footer {
                background-color: #f8fafc;
                padding: 20px 28px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Achou <span>UNIFOR</span></h1>
            </div>
            <div class="content">
                <h2>Olá, ${primeiroNome}!</h2>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>AchouUNIFOR</strong> associada a este e-mail.</p>
                <p>Para escolher uma nova senha e recuperar o acesso, clique no botão abaixo:</p>
                
                <div class="btn-container">
                    <a href="${link}" class="btn-reset" target="_blank">Redefinir Minha Senha</a>
                </div>

                <p style="font-size: 13px; color: #64748b;">
                    Se o botão não funcionar, copie e cole o seguinte link no seu navegador:
                </p>
                <div class="link-alt">${link}</div>

                <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
                    <strong>Atenção:</strong> Por motivos de segurança, este link é válido por <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, nenhuma ação é necessária e sua senha atual continuará segura.
                </p>
            </div>
            <div class="footer">
                AchouUNIFOR &copy; ${new Date().getFullYear()} - Sistema de Achados e Perdidos da Universidade de Fortaleza.
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `Olá, ${primeiroNomeRaw}!\n\nRecebemos uma solicitação para redefinir a senha da sua conta no AchouUNIFOR.\n\nPara cadastrar uma nova senha, acesse o link:\n${link}\n\nEste link é válido por 1 hora. Se você não solicitou esta alteração, ignore este e-mail.\n\nAchouUNIFOR`;

    const transporter = await obterTransporter();

    console.log(`📧 [AchouUNIFOR] Solicitação de recuperação de senha processada para: ${destinatario}`);

    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: remetente,
                to: destinatario,
                subject: "Recuperação de Senha - AchouUNIFOR",
                text: textContent,
                html: htmlContent,
            });

            return { sucesso: true, messageId: info.messageId };
        } catch (erroEnvio) {
            console.error("Erro ao enviar e-mail via transporter:", erroEnvio.message);
            return { sucesso: false, erro: erroEnvio.message };
        }
    }

    return { sucesso: true };
}

module.exports = {
    enviarEmailRecuperacao,
};
