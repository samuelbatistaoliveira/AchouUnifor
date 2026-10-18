import { Fragment, useCallback, useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { buscar, enviar } from './api';

// "2026-09-12T10:00:00.000Z" -> "12/09"
const diaMes = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
// "2026-09-12T14:30:00.000Z" -> "12/09/2026 14:30"
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function DenunciasAdm() {
  const [denuncias, setDenuncias] = useState([]);
  const [aberta, setAberta] = useState(null); // id_denuncia em "Ver"
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(
    () =>
      buscar('/denuncias')
        .then((dados) => {
          setDenuncias(dados);
        })
        .catch((e) => setErro(e.message || 'Não foi possível carregar as denúncias.')),
    []
  );

  useEffect(() => { carregar(); }, [carregar]);

  async function mudarStatus(d, status) {
    setOcupado(true);
    setErro('');
    const falha = await enviar(`/denuncias/${d.id_denuncia}/status`, 'PATCH', { status });
    setOcupado(false);
    if (falha) return setErro(falha);
    setDenuncias((atuais) => atuais.map((x) => (x.id_denuncia === d.id_denuncia ? { ...x, status } : x)));
  }

  return (
    <>
      <h1 className="pa-titulo pa-titulo-solo">Denúncias</h1>

      {erro && <p className="pa-erro" role="alert">{erro}</p>}

      <table className="pa-tabela">
        <thead>
          <tr>
            <th>Item</th>
            <th>Categoria</th>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Data</th>
            <th><span className="pd-oculto">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {denuncias.map((d) => (
            <Fragment key={d.id_denuncia}>
              <tr>
                <td>
                  <div className="pa-item">
                    {d.fotos[0] ? (
                      <img src={d.fotos[0]} alt="" />
                    ) : (
                      <span className="pa-sem-foto"><ImageOff size={18} /></span>
                    )}
                    <strong>{d.nome_objeto}</strong>
                  </div>
                </td>
                <td>{d.categoria ?? '—'}</td>
                <td>{d.aluno}</td>
                <td>{d.matricula ?? '—'}</td>
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
                  </div>
                </td>
              </tr>
              {aberta === d.id_denuncia && (
                <tr>
                  <td colSpan={6}>
                    <div className="pd-detalhe">
                      <div>
                        <span className={`pd-status ${d.status}`}>{d.status}</span>
                        <p className="pd-motivo">{d.descricao || 'Sem descrição.'}</p>
                        <p className="pd-info"><strong>Perdido em:</strong> {dataHora(d.data_perda)}</p>
                        <p className="pd-info"><strong>Local:</strong> {d.local_perda}</p>
                        {d.fotos.length > 0 && (
                          <div className="pd-fotos">
                            {d.fotos.map((url, i) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Abrir foto ${i + 1}`}>
                                <img src={url} alt="" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {d.status === 'pendente' ? (
                        <button className="pa-devolver" disabled={ocupado} onClick={() => mudarStatus(d, 'resolvida')}>
                          Marcar como resolvida
                        </button>
                      ) : (
                        <button className="pa-editar" disabled={ocupado} onClick={() => mudarStatus(d, 'pendente')}>
                          Reabrir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {denuncias.length === 0 && !erro && <p className="pa-vazio">Nenhuma denúncia recebida.</p>}
    </>
  );
}

export default DenunciasAdm;
