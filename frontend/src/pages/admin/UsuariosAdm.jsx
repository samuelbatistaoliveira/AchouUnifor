import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { buscar, enviar } from '../../services/api';

const TIPOS = { aluno: 'Aluno', administrador: 'Admin' };

// "85911112222" -> "(85) 91111-2222"
function formatarTelefone(t) {
  if (!t) return '—';
  const d = t.replace(/\D/g, '');
  return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}` : t;
}

function UsuariosAdm() {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null); // { id_usuario, nome, telefone, tipo_usuario }
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(
    () =>
      buscar('/usuarios')
        .then((dados) => {
          setUsuarios(dados);
        })
        .catch((e) => setErro(e.message || 'Não foi possível carregar os usuários.')),
    []
  );

  useEffect(() => { carregar(); }, [carregar]);

  async function executar(acao) {
    setOcupado(true);
    setErro('');
    const falha = await acao();
    setOcupado(false);
    if (falha) {
      setErro(falha);
      return false;
    }
    await carregar();
    return true;
  }

  async function salvar(e) {
    e.preventDefault();
    const { id_usuario, ...dados } = editando;
    if (await executar(() => enviar(`/usuarios/${id_usuario}`, 'PUT', dados))) setEditando(null);
  }

  function remover(u) {
    if (window.confirm(`Remover ${u.nome}? Ele não vai mais conseguir entrar no sistema.`)) {
      executar(() => enviar(`/usuarios/${u.id_usuario}`, 'DELETE'));
    }
  }

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? usuarios.filter((u) => `${u.nome} ${u.email_institucional}`.toLowerCase().includes(termo))
    : usuarios;

  return (
    <>
      <h1 className="pa-titulo pa-titulo-solo">Gerenciar usuários</h1>

      <label className="pu-busca">
        <Search size={16} />
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuário"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>

      {erro && <p className="pa-erro" role="alert">{erro}</p>}

      <table className="pa-tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Telefone</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((u) =>
            editando?.id_usuario === u.id_usuario ? (
              <tr key={u.id_usuario}>
                <td colSpan={5}>
                  <form className="pu-edicao" onSubmit={salvar}>
                    <input
                      aria-label="Nome"
                      value={editando.nome}
                      onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                      autoFocus
                    />
                    <span className="pu-email">{u.email_institucional}</span>
                    <input
                      aria-label="Telefone"
                      placeholder="(85) 99999-9999"
                      value={editando.telefone}
                      onChange={(e) => setEditando({ ...editando, telefone: e.target.value })}
                    />
                    <select
                      aria-label="Tipo"
                      value={editando.tipo_usuario}
                      onChange={(e) => setEditando({ ...editando, tipo_usuario: e.target.value })}
                    >
                      {Object.entries(TIPOS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
                    </select>
                    <button type="submit" className="pa-devolver" disabled={ocupado}>Salvar</button>
                    <button type="button" className="pa-editar" onClick={() => setEditando(null)}>Cancelar</button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={u.id_usuario}>
                <td><strong className="pc-nome">{u.nome}</strong></td>
                <td>{u.email_institucional}</td>
                <td>{formatarTelefone(u.telefone)}</td>
                <td><span className={`pu-tipo ${u.tipo_usuario}`}>{TIPOS[u.tipo_usuario] ?? u.tipo_usuario}</span></td>
                <td>
                  <div className="pa-acoes">
                    <button
                      className="pa-editar"
                      disabled={ocupado}
                      onClick={() => setEditando({
                        id_usuario: u.id_usuario,
                        nome: u.nome,
                        telefone: u.telefone ?? '',
                        tipo_usuario: u.tipo_usuario,
                      })}
                    >
                      Editar
                    </button>
                    <button className="pa-devolver" onClick={() => remover(u)} disabled={ocupado}>Remover</button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {visiveis.length === 0 && !erro && (
        <p className="pa-vazio">{termo ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}</p>
      )}
    </>
  );
}

export default UsuariosAdm;
