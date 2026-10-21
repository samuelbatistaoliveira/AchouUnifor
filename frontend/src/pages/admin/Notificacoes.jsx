import { useEffect, useState } from 'react';
import { Bell, Plus, User, Users } from 'lucide-react';
import Topbar from '../../components/Topbar';
import { buscar } from '../../services/api';
import '../../styles/Inicio.css';
import '../../styles/Notificacoes.css';

// "2026-10-18T15:30:00.000Z" -> "18/10/2026 15:30"
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Admin: notificações já enviadas aos alunos + atalho para enviar uma nova
function Notificacoes({ aoNavegar, aoAbrirPerfil }) {
  const [enviadas, setEnviadas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscar('/notificacoes')
      .then(setEnviadas)
      .catch((e) => setErro(e.message || 'Não foi possível carregar as notificações.'))
      .finally(() => setCarregando(false));
  }, []);

  const novaNotificacao = (
    <button className="nt-nova" onClick={() => aoNavegar('nova-notificacao')}>
      <Plus size={18} /> Nova notificação
    </button>
  );

  return (
    <div className="inicio">
      <Topbar ativo="notificacoes" aoNavegar={aoNavegar} aoAbrirPerfil={aoAbrirPerfil} />

      <main className="nt-conteudo">
        <div className="nt-cabecalho">
          <h1>Notificações</h1>
          {novaNotificacao}
        </div>

        {erro && <p className="inicio-erro" role="alert">{erro}</p>}
        {carregando && <p className="nt-texto" role="status">Carregando notificações...</p>}

        {!carregando && !erro && enviadas.length === 0 && (
          <section className="nt-vazio">
            <Bell size={64} strokeWidth={1.6} aria-hidden="true" />
            <h2>Nenhuma notificação enviada</h2>
            <p className="nt-texto">Avise todos os alunos ou um aluno específico sobre algo do Achados e Perdidos.</p>
            {novaNotificacao}
          </section>
        )}

        {enviadas.length > 0 && <h2 className="nt-subtitulo">Enviadas</h2>}
        <ul className="nt-lista">
          {enviadas.map((n) => (
            <li key={n.id_notificacao} className="nt-cartao">
              <span className="nt-icone"><Bell size={20} aria-hidden="true" /></span>
              <div className="nt-corpo">
                <div className="nt-topo">
                  <strong>{n.titulo}</strong>
                  <time dateTime={n.data_criacao}>{dataHora(n.data_criacao)}</time>
                </div>
                <p className="nt-mensagem">{n.mensagem}</p>
                <div className="nt-rodape">
                  {n.id_destinatario ? (
                    <span className="nt-para"><User size={14} aria-hidden="true" /> {n.destinatario}</span>
                  ) : (
                    <span className="nt-para todos"><Users size={14} aria-hidden="true" /> Todos os alunos</span>
                  )}
                  <span>enviada por {n.autor}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default Notificacoes;
