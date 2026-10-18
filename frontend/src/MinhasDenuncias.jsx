import { useEffect, useState } from 'react';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { buscar } from './api';
import './Inicio.css';
import './DetalhesItem.css';
import './InicioAluno.css';

const STATUS = { pendente: 'Em análise', resolvida: 'Resolvida' };

// "2026-09-12T14:30:00.000Z" -> "12/09/2026 14:30"
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Denúncias de perda que o próprio aluno fez (aberta pelo Perfil)
function MinhasDenuncias({ aoVoltar }) {
  const [denuncias, setDenuncias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscar('/denuncias/minhas')
      .then(setDenuncias)
      .catch((e) => setErro(e.message || 'Não foi possível carregar suas denúncias.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="inicio-conteudo">
      <button className="botao-voltar" onClick={aoVoltar}>
        <ArrowLeft size={18} /> Voltar ao perfil
      </button>
      <h1 className="aluno-titulo">Minhas denúncias</h1>

      {erro && <p className="inicio-erro" role="alert">{erro}</p>}
      {carregando && <p role="status">Carregando denúncias...</p>}

      <div className="inicio-lista">
        {denuncias.map((d) => (
          <article key={d.id_denuncia} className="inicio-card">
            {d.fotos[0] ? (
              <img className="inicio-foto" src={d.fotos[0]} alt={d.nome_objeto} />
            ) : (
              <div className="inicio-foto inicio-sem-foto"><ImageOff size={32} /></div>
            )}
            <div className="inicio-card-corpo">
              <span className={`aluno-status ${d.status}`}>{STATUS[d.status] ?? d.status}</span>
              <h3>{d.nome_objeto}</h3>
              <p>{d.categoria ?? 'Sem categoria'} · perdido em {dataHora(d.data_perda)}</p>
              <p>{d.local_perda}</p>
              {d.descricao && <p className="aluno-descricao">{d.descricao}</p>}
            </div>
          </article>
        ))}
      </div>

      {!carregando && !erro && denuncias.length === 0 && <p>Você ainda não fez nenhuma denúncia.</p>}
    </main>
  );
}

export default MinhasDenuncias;
