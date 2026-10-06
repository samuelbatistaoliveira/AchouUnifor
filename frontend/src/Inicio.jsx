import { useEffect, useState } from 'react';
import { User, ImageOff } from 'lucide-react';
import logoUnifor from './assets/logo-achouunifor.png';
import './Inicio.css';

const CATEGORIAS = ['Caderno', 'Chave', 'Documento', 'Eletrônico', 'Garrafa', 'Mochila', 'Outros', 'Roupa'];
const BLOCOS = ['Bloco A', 'Bloco B', 'Bloco D', 'Bloco M', 'Biblioteca'];
const STATUS = ['achado', 'perdido', 'devolvido'];

// "2026-12-25T12:03:01.000Z" -> "25/12/2026 12:03"
function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function Inicio({ aoSair }) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [bloco, setBloco] = useState('');
  const [data, setData] = useState('');
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ busca, categoria, bloco, status });
    fetch(`http://localhost:3000/itens?${params}`)
      .then((r) => r.json())
      .then((dados) => { setItens(dados); setErro(''); })
      .catch(() => setErro('Não foi possível carregar os itens.'));
  }, [busca, categoria, bloco, status]);

  // o backend ainda não filtra por data: comparamos só o dia, ignorando a hora
  const itensVisiveis = data
    ? itens.filter((i) => new Date(i.data_horario).toLocaleDateString('en-CA') === data)
    : itens;

  return (
    <div className="inicio">
      <header className="inicio-topbar">
        <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />

        <div className="inicio-direita">
          <nav className="inicio-menu">
            <button className="ativo">Início</button>
            <button>Gerenciar Item</button>
            <button>Notificações</button>
            <button>Painel Adm.</button>
          </nav>
          {/* temporário: o perfil ainda não existe, então o ícone faz o logout */}
          <button className="inicio-perfil" onClick={aoSair} aria-label="Perfil">
            <User size={22} />
          </button>
        </div>
      </header>

      <main className="inicio-conteudo">
        <div className="inicio-filtros">
          <input
            type="search"
            placeholder="Buscar item..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Categoria</option>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={bloco} onChange={(e) => setBloco(e.target.value)}>
            <option value="">Bloco</option>
            {BLOCOS.map((b) => <option key={b}>{b}</option>)}
          </select>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {erro && <p className="inicio-erro">{erro}</p>}

        <div className="inicio-lista">
          {itensVisiveis.map((item) => (
            <article key={item.id_item} className="inicio-card">
              {/* "foto" é o nome provisório da coluna; troque quando ela existir no banco */}
              {item.foto ? (
                <img className="inicio-foto" src={item.foto} alt={item.nome_objeto} />
              ) : (
                <div className="inicio-foto inicio-sem-foto"><ImageOff size={32} /></div>
              )}
              <div className="inicio-card-corpo">
                <h3>{item.nome_objeto}</h3>
                <p>{item.local_encontrado}</p>
                <p>{formatarDataHora(item.data_horario)}</p>
                <span className={`inicio-status ${item.status}`}>{item.status}</span>
              </div>
            </article>
          ))}
          {itensVisiveis.length === 0 && !erro && <p>Nenhum item encontrado.</p>}
        </div>
      </main>
    </div>
  );
}

export default Inicio;
