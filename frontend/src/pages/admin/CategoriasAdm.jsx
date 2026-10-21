import { useState } from 'react';
import useCategorias from '../../hooks/useCategorias';
import { enviar } from '../../services/api';

function CategoriasAdm() {
  const { categorias, erro: erroLista, recarregar } = useCategorias();
  const [nova, setNova] = useState('');
  const [editando, setEditando] = useState(null); // { id, nome }
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function executar(acao) {
    setOcupado(true);
    setErro('');
    const falha = await acao();
    setOcupado(false);
    if (falha) {
      setErro(falha);
      return false;
    }
    await recarregar();
    return true;
  }

  async function adicionar(e) {
    e.preventDefault();
    if (!nova.trim()) return setErro('Informe o nome da categoria.');
    if (await executar(() => enviar('/categorias', 'POST', { nome: nova }))) setNova('');
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    if (!editando.nome.trim()) return setErro('Informe o nome da categoria.');
    if (await executar(() => enviar(`/categorias/${editando.id}`, 'PUT', { nome: editando.nome }))) setEditando(null);
  }

  function remover(categoria) {
    const aviso = categoria.total_itens
      ? `Remover "${categoria.nome}"? Os ${categoria.total_itens} itens dela continuam cadastrados.`
      : `Remover "${categoria.nome}"?`;
    if (window.confirm(aviso)) executar(() => enviar(`/categorias/${categoria.id_categoria}`, 'DELETE'));
  }

  return (
    <>
      <h1 className="pa-titulo pa-titulo-solo">Gerenciar Categoria</h1>

      {(erro || erroLista) && <p className="pa-erro" role="alert">{erro || erroLista}</p>}

      <div className="pc-layout">
        <table className="pa-tabela">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Itens</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id_categoria}>
                {editando?.id === c.id_categoria ? (
                  <td colSpan={3}>
                    <form className="pc-edicao" onSubmit={salvarEdicao}>
                      <input
                        aria-label="Novo nome da categoria"
                        value={editando.nome}
                        onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                        maxLength={50}
                        autoFocus
                      />
                      <button type="submit" className="pa-devolver" disabled={ocupado}>Salvar</button>
                      <button type="button" className="pa-editar" onClick={() => setEditando(null)}>Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td><strong className="pc-nome">{c.nome}</strong></td>
                    <td>{c.total_itens}</td>
                    <td>
                      <div className="pa-acoes">
                        <button
                          className="pa-editar"
                          onClick={() => setEditando({ id: c.id_categoria, nome: c.nome })}
                          disabled={ocupado}
                        >
                          Editar
                        </button>
                        <button className="pc-remover" onClick={() => remover(c)} disabled={ocupado}>
                          Remover
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <form className="pc-nova" onSubmit={adicionar}>
          <h2>Nova categoria</h2>
          <label>
            Nome da categoria
            <input placeholder="ex.: Acessórios" value={nova} onChange={(e) => setNova(e.target.value)} maxLength={50} />
          </label>
          <button type="submit" className="pa-novo" disabled={ocupado}>Adicionar</button>
        </form>
      </div>

      {categorias.length === 0 && !erroLista && <p className="pa-vazio">Nenhuma categoria cadastrada.</p>}
    </>
  );
}

export default CategoriasAdm;
