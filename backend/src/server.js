const express = require("express")
const cors = require("cors")
const itensRoutes = require("./routes/itensRoutes")
const authRoutes = require("./routes/authRoutes")
const usuariosRoutes = require("./routes/usuariosRoutes")
const imagensRoutes = require("./routes/imagensRoutes")
const categoriasRoutes = require("./routes/categoriasRoutes")
const denunciasRoutes = require("./routes/denunciasRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/itens", itensRoutes)
app.use("/auth", authRoutes)
app.use("/usuarios", usuariosRoutes)
app.use("/imagens", imagensRoutes)
app.use("/categorias", categoriasRoutes)
app.use("/denuncias", denunciasRoutes)

app.get("/", (req, res) => {
    res.send("Backend do AchouUNIFOR funcionando!")
})

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000")
})