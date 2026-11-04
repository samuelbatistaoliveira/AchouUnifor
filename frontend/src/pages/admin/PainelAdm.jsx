import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { buscar, enviar } from '../../services/api';
import '../../styles/PainelAdm.css';

const CategoriasAdm = lazy(() => import('./CategoriasAdm'));
const UsuariosAdm = lazy(() => import('./UsuariosAdm'));
const DenunciasAdm = lazy(() => import('./DenunciasAdm'));
const DevolucoesAdm = lazy(() => import('./DevolucoesAdm'));
const RelatoriosAdm = lazy(() => import('./RelatoriosAdm'));

// cada seção tem rota própria: /painel/itens, /painel/usuarios...
const SECOES = {
  itens: 'Itens',
  usuarios: 'Usuários',
  categorias: 'Categorias',
  devolucoes: 'Devoluções',
  relatorios: 'Relatórios',
  denuncias: 'Denúncias',
};

// "2026-09-12T10:00:00.000Z" -> "12/09"
const diaMes = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

function PainelAdm() {
  const { secao } = useParams();
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState('');
  const [devolvendo, setDevolvendo] = useState(null);

  useEffect(() => {
    if (secao !== 'itens') return;

    buscar('/itens')
      .then((dados) => {
        const lista = Array.isArray(dados) ? dados : [];
        // mais recentes primeiro
        setItens([...lista].sort((a, b) => new Date(b.data_horario) - new Date(a.data_horario)));
        setErro('');
      })
      .catch((e) => setErro(e.message || 'Não foi possível carregar os itens.'));
  }, [secao]);

  async function devolver(item) {
    setDevolvendo(item.id_item);
    setErro('');

    const falha = await enviar(`/itens/${item.id_item}/status`, 'PATCH', { status: 'devolvido' });
    setDevolvendo(null);

    if (falha) {
      setErro(falha);
      return;
    }

    setItens((atuais) =>
      atuais.map((i) => (i.id_item === item.id_item ? { ...i, status: 'devolvido' } : i))
    );
  }

  if (!SECOES[secao]) return <Navigate to="/painel/itens" replace />;

  return (
    <div className="pa-layout">
      <aside className="pa-lateral">
        <h2>Painel Administrativo</h2>
        <nav className="pa-secoes">
          {Object.entries(SECOES).map(([chave, rotulo]) => (
            <Link
              key={chave}
              to={`/painel/${chave}`}
              className={chave === secao ? 'ativo' : undefined}
              aria-current={chave === secao ? 'page' : undefined}
            >
              {rotulo}
            </Link>
          ))}
        </nav>
        <Link to="/" className="pa-voltar">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
      </aside>

      <main className="pa-conteudo">
        <Suspense fallback={<p className="pa-vazio">Carregando seção...</p>}>
          {secao === 'categorias' ? (
            <CategoriasAdm />
          ) : secao === 'usuarios' ? (
            <UsuariosAdm />
          ) : secao === 'denuncias' ? (
            <DenunciasAdm />
          ) : secao === 'devolucoes' ? (
            <DevolucoesAdm />
          ) : secao === 'relatorios' ? (
            <RelatoriosAdm />
          ) : (
            <>
              <div className="pa-cabecalho">
                <h1 className="pa-titulo">Gerenciar item</h1>
                <button className="pa-novo" onClick={() => navigate('/gerenciar')}>+ Novo Item</button>
              </div>

              {erro && <p className="pa-erro" role="alert">{erro}</p>}

              <table className="pa-tabela">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id_item}>
                      <td>
                        <div className="pa-item">
                          {item.imagem_url || item.foto ? (
                            <img
                              src={item.imagem_url || item.foto}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="pa-sem-foto"><ImageOff size={18} /></span>
                          )}
                          <strong>{item.nome_objeto}</strong>
                        </div>
                      </td>
                      <td>{item.categoria}</td>
                      <td><span className={`inicio-status ${item.status}`}>{item.status}</span></td>
                      <td>{diaMes(item.data_horario)}</td>
                      <td>
                        <div className="pa-acoes">
                          <button className="pa-editar" onClick={() => navigate(`/gerenciar/${item.id_item}`)}>Editar</button>
                          <button
                            className="pa-devolver"
                            onClick={() => devolver(item)}
                            disabled={item.status === 'devolvido' || devolvendo === item.id_item}
                          >
                            {devolvendo === item.id_item ? '...' : 'Devolver'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {itens.length === 0 && !erro && <p className="pa-vazio">Nenhum item cadastrado.</p>}
            </>
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default PainelAdm;
