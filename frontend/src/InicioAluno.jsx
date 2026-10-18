import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import Topbar from './components/Topbar';
import Perfil from './Perfil';
import DenunciarItem from './DenunciarItem';
import DetalhesItem from './DetalhesItem';
import useImagensItens from './useImagensItens';
import useCategorias from './useCategorias';
import { buscar } from './api';
import './Inicio.css';
import './InicioAluno.css';

// notificações ainda não tem tela para o aluno (sem aoAbrirNotificacoes o clique não faz nada)
const MENU_ALUNO = [
  ['inicio', 'Início'],
  ['denunciar', 'Denunciar'],
  ['notificacoes', 'Notificações'],
];

// "2026-12-25T12:03:01.000Z" -> "25/12/2026"
const formatarData = (iso) => new Date(iso).toLocaleDateString('pt-BR');

// Área do aluno: só itens perdidos e só o básico (o backend não manda local nem horário)
function InicioAluno({ aoSair }) {
  const [tela, setTela] = useState('inicio');
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState('');
  const [erro, setErro] = useState('');
  const [itemAberto, setItemAberto] = useState(null);
  const imagens = useImagensItens(itens);
  const { categorias } = useCategorias();

  useEffect(() => {
    const params = new URLSearchParams({ busca, categoria });
    buscar(`/itens/perdidos?${params}`)
      .then((dados) => { setItens(dados); setErro(''); })
      .catch((e) => setErro(e.message || 'Não foi possível carregar os itens.'));
  }, [busca, categoria]);

  function navegar(destino) {
    setItemAberto(null);
    setTela(destino);
  }

  if (tela === 'perfil') {
    return <Perfil aoVoltar={() => navegar('inicio')} aoSair={aoSair} aoAbrirDenuncias={() => navegar('denunciar')} />;
  }

  const topbar = <Topbar ativo={tela} menu={MENU_ALUNO} aoNavegar={navegar} aoAbrirPerfil={() => navegar('perfil')} />;

  // mesma tela de detalhes do admin; ela não mostra o local
  if (itemAberto) return <DetalhesItem item={itemAberto} aoVoltar={() => setItemAberto(null)} topbar={topbar} />;

  if (tela === 'denunciar') {
    return (
      <div className="inicio">
        {topbar}
        <DenunciarItem />
      </div>
    );
  }

  // o backend não filtra por data: comparamos só o dia
  const itensVisiveis = data
    ? itens.filter((i) => new Date(i.data_horario).toLocaleDateString('en-CA') === data)
    : itens;

  return (
    <div className="inicio">
      {topbar}

      <main className="inicio-conteudo">
        <div className="inicio-filtros">
          <input
            type="search"
            placeholder="Buscar item (ex.: garrafa, mochila, chave)"
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
                <p>{item.categoria} · {formatarData(item.data_horario)}</p>
                <button className="aluno-ver" onClick={() => setItemAberto(item)}>Ver Item</button>
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
