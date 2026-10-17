import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import Topbar from './components/Topbar';
import { CATEGORIAS, BLOCOS } from './constantes';
import useImagensItens from './useImagensItens';
import './Inicio.css';
import DetalhesItem from './DetalhesItem';
import Notificacoes from './Notificacoes';

const STATUS = ['achado', 'perdido', 'devolvido'];

// "2026-12-25T12:03:01.000Z" -> "25/12/2026 12:03"
function formatarDataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function Inicio({ aoAbrirPerfil, aoNavegar }) {
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [itens, setItens] = useState([]);
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

  const imagens = useImagensItens(itens);

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
      <Topbar ativo="inicio" aoNavegar={aoNavegar} aoAbrirPerfil={aoAbrirPerfil} />

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