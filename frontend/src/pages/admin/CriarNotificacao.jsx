import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { buscar, enviar } from '../../services/api';
import '../../styles/Inicio.css';
import '../../styles/GerenciarItem.css';
import '../../styles/Notificacoes.css';

// mesmas regras do backend (notificacoesController)
const TITULO = { nome: 'o título', min: 3, max: 100 };
const MENSAGEM = { nome: 'a mensagem', min: 10, max: 1000 };
const MIN_LETRAS = 3; // barra textos só de números ou símbolos, como "12345" ou "!!!"

// devolve o problema do texto, ou '' se estiver ok
function validarTexto(texto, { nome, min, max }) {
  const limpo = texto.trim();
  const Nome = nome[0].toUpperCase() + nome.slice(1);
  if (!limpo) return `Preencha ${nome}.`;
  if (limpo.length < min) return `${Nome} precisa ter pelo menos ${min} caracteres.`;
  if (limpo.length > max) return `${Nome} pode ter no máximo ${max} caracteres.`;
  if ((limpo.match(/\p{L}/gu) ?? []).length < MIN_LETRAS) {
    return `${Nome} não pode ter só números ou símbolos: escreva com palavras.`;
  }
  return '';
}

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
    const invalido = validarTexto(titulo, TITULO) || validarTexto(mensagem, MENSAGEM);
    if (invalido) return setErro(invalido);
    if (para === 'aluno' && !aluno) return setErro('Escolha o aluno que vai receber.');

    setEnviando(true);
    setErro('');
    const falha = await enviar('/notificacoes', 'POST', {
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
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
              maxLength={TITULO.max}
              value={form.titulo}
              onChange={mudar('titulo')}
            />
            <small className="nt-contador">
              Mínimo de {TITULO.min} caracteres, com letras · {form.titulo.length}/{TITULO.max}
            </small>
          </label>

          <label className="gi-campo">
            Mensagem
            <textarea
              rows={6}
              maxLength={MENSAGEM.max}
              placeholder="Ex: Neste sábado o setor de segurança funciona das 8h às 12h para retirada de itens."
              value={form.mensagem}
              onChange={mudar('mensagem')}
            />
            <small className="nt-contador">
              Mínimo de {MENSAGEM.min} caracteres, com letras · {form.mensagem.length}/{MENSAGEM.max}
            </small>
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
