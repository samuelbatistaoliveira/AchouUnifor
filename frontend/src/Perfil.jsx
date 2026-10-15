import { useEffect, useState } from 'react';
import { User, ArrowLeft, FileText, LogOut } from 'lucide-react';
import './Perfil.css';

const API = 'http://localhost:3000';

// preferências ficam no navegador por enquanto; o banco ainda não tem onde guardá-las
const PREFERENCIAS = [
  { chave: 'porEmail', titulo: 'Notificações por e-mail', descricao: 'Receber avisos também no seu e-mail institucional.' },
  { chave: 'denuncias', titulo: 'Atualizações das minhas denúncias', descricao: 'Avisar quando o status de uma denúncia mudar.' },
  { chave: 'novosItens', titulo: 'Novos itens encontrados', descricao: 'Avisar quando um novo item for registrado no campus.' },
];

function lerPreferencias() {
  try {
    return JSON.parse(localStorage.getItem('preferenciasNotificacao')) || {};
  } catch {
    return {};
  }
}

function Perfil({ aoSair, aoVoltar, aoAbrirDenuncias }) {
  const [usuario, setUsuario] = useState(null);
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [preferencias, setPreferencias] = useState(lerPreferencias);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const cabecalho = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/usuarios/me`, { headers: cabecalho })
      .then(async (r) => {
        if (r.status === 401) {
          setErro('Sessão expirada ou ausente. Faça login novamente.');
          return aoSair();
        }
        const dados = await r.json();
        if (!r.ok) throw new Error();
        setUsuario(dados);
        setTelefone(dados.telefone || '');
      })
      .catch(() => setErro('Não foi possível carregar o perfil.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarTelefone(e) {
    e.preventDefault();
    setMensagem('');
    setErro('');
    setSalvando(true);

    try {
      const r = await fetch(`${API}/usuarios/me/telefone`, {
        method: 'PUT',
        headers: { ...cabecalho, 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setErro(dados.mensagem);
        return;
      }

      setUsuario({ ...usuario, telefone: dados.telefone });
      setTelefone(dados.telefone);
      setMensagem('Telefone atualizado.');
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setSalvando(false);
    }
  }

  function alternarPreferencia(chave) {
    const novas = { ...preferencias, [chave]: !preferencias[chave] };
    setPreferencias(novas);
    localStorage.setItem('preferenciasNotificacao', JSON.stringify(novas));
  }

  if (!usuario) {
    return <p className="perfil-carregando">{erro || 'Carregando...'}</p>;
  }

  return (
    <div className="perfil">
      <header className="perfil-topo">
        <button className="perfil-voltar" onClick={aoVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
      </header>

      <main className="perfil-conteudo">
        {/* resumo */}
        <section className="perfil-resumo">
          {usuario.foto ? (
            <img className="perfil-foto" src={usuario.foto} alt={usuario.nome} />
          ) : (
            <div className="perfil-foto perfil-sem-foto"><User size={48} /></div>
          )}
          <h1>{usuario.nome}</h1>
          <p>{usuario.email_institucional}</p>
          <p>{usuario.curso}</p>
        </section>

        {/* dados */}
        <section className="perfil-cartao">
          <h2>Dados pessoais</h2>

          <dl className="perfil-dados">
            <dt>Nome completo</dt>
            <dd>{usuario.nome}</dd>
            <dt>E-mail</dt>
            <dd>{usuario.email_institucional}</dd>
            <dt>Curso</dt>
            <dd>{usuario.curso}</dd>
          </dl>

          <form className="perfil-telefone" onSubmit={salvarTelefone}>
            <label htmlFor="telefone">Telefone para contato</label>
            <div>
              <input
                id="telefone"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="85999999999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
              />
              <button type="submit" disabled={salvando || telefone === (usuario.telefone || '')}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {mensagem && <p className="perfil-ok" role="status">{mensagem}</p>}
            {erro && <p className="perfil-erro" role="alert">{erro}</p>}
          </form>
        </section>

        {/* notificações */}
        <section className="perfil-cartao">
          <h2>Preferências de notificação</h2>

          {PREFERENCIAS.map((p) => (
            <label key={p.chave} className="perfil-opcao">
              <span>
                <strong>{p.titulo}</strong>
                <small>{p.descricao}</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={!!preferencias[p.chave]}
                onChange={() => alternarPreferencia(p.chave)}
              />
            </label>
          ))}
        </section>

        {/* ações */}
        <button className="perfil-denuncias" onClick={aoAbrirDenuncias}>
          <FileText size={18} /> Denúncias
        </button>
        <button className="perfil-sair" onClick={aoSair}>
          <LogOut size={18} /> Sair
        </button>
      </main>
    </div>
  );
}

export default Perfil;
