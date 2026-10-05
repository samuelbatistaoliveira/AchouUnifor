const express = require("express")
const cors = require("cors")
const itensRoutes = require("./routes/itensRoutes")
const authRoutes = require("./routes/authRoutes")

const app = express()

app.use(cors())
app.use(express.json())
app.use(cors())

app.use("/itens", itensRoutes)
app.use("/auth", authRoutes)

app.get("/", (req, res) => {
    res.send("Backend do AchouUNIFOR funcionando!")
})

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000")
})