import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import logoUnifor from './assets/logo-achouunifor.png';
import useImagensItens from './useImagensItens';
import useCategorias from './useCategorias';
import { buscar } from './api';
import './Inicio.css';
import './InicioAluno.css';

// "2026-12-25T12:03:01.000Z" -> "25/12/2026"
const formatarData = (iso) => new Date(iso).toLocaleDateString('pt-BR');

// Tela inicial do aluno: só itens perdidos e só o básico (o backend não manda local nem descrição)
function InicioAluno({ aoSair }) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const imagens = useImagensItens(itens);
  const { categorias } = useCategorias();

  useEffect(() => {
    const params = new URLSearchParams({ busca, categoria });
    buscar(`/itens/perdidos?${params}`)
      .then((dados) => { setItens(dados); setErro(''); })
      .catch((e) => setErro(e.message || 'Não foi possível carregar os itens.'));
  }, [busca, categoria]);

  // o backend não filtra por data: comparamos só o dia
  const itensVisiveis = data
    ? itens.filter((i) => new Date(i.data_horario).toLocaleDateString('en-CA') === data)
    : itens;

  return (
    <div className="inicio">
      <header className="inicio-topbar">
        <button className="logo-botao" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Ir para o início">
          <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />
        </button>
        <button className="aluno-sair" onClick={aoSair}>Sair</button>
      </header>

      <main className="inicio-conteudo">
        <div className="inicio-filtros">
          <input
            type="search"
            placeholder="Buscar item..."
            aria-label="Buscar item"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select aria-label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Categoria</option>
            {categorias.map((c) => <option key={c.id_categoria}>{c.nome}</option>)}
          </select>
          <input type="date" aria-label="Data" value={data} onChange={(e) => setData(e.target.value)} />
        </div>

        {erro && <p className="inicio-erro">{erro}</p>}

        <div className="inicio-lista">
          {itensVisiveis.map((item) => (
            <article key={item.id_item} className="inicio-card">
              {imagens[item.id_item] ? (
                <img className="inicio-foto" src={imagens[item.id_item]} alt={item.nome_objeto} />
              ) : (
                <div className="inicio-foto inicio-sem-foto"><ImageOff size={32} /></div>
              )}
              <div className="inicio-card-corpo">
                <h3>{item.nome_objeto}</h3>
                <p>{item.categoria}</p>
                <p>{formatarData(item.data_horario)}</p>
              </div>
            </article>
          ))}
          {itensVisiveis.length === 0 && !erro && <p>Nenhum item perdido encontrado.</p>}
        </div>
      </main>
    </div>
  );
}

export default InicioAluno;
