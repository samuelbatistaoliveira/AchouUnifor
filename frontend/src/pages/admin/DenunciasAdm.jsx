import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ImageOff, Search, Phone, Mail, PlusCircle, Trash2 } from 'lucide-react';
import { buscar, enviar } from '../../services/api';
import { STATUS_DENUNCIA } from '../../utils/constantes';

// "2026-09-12T10:00:00.000Z" -> "12/09"
const diaMes = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—');
// "2026-09-12T14:30:00.000Z" -> "12/09/2026 14:30"
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const FILTROS_STATUS = [
  ['todas', 'Todas'],
  ['perdido', 'Perdidos'],
  ['encontrado', 'Encontrados'],
  ['devolvido', 'Devolvidos'],
];

function DenunciasAdm() {
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState(null); // id_denuncia em "Ver"
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(
    () =>
      buscar('/denuncias')
        .then((dados) => {
          setDenuncias(Array.isArray(dados) ? dados : []);
        })
        .catch((e) => setErro(e.message || 'Não foi possível carregar as denúncias.')),
    []
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(d, status) {
    setOcupado(true);
    setErro('');
    setSucesso('');
    const falha = await enviar(`/denuncias/${d.id_denuncia}/status`, 'PATCH', { status });
    setOcupado(false);
    if (falha) return setErro(falha);

    setDenuncias((atuais) =>
      atuais.map((x) => (x.id_denuncia === d.id_denuncia ? { ...x, status } : x))
    );
    setSucesso(`Status da denúncia "${d.nome_objeto}" atualizado para ${STATUS_DENUNCIA[status] || status}.`);
    setTimeout(() => setSucesso(''), 4000);
  }

  async function remover(d) {
    if (!window.confirm(`Tem certeza que deseja remover a denúncia de "${d.nome_objeto}" feita por ${d.aluno || 'aluno'}?`)) {
      return;
    }
    setOcupado(true);
    setErro('');
    const falha = await enviar(`/denuncias/${d.id_denuncia}`, 'DELETE');
    setOcupado(false);
    if (falha) return setErro(falha);

    setDenuncias((atuais) => atuais.filter((x) => x.id_denuncia !== d.id_denuncia));
    if (aberta === d.id_denuncia) setAberta(null);
    setSucesso(`Denúncia de "${d.nome_objeto}" removida com sucesso.`);
    setTimeout(() => setSucesso(''), 4000);
  }

  function criarItemEncontrado(d) {
    navigate('/gerenciar', {
      state: {
        nome: d.nome_objeto,
        descricao: `Encontrado referente à denúncia do aluno ${d.aluno || ''}. ${d.descricao || ''}`.trim(),
        categoria: d.categoria,
        local: d.local_perda,
        status: 'achado',
      },
    });
  }

  const termo = busca.trim().toLowerCase();
  const denunciasFiltradas = denuncias.filter((d) => {
    const matchStatus = filtroStatus === 'todas' || d.status === filtroStatus;
    const matchBusca =
      !termo ||
      `${d.nome_objeto || ''} ${d.aluno || ''} ${d.email || ''} ${d.categoria || ''} ${d.local_perda || ''}`
        .toLowerCase()
        .includes(termo);
    return matchStatus && matchBusca;
  });

  const contagemPorStatus = (s) => (s === 'todas' ? denuncias.length : denuncias.filter((d) => d.status === s).length);

  return (
    <>
      <div className="pa-cabecalho">
        <div>
          <h1 className="pa-titulo">Denúncias de Perda</h1>
          <p className="pa-subtitulo">Gerencie os relatos de objetos perdidos registrados pela comunidade acadêmica.</p>
        </div>
      </div>

      {erro && <p className="pa-erro" role="alert">{erro}</p>}
      {sucesso && <p className="pa-sucesso" role="status">{sucesso}</p>}

      {/* Controles de busca e filtros */}
      <div className="pd-topo-filtros">
        <label className="pu-busca pd-busca">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por objeto, aluno, e-mail ou local..."
            aria-label="Buscar denúncias"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>

        <div className="pd-filtros-status" role="group" aria-label="Filtrar por status">
          {FILTROS_STATUS.map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              className={filtroStatus === valor ? 'ativo' : undefined}
              onClick={() => setFiltroStatus(valor)}
            >
              {rotulo} <span className="pd-badge-contagem">{contagemPorStatus(valor)}</span>
            </button>
          ))}
        </div>
      </div>

      <table className="pa-tabela">
        <thead>
          <tr>
            <th>Item</th>
            <th>Categoria</th>
            <th>Status</th>
            <th>Aluno</th>
            <th>E-mail</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {denunciasFiltradas.map((d) => (
            <Fragment key={d.id_denuncia}>
              <tr>
                <td>
                  <div className="pa-item">
                    {d.fotos?.[0] ? (
                      <img src={d.fotos[0]} alt="" />
                    ) : (
                      <span className="pa-sem-foto"><ImageOff size={18} /></span>
                    )}
                    <strong>{d.nome_objeto}</strong>
                  </div>
                </td>
                <td>{d.categoria ?? '—'}</td>
                <td>
                  <span className={`pd-status ${d.status}`}>
                    {STATUS_DENUNCIA[d.status] ?? d.status}
                  </span>
                </td>
                <td>{d.aluno || 'Não informado'}</td>
                <td>{d.email || '—'}</td>
                <td>{diaMes(d.data_denuncia)}</td>
                <td>
                  <div className="pa-acoes">
                    <button
                      className="pa-editar"
                      aria-expanded={aberta === d.id_denuncia}
                      onClick={() => setAberta(aberta === d.id_denuncia ? null : d.id_denuncia)}
                    >
                      {aberta === d.id_denuncia ? 'Fechar' : 'Ver'}
                    </button>
                    <button
                      className="pa-remover-btn"
                      onClick={() => remover(d)}
                      disabled={ocupado}
                      title="Remover denúncia"
                      aria-label={`Remover denúncia de ${d.nome_objeto}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              {aberta === d.id_denuncia && (
                <tr className="pd-linha-detalhe">
                  <td colSpan={7}>
                    <div className="pd-detalhe">
                      <div className="pd-detalhe-corpo">
                        <div className="pd-detalhe-topo">
                          <span className={`pd-status ${d.status}`}>
                            {STATUS_DENUNCIA[d.status] ?? d.status}
                          </span>
                          <span className="pd-id-tag">Protocolo #{d.id_denuncia}</span>
                        </div>

                        <p className="pd-motivo">
                          <strong>Descrição: </strong>
                          {d.descricao || 'Sem descrição detalhada fornecida.'}
                        </p>

                        <div className="pd-grade-info">
                          <p className="pd-info">
                            <strong>Perdido em:</strong> {dataHora(d.data_perda)}
                          </p>
                          <p className="pd-info">
                            <strong>Local / Bloco:</strong> {d.local_perda || 'Não informado'}
                          </p>
                          <p className="pd-info">
                            <strong>Data do registro:</strong> {dataHora(d.data_denuncia)}
                          </p>
                          {d.matricula && (
                            <p className="pd-info">
                              <strong>Matrícula:</strong> {d.matricula}
                            </p>
                          )}
                        </div>

                        {/* Informações de contato do aluno */}
                        <div className="pd-contato-aluno">
                          <span className="pd-contato-titulo">Contato do Aluno:</span>
                          <div className="pd-contato-itens">
                            <span className="pd-contato-item">
                              <Mail size={14} />
                              <a href={`mailto:${d.email}`}>{d.email}</a>
                            </span>
                            {d.telefone && (
                              <span className="pd-contato-item">
                                <Phone size={14} />
                                <a href={`tel:${d.telefone.replace(/\D/g, '')}`}>{d.telefone}</a>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fotos anexadas */}
                        {Array.isArray(d.fotos) && d.fotos.length > 0 && (
                          <div className="pd-bloco-fotos">
                            <strong>Fotos anexadas pelo aluno ({d.fotos.length}):</strong>
                            <div className="pd-fotos">
                              {d.fotos.map((url, i) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Abrir foto ${i + 1}`}
                                  className="pd-foto-link"
                                >
                                  <img src={url} alt={`Foto ${i + 1} de ${d.nome_objeto}`} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Painel lateral de ações no detalhe */}
                      <div className="pd-acoes-laterais">
                        <div className="pd-status-caixa">
                          <label className="pd-rotulo-secao">Alterar Status:</label>
                          <div className="pd-mudar" role="group" aria-label="Status da denúncia">
                            {Object.entries(STATUS_DENUNCIA).map(([valor, rotulo]) => (
                              <button
                                key={valor}
                                type="button"
                                className={d.status === valor ? 'ativo' : undefined}
                                aria-pressed={d.status === valor}
                                disabled={ocupado || d.status === valor}
                                onClick={() => mudarStatus(d, valor)}
                              >
                                {rotulo}
                              </button>
                            ))}
                          </div>
                          <small className="pd-ajuda-status">
                            O aluno acompanha essa alteração em tempo real na tela "Minhas Denúncias".
                          </small>
                        </div>

                        <div className="pd-acoes-secundarias">
                          <button
                            type="button"
                            className="pd-btn-converter"
                            onClick={() => criarItemEncontrado(d)}
                            title="Abre o formulário de cadastro de item com os dados desta denúncia"
                          >
                            <PlusCircle size={15} /> Cadastrar como Item Achado
                          </button>
                          <button
                            type="button"
                            className="pd-btn-excluir"
                            onClick={() => remover(d)}
                            disabled={ocupado}
                          >
                            <Trash2 size={15} /> Excluir Denúncia
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {denunciasFiltradas.length === 0 && !erro && (
        <div className="pa-vazio-card">
          <p className="pa-vazio">
            {termo || filtroStatus !== 'todas'
              ? 'Nenhuma denúncia encontrada para os filtros selecionados.'
              : 'Nenhuma denúncia recebida até o momento.'}
          </p>
        </div>
      )}
    </>
  );
}

export default DenunciasAdm;
