import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ImageOff } from 'lucide-react';

import { BLOCOS } from '../../utils/constantes';
import useCategorias from '../../hooks/useCategorias';
import useFiltrosDaUrl from '../../hooks/useFiltrosDaUrl';
import useImagensItens from '../../hooks/useImagensItens';
import { API, tokenSalvo } from '../../services/api';

import '../../styles/Inicio.css';

const STATUS = ['achado', 'perdido', 'devolvido'];

// Formata a data e hora para o padrão brasileiro
function formatarDataHora(iso) {
  if (!iso) return 'Data não informada';

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) {
    return 'Data inválida';
  }

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function Inicio() {
  const navigate = useNavigate();

  // Estados dos itens
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Filtros ficam na URL: /?busca=&categoria=&bloco=&data=&status=
  const [filtro, mudarFiltro] = useFiltrosDaUrl();
  const busca = filtro('busca');
  const categoria = filtro('categoria');
  const bloco = filtro('bloco');
  const data = filtro('data');
  const status = filtro('status');

  // Busca categorias e imagens
  const { categorias } = useCategorias();
  const imagens = useImagensItens(itens);

  // Busca os itens reais no backend
  useEffect(() => {
    const controller = new AbortController();

    async function carregarItens() {
      setCarregando(true);
      setErro('');

      try {
        const params = new URLSearchParams({
          busca,
          categoria,
          bloco,
          status
        });

        const resposta = await fetch(
          `${API}/itens?${params}`,
          {
            signal: controller.signal,
            // a lista completa (com o local) é só para admin
            headers: { Authorization: `Bearer ${tokenSalvo()}` }
          }
        );

        if (!resposta.ok) {
          throw new Error(
            `Erro HTTP: ${resposta.status}`
          );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
          throw new Error('Formato de dados inválido');
        }

        if (!controller.signal.aborted) {
          setItens(dados);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error('Erro ao carregar itens:', error);

        setErro('Não foi possível carregar os itens.');
        setItens([]);
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarItens();

    // Cancela a requisição anterior quando os filtros mudam
    return () => {
      controller.abort();
    };
  }, [busca, categoria, bloco, status]);

  // Filtra os itens por data no frontend
  const itensVisiveis = data
    ? itens.filter((item) => {
        if (!item.data_horario) return false;

        const dataItem = new Date(item.data_horario);

        if (Number.isNaN(dataItem.getTime())) {
          return false;
        }

        return (
          dataItem.toLocaleDateString('en-CA') === data
        );
      })
    : itens;

  return (
    <main className="inicio-conteudo">
      {/* Filtros */}
      <div className="inicio-filtros">
        <input
          type="search"
          placeholder="Buscar item..."
          value={busca}
          onChange={(e) => mudarFiltro('busca', e.target.value)}
        />

        <select
          value={categoria}
          onChange={(e) => mudarFiltro('categoria', e.target.value)}
        >
          <option value="">Categoria</option>

          {categorias.map((c) => (
            <option
              key={c.id_categoria}
              value={c.nome}
            >
              {c.nome}
            </option>
          ))}
        </select>

        <select
          value={bloco}
          onChange={(e) => mudarFiltro('bloco', e.target.value)}
        >
          <option value="">Bloco</option>

          {BLOCOS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={data}
          onChange={(e) => mudarFiltro('data', e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => mudarFiltro('status', e.target.value)}
        >
          <option value="">Status</option>

          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <p className="inicio-erro" role="alert">
          {erro}
        </p>
      )}

      {/* Estado de carregamento */}
      {carregando && (
        <p
          role="status"
          style={{
            textAlign: 'center',
            padding: '24px',
            color: '#64748b'
          }}
        >
          Carregando itens...
        </p>
      )}

      {/* Listagem de itens */}
      <div
        className="inicio-lista"
        aria-busy={carregando}
      >
        {!carregando &&
          !erro &&
          itensVisiveis.map((item) => (
            <article
              key={item.id_item}
              className="inicio-card"
              onClick={() => navigate(`/itens/${item.id_item}`)}
              style={{ cursor: 'pointer' }}
            >
              {imagens[item.id_item] ? (
                <img
                  className="inicio-foto"
                  src={imagens[item.id_item]}
                  alt={item.nome_objeto}
                />
              ) : (
                <div className="inicio-foto inicio-sem-foto">
                  <ImageOff size={32} />
                </div>
              )}

              <div className="inicio-card-corpo">
                <h3>{item.nome_objeto}</h3>

                <p>{item.local_encontrado}</p>

                <p>
                  {formatarDataHora(item.data_horario)}
                </p>

                <span
                  className={`inicio-status ${item.status}`}
                >
                  {item.status}
                </span>
              </div>
            </article>
          ))}

        {/* Nenhum resultado */}
        {!carregando &&
          !erro &&
          itensVisiveis.length === 0 && (
            <p>Nenhum item encontrado.</p>
          )}
      </div>
    </main>
  );
}

export default Inicio;
