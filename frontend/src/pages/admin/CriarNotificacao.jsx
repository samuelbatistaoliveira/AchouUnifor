import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { buscar, enviar } from '../../services/api';
import '../../styles/Inicio.css';
import '../../styles/GerenciarItem.css';
import '../../styles/Notificacoes.css';

// mesmos limites do backend (notificacoesController)
const TITULO_MAX = 100;
const MENSAGEM_MAX = 1000;
const VAZIO = { para: 'todos', aluno: '', titulo: '', mensagem: '' };

// Admin escreve uma notificação para todos os alunos ou para um aluno; ela aparece em Notificações do aluno
function CriarNotificacao() {
  const navigate = useNavigate();
  const [form, setForm] = useState(VAZIO);
  const [alunos, setAlunos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviada, setEnviada] = useState(null); // nome de quem recebeu, depois de enviar

  useEffect(() => {
    buscar('/usuarios')
      .then((usuarios) => setAlunos(usuarios.filter((u) => u.tipo_usuario === 'aluno')))
      .catch((e) => setErro(e.message || 'Não foi possível carregar os alunos.'));
  }, []);

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function enviarNotificacao(e) {
    e.preventDefault();
    const { para, aluno, titulo, mensagem } = form;
    if (!titulo.trim() || !mensagem.trim()) return setErro('Preencha o título e a mensagem.');
    if (para === 'aluno' && !aluno) return setErro('Escolha o aluno que vai receber.');

    setEnviando(true);
    setErro('');
    const falha = await enviar('/notificacoes', 'POST', {
      titulo,
      mensagem,
      id_destinatario: para === 'aluno' ? Number(aluno) : null,
    });
    setEnviando(false);
    if (falha) return setErro(falha);

    const destino = para === 'aluno' ? alunos.find((a) => String(a.id_usuario) === aluno)?.nome : null;
    setEnviada(destino ?? 'todos os alunos');
    setForm(VAZIO);
  }

  return (
    <main className="gi-conteudo">
      <h1 className="gi-titulo">Nova notificação</h1>

      {enviada ? (
        <section className="gi-aviso" role="status">
          <CircleCheck size={44} className="gi-aviso-icone" aria-hidden="true" />
          <p><strong>Notificação enviada!</strong></p>
          <p>Ela já aparece em Notificações para {enviada}.</p>
          <button className="gi-registrar" onClick={() => navigate('/notificacoes')}>Ver notificações enviadas</button>
          <button className="gi-registrar" onClick={() => setEnviada(null)}>Enviar outra</button>
        </section>
      ) : (
        <form className="nt-form" onSubmit={enviarNotificacao}>
          <fieldset className="nt-destino">
            <legend className="gi-rotulo">Para quem</legend>
            <label className={form.para === 'todos' ? 'ativo' : undefined}>
              <input type="radio" name="para" value="todos" checked={form.para === 'todos'} onChange={mudar('para')} />
              Todos os alunos
            </label>
            <label className={form.para === 'aluno' ? 'ativo' : undefined}>
              <input type="radio" name="para" value="aluno" checked={form.para === 'aluno'} onChange={mudar('para')} />
              Um aluno específico
            </label>
          </fieldset>

          {form.para === 'aluno' && (
            <label className="gi-campo">
              Aluno
              <select value={form.aluno} onChange={mudar('aluno')}>
                <option value="">Selecione o aluno</option>
                {alunos.map((a) => (
                  <option key={a.id_usuario} value={a.id_usuario}>{a.nome} · {a.email_institucional}</option>
                ))}
              </select>
            </label>
          )}

          <label className="gi-campo">
            Título
            <input
              placeholder="Ex: Retirada de itens no sábado"
              maxLength={TITULO_MAX}
              value={form.titulo}
              onChange={mudar('titulo')}
            />
          </label>

          <label className="gi-campo">
            Mensagem
            <textarea
              rows={6}
              maxLength={MENSAGEM_MAX}
              placeholder="Ex: Neste sábado o setor de segurança funciona das 8h às 12h para retirada de itens."
              value={form.mensagem}
              onChange={mudar('mensagem')}
            />
            <small className="nt-contador">{form.mensagem.length}/{MENSAGEM_MAX}</small>
          </label>

          {erro && <p className="gi-erro" role="alert">{erro}</p>}
          <div className="nt-acoes">
            <button type="submit" className="gi-registrar" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar notificação'}
            </button>
            <button type="button" className="gi-cancelar" onClick={() => navigate('/notificacoes')}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export default CriarNotificacao;
