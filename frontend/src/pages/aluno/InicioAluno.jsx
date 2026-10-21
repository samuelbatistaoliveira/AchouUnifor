import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ImageOff } from 'lucide-react';
import useImagensItens from '../../hooks/useImagensItens';
import useCategorias from '../../hooks/useCategorias';
import useFiltrosDaUrl from '../../hooks/useFiltrosDaUrl';
import { buscar } from '../../services/api';
import '../../styles/Inicio.css';
import '../../styles/InicioAluno.css';

// "2026-12-25T12:03:01.000Z" -> "25/12/2026"
const formatarData = (iso) => new Date(iso).toLocaleDateString('pt-BR');

// Início do aluno: só itens perdidos e só o básico (o backend não manda local nem horário).
// Filtros ficam na URL: /?busca=&categoria=&data=
function InicioAluno() {
  const navigate = useNavigate();
  const [filtro, mudarFiltro] = useFiltrosDaUrl();
  const busca = filtro('busca');
  const categoria = filtro('categoria');
  const data = filtro('data');
  const [itens, setItens] = useState([]);
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
    <main className="inicio-conteudo">
      <div className="inicio-filtros">
        <input
          type="search"
          placeholder="Buscar item (ex.: garrafa, mochila, chave)"
          aria-label="Buscar item"
          value={busca}
          onChange={(e) => mudarFiltro('busca', e.target.value)}
        />
        <select aria-label="Categoria" value={categoria} onChange={(e) => mudarFiltro('categoria', e.target.value)}>
          <option value="">Categoria</option>
          {categorias.map((c) => <option key={c.id_categoria}>{c.nome}</option>)}
        </select>
        <input type="date" aria-label="Data" value={data} onChange={(e) => mudarFiltro('data', e.target.value)} />
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
              <button className="aluno-ver" onClick={() => navigate(`/itens/${item.id_item}`)}>Ver Item</button>
            </div>
          </article>
        ))}
        {itensVisiveis.length === 0 && !erro && <p>Nenhum item perdido encontrado.</p>}
      </div>
    </main>
  );
}

export default InicioAluno;
