import { useEffect, useState } from 'react';
import { Bell, CircleCheck, ImageOff } from 'lucide-react';
import { buscar } from './api';
import './InicioAluno.css';

// Notificações do aluno: cada denúncia que o admin marcou como "encontrado" é um aviso de correspondência.
// shortcut: sem tabela de notificações (não há "lida" nem a hora do aviso); criar uma se precisar disso
function NotificacoesAluno({ aoVerDenuncias }) {
  const [encontradas, setEncontradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscar('/denuncias/minhas')
      .then((dados) => setEncontradas(dados.filter((d) => d.status === 'encontrado')))
      .catch((e) => setErro(e.message || 'Não foi possível carregar as notificações.'))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="inicio-conteudo">
      <h1 className="na-titulo">Notificações</h1>

      {erro && <p className="inicio-erro" role="alert">{erro}</p>}
      {carregando && <p className="na-texto" role="status">Carregando notificações...</p>}

      {!carregando && !erro && encontradas.length === 0 && (
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
      </ul>
    </main>
  );
}

export default NotificacoesAluno;
