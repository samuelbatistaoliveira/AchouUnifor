import { useEffect, useState } from 'react';
import './Inicio.css';

function Inicio({ aoSair }) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');

  // roda de novo sempre que busca ou status mudam
  useEffect(() => {
    const params = new URLSearchParams({ busca, status });
    fetch(`http://localhost:3000/itens?${params}`)
      .then((r) => r.json())
      .then((dados) => { setItens(dados); setErro(''); })
      .catch(() => setErro('Não foi possível carregar os itens.'));
  }, [busca, status]);

  return (
    <div className="inicio">
      <header className="inicio-topo">
        <h1>AchouUNIFOR</h1>
        <button onClick={aoSair}>Sair</button>
      </header>

      <div className="inicio-filtros">
        <input
          type="search"
          placeholder="Buscar item..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="Achado">Achado</option>
          <option value="Perdido">Perdido</option>
          <option value="Devolvido">Devolvido</option>
        </select>
      </div>

      {erro && <p className="inicio-erro">{erro}</p>}

      <div className="inicio-lista">
        {itens.map((item) => (
          <div key={item.id} className="inicio-card">
            <strong>{item.nomeObjeto}</strong>
            <span>{item.categoria} · {item.bloco}</span>
            <span>{item.data}</span>
            <span className={`inicio-status ${item.status}`}>{item.status}</span>
          </div>
        ))}
        {itens.length === 0 && !erro && <p>Nenhum item encontrado.</p>}
      </div>
    </div>
  );
}

export default Inicio;
