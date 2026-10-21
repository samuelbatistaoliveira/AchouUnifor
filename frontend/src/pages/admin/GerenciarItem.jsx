import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import Topbar from '../../components/Topbar';
import CampoFotos, { enviarFotos } from '../../components/CampoFotos';
import { BLOCOS } from '../../utils/constantes';
import useCategorias from '../../hooks/useCategorias';
import '../../styles/GerenciarItem.css';

const API = 'http://localhost:3000';

const VAZIO = { nome: '', descricao: '', bloco: '', referencia: '', categoria: '', status: '', data: '', horario: '' };

// item salvo -> campos do formulário; o local é gravado como "Bloco X - referência"
function formDoItem(item) {
  const local = item.local_encontrado ?? '';
  const bloco = BLOCOS.find((b) => local === b || local.startsWith(`${b} - `)) ?? '';
  const quando = new Date(item.data_horario);
  return {
    ...VAZIO,
    nome: item.nome_objeto ?? '',
    descricao: item.descricao ?? '',
    bloco,
    referencia: bloco ? local.slice(bloco.length + 3) : local,
    categoria: item.categoria ?? '',
    status: item.status,
    data: quando.toLocaleDateString('en-CA'),
    horario: quando.toTimeString().slice(0, 5),
  };
}

// `item` presente = editar esse item; sem ele = registrar um novo
function GerenciarItem({ aoNavegar, aoAbrirPerfil, item: itemEditado }) {
  const editando = !!itemEditado;
  const [form, setForm] = useState(() => (editando ? formDoItem(itemEditado) : VAZIO));
  const [fotos, setFotos] = useState([]); // { arquivo, url }
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [registrado, setRegistrado] = useState(null); // { nome, falhas } depois de salvar
  const { categorias } = useCategorias();

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function limpar() {
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    setFotos([]);
    setForm(VAZIO);
  }

  async function registrar(e) {
    e.preventDefault();
    setErro('');

    const { nome, descricao, bloco, referencia, categoria, status, data, horario } = form;
    if (!nome.trim() || !categoria || !status || !bloco || !data || !horario) {
      setErro('Preencha nome, categoria, status, bloco, data e horário.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setEnviando(true);

    try {
      const resposta = await fetch(editando ? `${API}/itens/${itemEditado.id_item}` : `${API}/itens`, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome_objeto: nome,
          descricao,
          categoria,
          data_horario: `${data}T${horario}`,
          local_encontrado: referencia.trim() ? `${bloco} - ${referencia.trim()}` : bloco,
          status, // o PUT ignora: o status não muda por aqui
        }),
      });
      const item = await resposta.json();

      if (!resposta.ok) {
        setErro(item.mensagem || (editando ? 'Não foi possível salvar as alterações.' : 'Não foi possível registrar o item.'));
        return;
      }

      // o item já existe: uma foto que falhar não desfaz o registro
      const falhas = await enviarFotos(`/imagens/${item.id_item}`, fotos);

      if (!editando) limpar();
      setRegistrado({ nome: item.nome_objeto, falhas });
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="inicio">
      <Topbar ativo="gerenciar" aoNavegar={aoNavegar} aoAbrirPerfil={aoAbrirPerfil} />

      <main className="gi-conteudo">
        {registrado ? (
          <>
            <h1 className="gi-titulo">Gerenciar item</h1>
            <section className="gi-aviso" role="status">
              <CircleCheck size={44} className="gi-aviso-icone" aria-hidden="true" />
              <p><strong>{editando ? 'Item atualizado com sucesso!' : 'Item registrado com sucesso!'}</strong></p>
              <p>
                {editando
                  ? `As informações de "${registrado.nome}" foram salvas.`
                  : `"${registrado.nome}" já está disponível na lista de Achados e Perdidos.`}
              </p>
              {registrado.falhas > 0 && (
                <p className="gi-erro">{registrado.falhas} foto(s) não foram enviadas.</p>
              )}
              <button className="gi-registrar" onClick={() => aoNavegar('painel')}>Ver meus registros</button>
              <button className="gi-registrar" onClick={() => aoNavegar('inicio')}>Voltar ao Início</button>
            </section>
          </>
        ) : (
          <>
            <h1 className="gi-titulo">{editando ? 'Editar item' : 'Registrar item'}</h1>

            <form className="gi-form" onSubmit={registrar}>
              <div className="gi-coluna">
                <label className="gi-campo">
                  Nome do objeto
                  <input value={form.nome} onChange={mudar('nome')} maxLength={100} />
                </label>

                <label className="gi-campo">
                  Descrição
                  <textarea rows={5} value={form.descricao} onChange={mudar('descricao')} />
                </label>

                <div className="gi-linha">
                  <label className="gi-campo">
                    Bloco
                    <select value={form.bloco} onChange={mudar('bloco')}>
                      <option value="">Selecione</option>
                      {BLOCOS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label className="gi-campo">
                    Referência
                    <input placeholder="ex: perto da cantina" value={form.referencia} onChange={mudar('referencia')} />
                  </label>
                </div>
              </div>

              <div className="gi-coluna">
                <div className="gi-linha">
                  <label className="gi-campo">
                    Categoria
                    <select value={form.categoria} onChange={mudar('categoria')}>
                      <option value="">Selecione</option>
                      {categorias.map((c) => <option key={c.id_categoria}>{c.nome}</option>)}
                    </select>
                  </label>
                  {/* na edição o status não muda (fica para a tela de status) */}
                  {!editando && (
                    <label className="gi-campo">
                      Status
                      {/* só itens "perdido" aparecem na tela inicial dos alunos */}
                      <select value={form.status} onChange={mudar('status')}>
                        <option value="">Selecione</option>
                        <option value="perdido">Perdido</option>
                        <option value="achado">Achado</option>
                      </select>
                    </label>
                  )}
                </div>

                <div className="gi-linha">
                  <label className="gi-campo">
                    Data
                    <input type="date" value={form.data} onChange={mudar('data')} />
                  </label>
                  <label className="gi-campo">
                    Horário
                    <input type="time" value={form.horario} onChange={mudar('horario')} />
                  </label>
                </div>

                <CampoFotos
                  rotulo={editando ? 'Adicionar mais fotos' : 'Fotos do item'}
                  fotos={fotos}
                  aoMudar={setFotos}
                  aoErro={setErro}
                />
              </div>

              <div className="gi-acoes">
                {erro && <p className="gi-erro" role="alert">{erro}</p>}
                <button type="submit" className="gi-registrar" disabled={enviando}>
                  {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Registrar Item'}
                </button>
                <button type="button" className="gi-cancelar" onClick={() => aoNavegar('inicio')}>
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default GerenciarItem;
