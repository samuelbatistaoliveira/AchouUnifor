
import { useEffect, useState } from 'react';
import './Inicio.css';

function Inicio({ aoSair }) {
  const [itens, setItens] = useState([]);
  const [imagens, setImagens] = useState({});
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');

  // Busca os itens no backend
  useEffect(() => {
    const params = new URLSearchParams({ busca, status });

    fetch(`http://localhost:3000/itens?${params}`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error('Erro ao buscar itens');
        }
        return resposta.json();
      })
      .then((dados) => {
        setItens(dados);
        setErro('');
      })
      .catch(() => {
        setErro('Não foi possível carregar os itens.');
      });
  }, [busca, status]);

  // Busca as imagens dos itens no Supabase por meio do backend
  useEffect(() => {
    let cancelado = false;

    async function carregarImagens() {
      const token = localStorage.getItem('token');

      if (!token) return;

      const resultados = await Promise.all(
        itens.map(async (item) => {
          try {
            const resposta = await fetch(
              `http://localhost:3000/imagens/item/${item.id_item}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (!resposta.ok) {
              return [item.id_item, null];
            }

            const dados = await resposta.json();

            return [
              item.id_item,
              dados.imagens?.[0]?.url ?? null
            ];
          } catch {
            return [item.id_item, null];
          }
        })
      );

      if (!cancelado) {
        setImagens(Object.fromEntries(resultados));
      }
    }

    carregarImagens();

    return () => {
      cancelado = true;
    };
  }, [itens]);

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

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="achado">Achado</option>
          <option value="perdido">Perdido</option>
          <option value="devolvido">Devolvido</option>
        </select>
      </div>

      {erro && <p className="inicio-erro">{erro}</p>}

      <div className="inicio-lista">
        {itens.map((item) => (
          <div key={item.id_item} className="inicio-card">

            {imagens[item.id_item] && (
              <img
                src={imagens[item.id_item]}
                alt={item.nome_objeto}
                className="inicio-imagem"
              />
            )}

            <strong>{item.nome_objeto}</strong>

            <span>
              {item.categoria} · {item.local_encontrado}
            </span>

            <span>
              {new Date(item.data_horario).toLocaleDateString('pt-BR')}
            </span>

            <span className={`inicio-status ${item.status}`}>
              {item.status}
            </span>
          </div>
        ))}

        {itens.length === 0 && !erro && (
          <p>Nenhum item encontrado.</p>
        )}
      </div>
    </div>
  );
}

export default Inicio;
