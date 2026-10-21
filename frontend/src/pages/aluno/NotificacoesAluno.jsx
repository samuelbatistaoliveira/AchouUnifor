import { useEffect, useState } from 'react';
import { Bell, CircleCheck, ImageOff } from 'lucide-react';
import { buscar } from '../../services/api';
import '../../styles/InicioAluno.css';

// "2026-10-18T15:30:00.000Z" -> "18/10/2026 15:30"
const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Notificações do aluno: primeiro as denúncias que o admin marcou como "encontrado" (correspondência),
// depois as mensagens que o admin enviou (para todos ou só para ele).
// shortcut: não há "lida/não lida"; guardar isso por aluno se precisar de contador no menu
function NotificacoesAluno({ aoVerDenuncias }) {
  const [encontradas, setEncontradas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([buscar('/denuncias/minhas'), buscar('/notificacoes/minhas')])
      .then(([denuncias, notificacoes]) => {
        setEncontradas(denuncias.filter((d) => d.status === 'encontrado'));
        setMensagens(notificacoes);
      })
      .catch((e) => setErro(e.message || 'Não foi possível carregar as notificações.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="inicio-conteudo">
      <h1 className="na-titulo">Notificações</h1>

      {erro && <p className="inicio-erro" role="alert">{erro}</p>}
      {carregando && <p className="na-texto" role="status">Carregando notificações...</p>}

      {!carregando && !erro && encontradas.length === 0 && mensagens.length === 0 && (
        <section className="na-vazio">
          <Bell size={64} strokeWidth={1.6} aria-hidden="true" />
          <h2>Nenhuma notificação por aqui</h2>
          <p className="na-texto">Você será avisado quando houver uma correspondência para os itens que registrou.</p>
        </section>
      )}

      <ul className="na-lista">
        {encontradas.map((d) => (
          <li key={d.id_denuncia} className="na-aviso">
            {d.fotos[0] ? (
              <img className="na-foto" src={d.fotos[0]} alt="" />
            ) : (
              <span className="na-foto na-sem-foto"><ImageOff size={20} /></span>
            )}
            <div className="na-conteudo">
              <strong><CircleCheck size={16} aria-hidden="true" /> Seu objeto foi encontrado!</strong>
              <p>"{d.nome_objeto}" está no setor de segurança da UNIFOR. Retire presencialmente.</p>
            </div>
            <button className="na-ver" onClick={aoVerDenuncias}>Ver denúncia</button>
          </li>
        ))}

        {mensagens.map((n) => (
          <li key={`n${n.id_notificacao}`} className="na-aviso na-mensagem">
            <span className="na-sino"><Bell size={20} aria-hidden="true" /></span>
            <div className="na-conteudo">
              <div className="na-topo">
                <strong>{n.titulo}</strong>
                {n.para_mim && <span className="na-para-voce">Para você</span>}
                <time dateTime={n.data_criacao}>{dataHora(n.data_criacao)}</time>
              </div>
              <p>{n.mensagem}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default NotificacoesAluno;
