const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend do AchouUNIFOR funcionando!");
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    console.log("Email recebido:", email);
    console.log("Senha recebida:", senha);

    res.json({
        mensagem: "Dados do login recebidos!"
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});

