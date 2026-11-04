import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Package,
  PackageCheck,
  Clock,
  FileText,
  Users,
  MapPin,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { buscar } from '../../services/api';

// Escapa células CSV para evitar injeção de fórmulas no Excel/LibreOffice (=, +, -, @)
function celulaCSVSegura(valor) {
  const texto = String(valor ?? '');
  const semFormula = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${semFormula.replace(/"/g, '""')}"`;
}

function RelatoriosAdm() {
  const [metricas, setMetricas] = useState(null);
  const [itensBrutos, setItensBrutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [periodo, setPeriodo] = useState('todos'); // 'todos' | '30dias' | '7dias'

  // Carrega métricas consolidadas e itens sem fotos (evita chamadas desnecessárias ao Storage)
  const carregarDados = useCallback(async () => {
    try {
      const [dadosRelatorio, itens] = await Promise.all([
        buscar('/relatorios').catch(() => null),
        buscar('/itens?sem_fotos=1').catch(() => []),
      ]);

      const itensArr = Array.isArray(itens) ? itens : [];
      setItensBrutos(itensArr);

      if (dadosRelatorio && dadosRelatorio.itensPorStatus) {
        setMetricas(dadosRelatorio);
      } else {
        // Fallback: só busca denúncias e usuários se a rota /relatorios não responder
        const [denuncias, usuarios] = await Promise.all([
          buscar('/denuncias').catch(() => []),
          buscar('/usuarios').catch(() => []),
        ]);
        const denunciasArr = Array.isArray(denuncias) ? denuncias : [];
        const usuariosArr = Array.isArray(usuarios) ? usuarios : [];

        const statusMap = {};
        itensArr.forEach((i) => {
          statusMap[i.status] = (statusMap[i.status] || 0) + 1;
        });
        const itensPorStatus = Object.entries(statusMap).map(([status, total]) => ({ status, total }));

        const catMap = {};
        itensArr.forEach((i) => {
          const cat = i.categoria || 'Sem categoria';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const itensPorCategoria = Object.entries(catMap)
          .map(([categoria, total]) => ({ categoria, total }))
          .sort((a, b) => b.total - a.total);

        const localMap = {};
        itensArr.forEach((i) => {
          if (i.local_encontrado) {
            localMap[i.local_encontrado] = (localMap[i.local_encontrado] || 0) + 1;
          }
        });
        const topLocais = Object.entries(localMap)
          .map(([local, total]) => ({ local, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8);

        const denMap = {};
        denunciasArr.forEach((d) => {
          denMap[d.status] = (denMap[d.status] || 0) + 1;
        });
        const denunciasPorStatus = Object.entries(denMap).map(([status, total]) => ({ status, total }));

        const userMap = {};
        usuariosArr.forEach((u) => {
          userMap[u.tipo_usuario] = (userMap[u.tipo_usuario] || 0) + 1;
        });
        const usuariosPorTipo = Object.entries(userMap).map(([tipo_usuario, total]) => ({ tipo_usuario, total }));

        setMetricas({
          itensPorStatus,
          itensPorCategoria,
          topLocais,
          denunciasPorStatus,
          usuariosPorTipo,
        });
      }
      setErro('');
    } catch (e) {
      setErro(e.message || 'Não foi possível carregar os dados do relatório.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Filtragem dos dados brutos por período selecionado
  const itensFiltrados = useMemo(() => {
    if (periodo === 'todos') return itensBrutos;
    const agora = new Date();
    const dias = periodo === '7dias' ? 7 : 30;
    const corte = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
    return itensBrutos.filter((i) => new Date(i.data_horario) >= corte);
  }, [itensBrutos, periodo]);

  // Cálculos baseados nos itens filtrados
  const totalItens = itensFiltrados.length;
  const totalDevolvidos = itensFiltrados.filter((i) => i.status === 'devolvido').length;
  const totalAchados = itensFiltrados.filter((i) => i.status === 'achado').length;
  const totalPerdidos = itensFiltrados.filter((i) => i.status === 'perdido').length;

  const taxaSucesso =
    totalDevolvidos + totalAchados > 0
      ? Math.round((totalDevolvidos / (totalDevolvidos + totalAchados)) * 100)
      : 0;

  // Categorias nos itens filtrados
  const categoriasContagem = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach((i) => {
      const c = i.categoria || 'Sem categoria';
      mapa[c] = (mapa[c] || 0) + 1;
    });
    return Object.entries(mapa)
      .map(([nome, qtd]) => ({ nome, qtd, pct: totalItens > 0 ? Math.round((qtd / totalItens) * 100) : 0 }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [itensFiltrados, totalItens]);

  // Locais nos itens filtrados
  const locaisContagem = useMemo(() => {
    const mapa = {};
    itensFiltrados.forEach((i) => {
      if (i.local_encontrado) {
        mapa[i.local_encontrado] = (mapa[i.local_encontrado] || 0) + 1;
      }
    });
    const maxQtd = Math.max(...Object.values(mapa), 1);
    return Object.entries(mapa)
      .map(([local, qtd]) => ({ local, qtd, pct: Math.round((qtd / maxQtd) * 100) }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6);
  }, [itensFiltrados]);

  // Totais de denúncias
  const totalDenuncias = useMemo(() => {
    if (!metricas?.denunciasPorStatus) return 0;
    return metricas.denunciasPorStatus.reduce((acc, curr) => acc + curr.total, 0);
  }, [metricas]);

  // Total de usuários
  const totalUsuarios = useMemo(() => {
    if (!metricas?.usuariosPorTipo) return 0;
    return metricas.usuariosPorTipo.reduce((acc, curr) => acc + curr.total, 0);
  }, [metricas]);

  // Exportar CSV
  function exportarCSV() {
    if (itensBrutos.length === 0) return;

    const cabecalho = ['ID', 'Nome do Objeto', 'Categoria', 'Status', 'Local', 'Data'];
    const linhas = itensBrutos.map((i) => [
      i.id_item,
      celulaCSVSegura(i.nome_objeto),
      celulaCSVSegura(i.categoria),
      celulaCSVSegura(i.status),
      celulaCSVSegura(i.local_encontrado),
      i.data_horario ? new Date(i.data_horario).toLocaleDateString('pt-BR') : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [cabecalho.join(','), ...linhas.map((l) => l.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_achouunifor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Imprimir
  function imprimirRelatorio() {
    window.print();
  }

  return (
    <div className="rel-container">
      {/* Cabeçalho */}
      <div className="pa-cabecalho rel-nao-imprimir">
        <div>
          <h1 className="pa-titulo">Relatórios & Estatísticas</h1>
          <p className="pa-subtitulo">
            Panorama completo de itens cadastrados, devoluções concluídas e índice de resoluções no campus.
          </p>
        </div>

        <div className="rel-acoes-topo">
          <button type="button" className="rel-btn-secundario" onClick={exportarCSV} title="Exportar planilha CSV">
            <Download size={16} /> Exportar CSV
          </button>
          <button type="button" className="rel-btn-primario" onClick={imprimirRelatorio} title="Imprimir ou gerar PDF">
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {erro && <p className="pa-erro" role="alert">{erro}</p>}

      {/* Filtro de Período */}
      <div className="rel-filtro-periodo rel-nao-imprimir">
        <span className="rel-filtro-label">Período de Análise:</span>
        <div className="rel-periodo-botoes" role="group" aria-label="Filtrar período">
          <button
            type="button"
            className={periodo === 'todos' ? 'ativo' : ''}
            onClick={() => setPeriodo('todos')}
          >
            Todo o Histórico
          </button>
          <button
            type="button"
            className={periodo === '30dias' ? 'ativo' : ''}
            onClick={() => setPeriodo('30dias')}
          >
            Últimos 30 Dias
          </button>
          <button
            type="button"
            className={periodo === '7dias' ? 'ativo' : ''}
            onClick={() => setPeriodo('7dias')}
          >
            Últimos 7 Dias
          </button>
        </div>

        <button
          type="button"
          className="rel-btn-recarregar"
          onClick={() => {
            setCarregando(true);
            carregarDados();
          }}
          disabled={carregando}
          title="Atualizar dados"
        >
          <RefreshCw size={14} className={carregando ? 'rel-girando' : ''} />
          Atualizar
        </button>
      </div>

      {/* Cabeçalho exclusivo para impressão */}
      <div className="rel-cabecalho-impressao">
        <h2>AchouUNIFOR — Relatório de Gestão de Achados e Perdidos</h2>
        <p>
          Gerado em: {new Date().toLocaleString('pt-BR')} | Período:{' '}
          {periodo === 'todos' ? 'Todo o Histórico' : periodo === '30dias' ? 'Últimos 30 Dias' : 'Últimos 7 Dias'}
        </p>
      </div>

      {/* Cartões de Indicadores Principais (KPIs) */}
      <div className="rel-kpi-grid">
        <div className="rel-kpi-card rel-borda-azul">
          <div className="rel-kpi-topo">
            <span className="rel-kpi-titulo">Total de Itens</span>
            <div className="rel-kpi-icone rel-ico-azul">
              <Package size={22} />
            </div>
          </div>
          <div className="rel-kpi-numero">{totalItens}</div>
          <div className="rel-kpi-detalhe">Objetos registrados no período</div>
        </div>

        <div className="rel-kpi-card rel-borda-verde">
          <div className="rel-kpi-topo">
            <span className="rel-kpi-titulo">Devoluções Feitas</span>
            <div className="rel-kpi-icone rel-ico-verde">
              <PackageCheck size={22} />
            </div>
          </div>
          <div className="rel-kpi-numero">{totalDevolvidos}</div>
          <div className="rel-kpi-detalhe">
            <span className="rel-badge-taxa">{taxaSucesso}% de taxa de devolução</span>
          </div>
        </div>

        <div className="rel-kpi-card rel-borda-amarela">
          <div className="rel-kpi-topo">
            <span className="rel-kpi-titulo">Itens em Posse</span>
            <div className="rel-kpi-icone rel-ico-amarelo">
              <Clock size={22} />
            </div>
          </div>
          <div className="rel-kpi-numero">{totalAchados}</div>
          <div className="rel-kpi-detalhe">Aguardando retirada pelo proprietário</div>
        </div>

        <div className="rel-kpi-card rel-borda-vermelha">
          <div className="rel-kpi-topo">
            <span className="rel-kpi-titulo">Denúncias de Alunos</span>
            <div className="rel-kpi-icone rel-ico-vermelho">
              <FileText size={22} />
            </div>
          </div>
          <div className="rel-kpi-numero">{totalDenuncias}</div>
          <div className="rel-kpi-detalhe">Relatos de perda recebidos</div>
        </div>

        <div className="rel-kpi-card rel-borda-cinza">
          <div className="rel-kpi-topo">
            <span className="rel-kpi-titulo">Usuários Cadastrados</span>
            <div className="rel-kpi-icone rel-ico-cinza">
              <Users size={22} />
            </div>
          </div>
          <div className="rel-kpi-numero">{totalUsuarios}</div>
          <div className="rel-kpi-detalhe">Comunidade acadêmica ativa</div>
        </div>
      </div>

      {/* Painel Duplo de Gráficos e Seções */}
      <div className="rel-painel-duplo">
        {/* Distribuição por Categoria */}
        <div className="rel-bloco-grafico">
          <div className="rel-bloco-topo">
            <div className="rel-bloco-titulo">
              <Tag size={18} />
              <h3>Itens por Categoria</h3>
            </div>
            <span className="rel-bloco-sub">{categoriasContagem.length} categorias com registros</span>
          </div>

          <div className="rel-barras-lista">
            {categoriasContagem.length > 0 ? (
              categoriasContagem.map((cat) => (
                <div key={cat.nome} className="rel-barra-item">
                  <div className="rel-barra-rotulo">
                    <span className="rel-barra-nome">{cat.nome}</span>
                    <span className="rel-barra-valor">
                      <strong>{cat.qtd}</strong> ({cat.pct}%)
                    </span>
                  </div>
                  <div className="rel-barra-trilha">
                    <div className="rel-barra-preenchimento rel-barra-azul" style={{ width: `${Math.max(cat.pct, 4)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="pa-vazio">Nenhum item registrado neste período.</p>
            )}
          </div>
        </div>

        {/* Top Locais no Campus */}
        <div className="rel-bloco-grafico">
          <div className="rel-bloco-topo">
            <div className="rel-bloco-titulo">
              <MapPin size={18} />
              <h3>Locais com Mais Ocorrências</h3>
            </div>
            <span className="rel-bloco-sub">Pontos do campus com maior índice de achados</span>
          </div>

          <div className="rel-barras-lista">
            {locaisContagem.length > 0 ? (
              locaisContagem.map((loc, idx) => (
                <div key={loc.local} className="rel-barra-item">
                  <div className="rel-barra-rotulo">
                    <span className="rel-barra-nome">
                      <span className="rel-posicao">#{idx + 1}</span> {loc.local}
                    </span>
                    <span className="rel-barra-valor">
                      <strong>{loc.qtd}</strong> objeto(s)
                    </span>
                  </div>
                  <div className="rel-barra-trilha">
                    <div
                      className="rel-barra-preenchimento rel-barra-laranja"
                      style={{ width: `${Math.max(loc.pct, 6)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="pa-vazio">Nenhum local registrado neste período.</p>
            )}
          </div>
        </div>
      </div>

      {/* Composição do Inventário / Status */}
      <div className="rel-bloco-grafico rel-bloco-largo">
        <div className="rel-bloco-topo">
          <div className="rel-bloco-titulo">
            <BarChart3 size={18} />
            <h3>Composição do Inventário Geral</h3>
          </div>
          <span className="rel-bloco-sub">Status dos objetos no fluxo de localização e devolução</span>
        </div>

        {/* Barra segmentada */}
        {totalItens > 0 ? (
          <>
            <div className="rel-barra-segmentada">
              {totalDevolvidos > 0 && (
                <div
                  className="rel-segmento rel-seg-devolvido"
                  style={{ width: `${(totalDevolvidos / totalItens) * 100}%` }}
                  title={`Devolvidos: ${totalDevolvidos} (${Math.round((totalDevolvidos / totalItens) * 100)}%)`}
                />
              )}
              {totalAchados > 0 && (
                <div
                  className="rel-segmento rel-seg-achado"
                  style={{ width: `${(totalAchados / totalItens) * 100}%` }}
                  title={`Em posse (Achados): ${totalAchados} (${Math.round((totalAchados / totalItens) * 100)}%)`}
                />
              )}
              {totalPerdidos > 0 && (
                <div
                  className="rel-segmento rel-seg-perdido"
                  style={{ width: `${(totalPerdidos / totalItens) * 100}%` }}
                  title={`Perdidos: ${totalPerdidos} (${Math.round((totalPerdidos / totalItens) * 100)}%)`}
                />
              )}
            </div>

            <div className="rel-legenda-grid">
              <div className="rel-legenda-item">
                <span className="rel-legenda-ponto rel-seg-devolvido" />
                <span className="rel-legenda-texto">Devolvidos ao proprietário:</span>
                <strong>
                  {totalDevolvidos} ({Math.round((totalDevolvidos / totalItens) * 100)}%)
                </strong>
              </div>

              <div className="rel-legenda-item">
                <span className="rel-legenda-ponto rel-seg-achado" />
                <span className="rel-legenda-texto">Em posse da administração (Achados):</span>
                <strong>
                  {totalAchados} ({Math.round((totalAchados / totalItens) * 100)}%)
                </strong>
              </div>

              <div className="rel-legenda-item">
                <span className="rel-legenda-ponto rel-seg-perdido" />
                <span className="rel-legenda-texto">Ainda não localizados (Perdidos):</span>
                <strong>
                  {totalPerdidos} ({Math.round((totalPerdidos / totalItens) * 100)}%)
                </strong>
              </div>
            </div>
          </>
        ) : (
          <p className="pa-vazio">Sem dados de inventário para exibir neste período.</p>
        )}
      </div>
    </div>
  );
}

export default RelatoriosAdm;
