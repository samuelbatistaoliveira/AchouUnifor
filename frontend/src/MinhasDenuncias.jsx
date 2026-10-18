import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ImageOff, Plus } from 'lucide-react';
import { buscar, enviar } from './api';
import { STATUS_DENUNCIA } from './constantes';
import './Inicio.css';
import './MinhasDenuncias.css';

const FILTROS = [
  ['todas', 'Todas'],
  ['perdido', 'Perdidos'],
  ['encontrado', 'Encontrados'],
  ['devolvido', 'Devolvidos'],
];

// o que cada status significa para o aluno (mostrado ao abrir a denúncia)
const AVISOS = {
  perdido: 'Ainda não foi encontrado. Quando a administração achar o objeto, o status muda para "Encontrado".',
  encontrado: 'Seu objeto foi encontrado! Retire presencialmente no setor de segurança da UNIFOR.',
  devolvido: 'Objeto devolvido. Esta denúncia fica guardada no seu histórico.',
};

// "2026-09-12T14:30:00.000Z" -> "12/09" e "12/09/2026 14:30"
const diaMes = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Denúncias de perda que o próprio aluno fez (aberta pelo Perfil)
function MinhasDenuncias({ aoVoltar, aoNovaDenuncia }) {
  const [denuncias, setDenuncias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [aberta, setAberta] = useState(null); // id_denuncia com os detalhes à mostra
  const [removendo, setRemovendo] = useState(null);

  useEffect(() => {
    buscar('/denuncias/minhas')
      .then(setDenuncias)
      .catch((e) => setErro(e.message || 'Não foi possível carregar suas denúncias.'))
      .finally(() => setCarregando(false));
  }, []);

  const doFiltro = (f) => (f === 'todas' ? denuncias : denuncias.filter((d) => d.status === f));
  const visiveis = doFiltro(filtro);

  async function remover(d) {
    if (!window.confirm(`Remover a denúncia de "${d.nome_objeto}"? Ela deixa de aparecer para você e para a administração.`)) return;
    setRemovendo(d.id_denuncia);
    setErro('');
    const falha = await enviar(`/denuncias/${d.id_denuncia}`, 'DELETE');
    setRemovendo(null);
    if (falha) return setErro(falha);
    setDenuncias((atuais) => atuais.filter((x) => x.id_denuncia !== d.id_denuncia));
  }

  return (
    <main className="inicio-conteudo">
      <div className="md-cabecalho">
        <button className="md-voltar" onClick={aoVoltar} aria-label="Voltar ao perfil">
          <ChevronLeft size={26} />
        </button>
        <h1>Minhas Denúncias</h1>
        <button className="md-nova" onClick={aoNovaDenuncia}>
          <Plus size={18} /> Nova denúncia
        </button>
      </div>

      <div className="md-filtros" role="group" aria-label="Filtrar por status">
        {FILTROS.map(([valor, rotulo]) => (
          <button
            key={valor}
            className={filtro === valor ? 'ativo' : undefined}
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
          >
            {rotulo} <span className="md-contagem">{doFiltro(valor).length}</span>
          </button>
        ))}
      </div>

      {erro && <p className="inicio-erro" role="alert">{erro}</p>}
      {carregando && <p className="md-vazio" role="status">Carregando denúncias...</p>}

      <ul className="md-lista">
        {visiveis.map((d) => {
          const aberto = aberta === d.id_denuncia;
          return (
            <li key={d.id_denuncia} className={`md-denuncia${aberto ? ' aberta' : ''}`}>
              <div className="md-linha">
                <button className="md-resumo" aria-expanded={aberto} onClick={() => setAberta(aberto ? null : d.id_denuncia)}>
                  {d.fotos[0] ? (
                    <img className="md-foto" src={d.fotos[0]} alt="" />
                  ) : (
                    <span className="md-foto md-sem-foto"><ImageOff size={20} /></span>
                  )}
                  <strong className="md-nome">{d.nome_objeto}</strong>
                  <span className="md-categoria">{d.categoria ?? 'Sem categoria'}</span>
                  <span className={`md-status ${d.status}`}>{STATUS_DENUNCIA[d.status] ?? d.status}</span>
                  <time className="md-data" dateTime={d.data_perda} title={`Perdido em ${dataHora(d.data_perda)}`}>
                    {diaMes(d.data_perda)}
                  </time>
                  <ChevronDown className="md-seta" size={18} aria-hidden="true" />
                </button>

                {/* depois de encontrado/devolvido a denúncia vira histórico e não sai mais */}
                {d.status === 'perdido' ? (
                  <button className="md-remover" onClick={() => remover(d)} disabled={removendo === d.id_denuncia}>
                    {removendo === d.id_denuncia ? 'Removendo...' : 'Remover denúncia'}
                  </button>
                ) : (
                  <span className="md-remover-vazio" aria-hidden="true" />
                )}
              </div>

              {aberto && (
                <div className="md-detalhe">
                  <p className={`md-aviso ${d.status}`}>{AVISOS[d.status]}</p>
                  <dl className="md-info">
                    <div><dt>Perdido em</dt><dd>{dataHora(d.data_perda)}</dd></div>
                    <div><dt>Local</dt><dd>{d.local_perda}</dd></div>
                    <div><dt>Denunciado em</dt><dd>{dataHora(d.data_denuncia)}</dd></div>
                  </dl>
                  <p className="md-descricao">{d.descricao || 'Sem descrição.'}</p>
                  {d.fotos.length > 0 && (
                    <div className="md-fotos">
                      {d.fotos.map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Abrir foto ${i + 1}`}>
                          <img src={url} alt="" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!carregando && !erro && denuncias.length === 0 && (
        <div className="md-vazio md-vazio-cartao">
          <p>Você ainda não fez nenhuma denúncia.</p>
          <button className="md-nova" onClick={aoNovaDenuncia}><Plus size={18} /> Denunciar perda</button>
        </div>
      )}
      {!carregando && denuncias.length > 0 && visiveis.length === 0 && (
        <p className="md-vazio">Nenhuma denúncia com esse status.</p>
      )}
    </main>
  );
}

export default MinhasDenuncias;
