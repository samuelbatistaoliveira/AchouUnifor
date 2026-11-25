const express = require("express")
const cors = require("cors")
const multer = require("multer")
const itensRoutes = require("./routes/itensRoutes")
const authRoutes = require("./routes/authRoutes")
const usuariosRoutes = require("./routes/usuariosRoutes")
const imagensRoutes = require("./routes/imagensRoutes")
const categoriasRoutes = require("./routes/categoriasRoutes")
const denunciasRoutes = require("./routes/denunciasRoutes")
const notificacoesRoutes = require("./routes/notificacoesRoutes")
const relatoriosRoutes = require("./routes/relatoriosRoutes")

const app = express()

function origemPermitida(origin) {
    if (!origin) return true

    const origemNormalizada = origin.replace(/\/$/, "")
    const origensEnv = [
        process.env.FRONTEND_URL?.replace(/\/$/, ""),
        process.env.CORS_ORIGIN?.replace(/\/$/, "")
    ].filter(Boolean)

    if (origensEnv.includes(origemNormalizada)) return true

    try {
        const { hostname } = new URL(origemNormalizada)
        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.endsWith(".vercel.app")
        ) {
            return true
        }
    } catch {
        return false
    }

    return false
}

app.use(cors({
    origin: (origin, callback) => {
        if (origemPermitida(origin)) {
            return callback(null, true)
        }
        console.warn("Origem bloqueada pelo CORS:", origin)
        return callback(null, false)
    },
    credentials: true
}))
app.use(express.json({ limit: "100kb" }))

const apiRouter = express.Router()

apiRouter.use("/itens", itensRoutes)
apiRouter.use("/auth", authRoutes)
apiRouter.use("/usuarios", usuariosRoutes)
apiRouter.use("/imagens", imagensRoutes)
apiRouter.use("/categorias", categoriasRoutes)
apiRouter.use("/denuncias", denunciasRoutes)
apiRouter.use("/notificacoes", notificacoesRoutes)
apiRouter.use("/relatorios", relatoriosRoutes)

apiRouter.get("/", (req, res) => {
    res.send("Backend do AchouUNIFOR funcionando!")
})

// Suporta tanto o prefixo público /api/* (rewrite da Vercel) quanto chamadas diretas /* (testes/dev local)
app.use("/api", apiRouter)
app.use("/", apiRouter)

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
    console.error("Erro capturado no servidor:", err);

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ mensagem: "Arquivo muito grande. O limite máximo é de 5 MB." });
        }
        return res.status(400).json({ mensagem: `Erro no envio do arquivo: ${err.message}` });
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ mensagem: "Formato JSON inválido na requisição." });
    }

    if (err.message === "Formato de imagem não permitido") {
        return res.status(400).json({ mensagem: err.message });
    }

    const statusCode = err.status || err.statusCode || 500;
    return res.status(statusCode).json({
        mensagem: statusCode === 500 ? "Erro interno do servidor." : (err.message || "Erro na requisição.")
    });
});

if (require.main === module) {
    const port = process.env.PORT || 3000
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`)
    })
}

module.exports = app