const itens = [
  { id: 1, nomeObjeto: "Garrafa Térmica", categoria: "Garrafa", bloco: "Bloco A", data: "12/09/2026", status: "Achado" },
  { id: 2, nomeObjeto: "Mochila Preta", categoria: "Mochila", bloco: "Bloco M", data: "16/09/2026", status: "Perdido" },
  { id: 3, nomeObjeto: "Chaves com chaveiro", categoria: "Chave", bloco: "Biblioteca", data: "12/09/2026", status: "Achado" },
  { id: 4, nomeObjeto: "Carregador USB-C", categoria: "Carregador", bloco: "Bloco D", data: "12/09/2026", status: "Achado" },
  { id: 5, nomeObjeto: "Caderno Azul", categoria: "Caderno", bloco: "Bloco B", data: "16/09/2026", status: "Devolvido" },
  { id: 6, nomeObjeto: "Óculos de grau", categoria: "Óculos", bloco: "Biblioteca F", data: "12/09/2026", status: "Perdido" },
];

function getItens(req, res) {
  const { busca, categoria, bloco, status } = req.query;

  let resultado = itens;

  if (busca) {
    resultado = resultado.filter((item) =>
      item.nomeObjeto.toLowerCase().includes(busca.toLowerCase())
    );
  }

  if (categoria) {
    resultado = resultado.filter((item) => item.categoria === categoria);
  }

  if (bloco) {
    resultado = resultado.filter((item) => item.bloco === bloco);
  }

  if (status) {
    resultado = resultado.filter((item) => item.status === status);
  }

  res.json(resultado);
}

module.exports = { getItens };