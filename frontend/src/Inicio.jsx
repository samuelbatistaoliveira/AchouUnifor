import { useEffect, useState } from 'react';
import { User, ImageOff } from 'lucide-react';
import logoUnifor from './assets/logo-achouunifor.png';
import './Inicio.css';
import DetalhesItem from './DetalhesItem';
import Notificacoes from './Notificacoes';

const CATEGORIAS = ['Caderno', 'Chave', 'Documento', 'Eletrônico', 'Garrafa', 'Mochila', 'Outros', 'Roupa'];
const BLOCOS = ['Bloco A', 'Bloco B', 'Bloco D', 'Bloco M', 'Biblioteca'];
const STATUS = ['achado', 'perdido', 'devolvido'];

// "2026-12-25T12:03:01.000Z" -> "25/12/2026 12:03"
function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function Inicio({ aoAbrirPerfil }) {
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
  const [imagens, setImagens] = useState({});
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [bloco, setBloco] = useState('');
  const [data, setData] = useState('');
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

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

  // 1. Se o estado de notificações for verdadeiro, mostra a tela de notificações
  if (mostrarNotificacoes) {
    return <Notificacoes aoVoltar={() => setMostrarNotificacoes(false)} />;
  }

  // 2. Se houver um item selecionado, exibe a tela de detalhes com a função de notificações ativada
  if (itemSelecionado) {
    return (
      <DetalhesItem
        item={itemSelecionado}
        aoVoltar={() => setItemSelecionado(null)}
        aoAbrirNotificacoes={() => {
          setItemSelecionado(null); // Fecha a tela de detalhes
          setMostrarNotificacoes(true); // Abre a tela de notificações
        }}
      />
    );
  }

  return (
    <div className="inicio">
      <header className="inicio-topbar">
        {/* já é a tela inicial: a logo só volta ao topo da lista */}
        <button className="logo-botao" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Ir para o início">
          <img className="inicio-logo" src={logoUnifor} alt="AchouUNIFOR" />
        </button>

        <div className="inicio-direita">
          <nav className="inicio-menu">
            <button className="ativo">Início</button>
            <button>Gerenciar Item</button>
            <button>Notificações</button>
            <button>Painel Adm.</button>
          </nav>
          <button className="inicio-perfil" onClick={aoAbrirPerfil} aria-label="Perfil">
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
            <article
              key={item.id_item}
              className="inicio-card"
              onClick={() => setItemSelecionado(item)}
              style={{ cursor: 'pointer' }}
            >
              {imagens[item.id_item] ? (
                <img className="inicio-foto" src={imagens[item.id_item]} alt={item.nome_objeto} />
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