import { useEffect, useRef, useState } from 'react';
import { ImageOff, X } from 'lucide-react';
import Topbar from './components/Topbar';
import Perfil from './Perfil';
import DenunciarItem from './DenunciarItem';
import useImagensItens from './useImagensItens';
import useCategorias from './useCategorias';
import { buscar } from './api';
import './Inicio.css';
import './InicioAluno.css';

// notificações ainda não tem tela (o Topbar ignora o clique)
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
  const [itemDenunciado, setItemDenunciado] = useState('');
  const dialogo = useRef(null);
  const imagens = useImagensItens(itens);
  const { categorias } = useCategorias();

  useEffect(() => {
    const params = new URLSearchParams({ busca, categoria });
    buscar(`/itens/perdidos?${params}`)
      .then((dados) => { setItens(dados); setErro(''); })
      .catch((e) => setErro(e.message || 'Não foi possível carregar os itens.'));
  }, [busca, categoria]);

  // <dialog> nativo: Esc fecha e o foco fica preso nele
  useEffect(() => {
    if (itemAberto) dialogo.current?.showModal();
  }, [itemAberto]);

  function navegar(destino, idItem = '') {
    setItemAberto(null);
    setItemDenunciado(idItem);
    setTela(destino);
  }

  if (tela === 'perfil') {
    return <Perfil aoVoltar={() => navegar('inicio')} aoSair={aoSair} aoAbrirDenuncias={() => navegar('denunciar')} />;
  }

  const topbar = <Topbar ativo={tela} menu={MENU_ALUNO} aoNavegar={navegar} aoAbrirPerfil={() => navegar('perfil')} />;

  if (tela === 'denunciar') {
    return (
      <div className="inicio">
        {topbar}
        <DenunciarItem key={itemDenunciado} idInicial={itemDenunciado} />
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

      <dialog ref={dialogo} className="aluno-detalhe" onClose={() => setItemAberto(null)} aria-labelledby="aluno-detalhe-nome">
        {itemAberto && (
          <>
            <button className="aluno-fechar" onClick={() => dialogo.current.close()} aria-label="Fechar">
              <X size={20} />
            </button>
            {imagens[itemAberto.id_item] ? (
              <img className="inicio-foto" src={imagens[itemAberto.id_item]} alt={itemAberto.nome_objeto} />
            ) : (
              <div className="inicio-foto inicio-sem-foto"><ImageOff size={40} /></div>
            )}
            <div className="aluno-detalhe-corpo">
              <h2 id="aluno-detalhe-nome">{itemAberto.nome_objeto}</h2>
              <p className="aluno-detalhe-info">{itemAberto.categoria} · {formatarData(itemAberto.data_horario)}</p>
              <p>{itemAberto.descricao || 'Sem descrição.'}</p>
              <button className="aluno-denunciar" onClick={() => navegar('denunciar', itemAberto.id_item)}>
                Denunciar
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

export default InicioAluno;
