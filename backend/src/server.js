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

const origensPermitidas = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Permite ferramentas sem header Origin (como k6/curl) e o frontend configurado
        if (!origin || origensPermitidas.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error("Origem não permitida pelo CORS."))
    }
}))
app.use(express.json({ limit: "100kb" }))

app.use("/itens", itensRoutes)
app.use("/auth", authRoutes)
app.use("/usuarios", usuariosRoutes)
app.use("/imagens", imagensRoutes)
app.use("/categorias", categoriasRoutes)
app.use("/denuncias", denunciasRoutes)
app.use("/notificacoes", notificacoesRoutes)
app.use("/relatorios", relatoriosRoutes)

app.get("/", (req, res) => {
    res.send("Backend do AchouUNIFOR funcionando!")
})

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

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000")
})
