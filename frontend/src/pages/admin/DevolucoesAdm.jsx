import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle,
  Clock,
  RotateCcw,
  Search,
  ImageOff,
  PackageCheck,
  TrendingUp,
  ExternalLink,
  X,
} from 'lucide-react';
import { buscar, enviar } from '../../services/api';

// "2026-09-12T10:00:00.000Z" -> "12/09/2026"
const dataFormatada = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const diaMes = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

function DevolucoesAdm() {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('devolvidos'); // 'devolvidos' | 'pendentes'
  const [busca, setBusca] = useState('');
  const [ocupadoId, setOcupadoId] = useState(null);

  // Modal de confirmação de devolução
  const [modalItem, setModalItem] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await buscar('/itens');
      setItens(Array.isArray(dados) ? dados : []);
      setErro('');
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar os itens.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Altera o status do item (para 'devolvido' ou 'achado')
  async function alterarStatusItem(item, novoStatus) {
    setOcupadoId(item.id_item);
    setErro('');
    setSucesso('');

    const falha = await enviar(`/itens/${item.id_item}/status`, 'PATCH', { status: novoStatus });
    setOcupadoId(null);

    if (falha) {
      setErro(falha);
      return false;
    }

    setItens((atuais) =>
      atuais.map((i) => (i.id_item === item.id_item ? { ...i, status: novoStatus } : i))
    );

    const msg =
      novoStatus === 'devolvido'
        ? `O item "${item.nome_objeto}" foi marcado como devolvido com sucesso!`
        : `A devolução do item "${item.nome_objeto}" foi desfeita (status: Achado).`;
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 5000);
    return true;
  }

  // Executa devolução via modal
  async function confirmarDevolucaoModal() {
    if (!modalItem) return;
    const ok = await alterarStatusItem(modalItem, 'devolvido');
    if (ok) setModalItem(null);
  }

  // Desfazer devolução (volta para achado)
  async function desfazerDevolucao(item) {
    if (
      !window.confirm(
        `Desfazer a devolução de "${item.nome_objeto}"? O item voltará ao status "Achado" no sistema.`
      )
    ) {
      return;
    }
    await alterarStatusItem(item, 'achado');
  }

  // Métricas memoizadas (evita refiltrar ao abrir/fechar modal de confirmação)
  const devolvidos = useMemo(() => itens.filter((i) => i.status === 'devolvido'), [itens]);
  const achados = useMemo(() => itens.filter((i) => i.status === 'achado'), [itens]);
  const totalProcessados = devolvidos.length + achados.length;
  const taxaDevolucao =
    totalProcessados > 0 ? Math.round((devolvidos.length / totalProcessados) * 100) : 0;

  // Filtragem memoizada
  const termo = busca.trim().toLowerCase();
  const itensExibidos = useMemo(() => {
    const base = abaAtiva === 'devolvidos' ? devolvidos : achados;
    if (!termo) return base;
    return base.filter(
      (i) =>
        (i.nome_objeto || '').toLowerCase().includes(termo) ||
        (i.categoria || '').toLowerCase().includes(termo) ||
        (i.local_encontrado || '').toLowerCase().includes(termo)
    );
  }, [abaAtiva, devolvidos, achados, termo]);

  return (
    <>
      <div className="pa-cabecalho">
        <div>
          <h1 className="pa-titulo">Gestão de Devoluções</h1>
          <p className="pa-subtitulo">
            Acompanhe a entrega de pertences recuperados e gerencie o histórico de devoluções aos proprietários.
          </p>
        </div>
        <button
          className="pa-novo"
          onClick={() => {
            setAbaAtiva('pendentes');
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        >
          + Devolver Objeto
        </button>
      </div>

      {erro && <p className="pa-erro" role="alert">{erro}</p>}
      {sucesso && <p className="pa-sucesso" role="status">{sucesso}</p>}

      {/* Cartões de Indicadores (KPIs) */}
      <div className="dev-cards-grid">
        <div className="dev-kpi-card dev-kpi-sucesso">
          <div className="dev-kpi-icone">
            <PackageCheck size={28} />
          </div>
          <div className="dev-kpi-conteudo">
            <span className="dev-kpi-label">Devoluções Concluídas</span>
            <strong className="dev-kpi-valor">{devolvidos.length}</strong>
            <span className="dev-kpi-meta">Pertences entregues aos donos</span>
          </div>
        </div>

        <div className="dev-kpi-card dev-kpi-alerta">
          <div className="dev-kpi-icone">
            <Clock size={28} />
          </div>
          <div className="dev-kpi-conteudo">
            <span className="dev-kpi-label">Aguardando Retirada</span>
            <strong className="dev-kpi-valor">{achados.length}</strong>
            <span className="dev-kpi-meta">Objetos em posse da administração</span>
          </div>
        </div>

        <div className="dev-kpi-card dev-kpi-azul">
          <div className="dev-kpi-icone">
            <TrendingUp size={28} />
          </div>
          <div className="dev-kpi-conteudo">
            <span className="dev-kpi-label">Taxa de Devolução</span>
            <strong className="dev-kpi-valor">{taxaDevolucao}%</strong>
            <span className="dev-kpi-meta">De itens achados que foram recuperados</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro e Abas */}
      <div className="dev-controles-topo">
        <div className="dev-abas">
          <button
            type="button"
            className={`dev-aba ${abaAtiva === 'devolvidos' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('devolvidos')}
          >
            <CheckCircle size={16} />
            Histórico de Devolvidos ({devolvidos.length})
          </button>
          <button
            type="button"
            className={`dev-aba ${abaAtiva === 'pendentes' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('pendentes')}
          >
            <Clock size={16} />
            Prontos para Devolução ({achados.length})
          </button>
        </div>

        <label className="pu-busca dev-busca">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por nome, categoria ou local..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </div>

      {/* Tabela de Itens */}
      <table className="pa-tabela">
        <thead>
          <tr>
            <th>Item</th>
            <th>Categoria</th>
            <th>Local onde foi achado</th>
            <th>Data do Registro</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {itensExibidos.map((item) => (
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
                    <span className="pa-sem-foto">
                      <ImageOff size={18} />
                    </span>
                  )}
                  <strong>{item.nome_objeto}</strong>
                </div>
              </td>
              <td>{item.categoria}</td>
              <td>{item.local_encontrado || 'Não especificado'}</td>
              <td>
                <span title={`Cadastrado em: ${dataFormatada(item.data_horario)}`}>
                  {diaMes(item.data_horario)}
                </span>
              </td>
              <td>
                <span className={`inicio-status ${item.status}`}>
                  {item.status === 'devolvido' ? 'Devolvido' : 'Achado'}
                </span>
              </td>
              <td>
                <div className="pa-acoes">
                  <button
                    className="pa-editar"
                    onClick={() => navigate(`/itens/${item.id_item}`)}
                    title="Ver página de detalhes do item"
                  >
                    <ExternalLink size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Detalhes
                  </button>

                  {item.status === 'devolvido' ? (
                    <button
                      className="dev-btn-desfazer"
                      onClick={() => desfazerDevolucao(item)}
                      disabled={ocupadoId === item.id_item}
                      title="Voltar o item para o status Achado"
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Desfazer
                    </button>
                  ) : (
                    <button
                      className="pa-devolver"
                      onClick={() => setModalItem(item)}
                      disabled={ocupadoId === item.id_item}
                    >
                      {ocupadoId === item.id_item ? 'Salvando...' : 'Devolver'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!carregando && itensExibidos.length === 0 && !erro && (
        <div className="pa-vazio-card">
          <p className="pa-vazio">
            {termo
              ? 'Nenhum item encontrado para esta busca.'
              : abaAtiva === 'devolvidos'
              ? 'Nenhum item devolvido registrado ainda.'
              : 'Não há itens aguardando devolução no momento.'}
          </p>
        </div>
      )}

      {/* Modal de Confirmação de Devolução */}
      {modalItem && (
        <div className="dev-modal-overlay" onClick={() => setModalItem(null)} role="dialog" aria-modal="true">
          <div className="dev-modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="dev-modal-cabecalho">
              <h2>Confirmar Devolução</h2>
              <button
                className="dev-modal-fechar"
                onClick={() => setModalItem(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="dev-modal-corpo">
              <div className="dev-modal-item-info">
                {modalItem.imagem_url || modalItem.foto ? (
                  <img src={modalItem.imagem_url || modalItem.foto} alt="" className="dev-modal-foto" />
                ) : (
                  <div className="dev-modal-sem-foto">
                    <ImageOff size={24} />
                  </div>
                )}
                <div>
                  <h3 className="dev-modal-nome">{modalItem.nome_objeto}</h3>
                  <p className="dev-modal-detalhe">
                    <strong>Categoria:</strong> {modalItem.categoria}
                  </p>
                  <p className="dev-modal-detalhe">
                    <strong>Local onde foi achado:</strong> {modalItem.local_encontrado}
                  </p>
                  <p className="dev-modal-detalhe">
                    <strong>Registrado em:</strong> {dataFormatada(modalItem.data_horario)}
                  </p>
                </div>
              </div>

              <div className="dev-modal-aviso">
                <CheckCircle size={20} />
                <p>
                  Ao confirmar, o status deste item será atualizado para <strong>Devolvido</strong>,
                  e ele sairá da lista pública de itens perdidos e achados.
                </p>
              </div>
            </div>

            <div className="dev-modal-rodape">
              <button
                type="button"
                className="pa-editar"
                onClick={() => setModalItem(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="pa-devolver"
                disabled={ocupadoId === modalItem.id_item}
                onClick={confirmarDevolucaoModal}
              >
                {ocupadoId === modalItem.id_item ? 'Registrando...' : 'Confirmar Devolução'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DevolucoesAdm;
