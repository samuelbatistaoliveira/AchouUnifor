import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CircleCheck, X, Trash2 } from 'lucide-react';
import CampoFotos, { enviarFotos } from '../../components/CampoFotos';
import { BLOCOS } from '../../utils/constantes';
import useCategorias from '../../hooks/useCategorias';
import useItem from '../../hooks/useItem';
import { API, tokenSalvo } from '../../services/api';
import '../../styles/GerenciarItem.css';

const VAZIO = {
  nome: '', descricao: '', bloco: '', referencia: '',
  categoria: '', status: '', data: '', horario: ''
};

function formDoItem(item) {
  const local = item.local_encontrado ?? '';
  const bloco = BLOCOS.find(
    (b) => local === b || local.startsWith(`${b} - `)
  ) ?? '';
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

function GerenciarItem() {
  const { id } = useParams();
  return id ? <EditarItem id={id} /> : <FormularioItem />;
}

function EditarItem({ id }) {
  const { item, erro } = useItem(`/itens/${id}`);

  if (item) return <FormularioItem item={item} />;

  return (
    <main className="gi-conteudo">
      <p
        className={erro ? 'gi-erro' : undefined}
        role={erro ? 'alert' : 'status'}
      >
        {erro || 'Carregando item...'}
      </p>
    </main>
  );
}

function FormularioItem({ item: itemEditado }) {
  const navigate = useNavigate();
  const editando = !!itemEditado;

  const [form, setForm] = useState(
    () => editando ? formDoItem(itemEditado) : VAZIO
  );

  const [fotos, setFotos] = useState([]);
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);
  const [excluindoFoto, setExcluindoFoto] = useState(null);
  const [fotoParaExcluir, setFotoParaExcluir] = useState(null);
  const cancelarModalRef = useRef(null);
  const abrirModalRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [registrado, setRegistrado] = useState(null);

  const { categorias } = useCategorias();

  const mudar = (campo) => (e) =>
    setForm((anterior) => ({
      ...anterior,
      [campo]: e.target.value
    }));

// Carrega as imagens já cadastradas no banco
  useEffect(() => {
    if (!itemEditado) return;

    let ativo = true;

    async function carregarFotos() {
      setCarregandoFotos(true);

      try {
        const resposta = await fetch(
          `${API}/imagens/item/${itemEditado.id_item}`,
          {
            headers: {
              Authorization: `Bearer ${tokenSalvo()}`
            }
          }
        );

        if (!resposta.ok) {
          throw new Error('Não foi possível carregar as fotos.');
        }

        const dados = await resposta.json();

        if (ativo) {
          setFotosExistentes(dados.imagens || []);
        }
      } catch (erro) {
        if (ativo) setErro(erro.message);
      } finally {
        if (ativo) setCarregandoFotos(false);
      }
    }

    carregarFotos();

    return () => {
      ativo = false;
    };
  }, [itemEditado?.id_item]);

  // Permite fechar o diálogo com Escape e mantém o foco dentro dele.
  useEffect(() => {
    if (fotoParaExcluir === null) return;

    cancelarModalRef.current?.focus();
    function aoPressionarTecla(evento) {
      if (evento.key === 'Escape' && excluindoFoto === null) {
        setFotoParaExcluir(null);
      }
      if (evento.key !== 'Tab') return;
      const botoes = [...document.querySelectorAll('.gi-modal button:not(:disabled)')];
      if (!botoes.length) return;
      const primeiro = botoes[0];
      const ultimo = botoes[botoes.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoPressionarTecla);
    return () => {
      document.removeEventListener('keydown', aoPressionarTecla);
      abrirModalRef.current?.focus();
    };
  }, [fotoParaExcluir, excluindoFoto]);

  async function removerFotoExistente(idImagem) {

    setErro('');
    setExcluindoFoto(idImagem);

    try {
      const resposta = await fetch(
        `${API}/imagens/${idImagem}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${tokenSalvo()}`
          }
        }
      );

      if (!resposta.ok) {
        throw new Error('Não foi possível excluir a foto.');
      }

      setFotosExistentes((anteriores) =>
        anteriores.filter((foto) => foto.id_imagem !== idImagem)
      );
      setFotoParaExcluir(null);
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setExcluindoFoto(null);
    }
  }

  function limpar() {
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    setFotos([]);
    setForm(VAZIO);
  }

  async function registrar(e) {
    e.preventDefault();
    setErro('');

    const {
      nome, descricao, bloco, referencia,
      categoria, status, data, horario
    } = form;

    if (!nome.trim() || !categoria || !status ||
        !bloco || !data || !horario) {
      setErro('Preencha nome, categoria, status, bloco, data e horário.');
      return;
    }

    const token = tokenSalvo();
    setEnviando(true);

    try {
      const resposta = await fetch(
        editando
          ? `${API}/itens/${itemEditado.id_item}`
          : `${API}/itens`,
        {
          method: editando ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nome_objeto: nome,
            descricao,
            categoria,
            data_horario: `${data}T${horario}`,
            local_encontrado: referencia.trim()
              ? `${bloco} - ${referencia.trim()}`
              : bloco,
            status,
          }),
        }
      );

      const item = await resposta.json();

      if (!resposta.ok) {
        setErro(
          item.mensagem ||
          (editando
            ? 'Não foi possível salvar as alterações.'
            : 'Não foi possível registrar o item.')
        );
        return;
      }

      const falhas = await enviarFotos(
        `/imagens/${item.id_item}`,
        fotos
      );

      if (!editando) limpar();

      setRegistrado({
        nome: item.nome_objeto,
        falhas
      });
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="gi-conteudo">
      {registrado ? (
        <>
          <h1 className="gi-titulo">Gerenciar item</h1>

          <section className="gi-aviso" role="status">
            <CircleCheck
              size={44}
              className="gi-aviso-icone"
              aria-hidden="true"
            />

            <p>
              <strong>
                {editando
                  ? 'Item atualizado com sucesso!'
                  : 'Item registrado com sucesso!'}
              </strong>
            </p>

            <p>
              {editando
                ? `As informações de "${registrado.nome}" foram salvas.`
                : `"${registrado.nome}" já está disponível na lista de Achados e Perdidos.`}
            </p>

            {registrado.falhas > 0 && (
              <p className="gi-erro">
                {registrado.falhas} foto(s) não foram enviadas.
              </p>
            )}

            <button
              className="gi-registrar"
              onClick={() => navigate('/painel/itens')}
            >
              Ver meus registros
            </button>

            <button
              className="gi-registrar"
              onClick={() => navigate('/')}
            >
              Voltar ao Início
            </button>
          </section>
        </>
      ) : (
        <>
          <h1 className="gi-titulo">
            {editando ? 'Editar item' : 'Registrar item'}
          </h1>

          <form className="gi-form" onSubmit={registrar}>
            <div className="gi-coluna">
              <label className="gi-campo">
                Nome do objeto
                <input
                  value={form.nome}
                  onChange={mudar('nome')}
                  maxLength={100}
                />
              </label>

              <label className="gi-campo">
                Descrição
                <textarea
                  rows={5}
                  value={form.descricao}
                  onChange={mudar('descricao')}
                />
              </label>

              <div className="gi-linha">
                <label className="gi-campo">
                  Bloco
                  <select
                    value={form.bloco}
                    onChange={mudar('bloco')}
                  >
                    <option value="">Selecione</option>
                    {BLOCOS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>

                <label className="gi-campo">
                  Referência
                  <input
                    placeholder="ex: perto da cantina"
                    value={form.referencia}
                    onChange={mudar('referencia')}
                  />
                </label>
              </div>
            </div>

            <div className="gi-coluna">
              <div className="gi-linha">
                <label className="gi-campo">
                  Categoria
                  <select
                    value={form.categoria}
                    onChange={mudar('categoria')}
                  >
                    <option value="">Selecione</option>
                    {categorias.map((c) => (
                      <option key={c.id_categoria}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>

                {!editando && (
                  <label className="gi-campo">
                    Status
                    <select
                      value={form.status}
                      onChange={mudar('status')}
                    >
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
                  <input
                    type="date"
                    value={form.data}
                    onChange={mudar('data')}
                  />
                </label>

                <label className="gi-campo">
                  Horário
                  <input
                    type="time"
                    value={form.horario}
                    onChange={mudar('horario')}
                  />
                </label>
              </div>

              {/* Fotos que já estão cadastradas */}
              {editando && (
                <div className="gi-fotos-existentes">
                  <span className="gi-rotulo">
                    Fotos cadastradas
                  </span>

                  {carregandoFotos && (
                    <p>Carregando fotos...</p>
                  )}

                  {!carregandoFotos &&
                    fotosExistentes.length === 0 && (
                      <p>Nenhuma foto cadastrada.</p>
                    )}

                  <div className="gi-previas">
                    {fotosExistentes.map((foto) => (
                      <div
                        key={foto.id_imagem}
                        className="gi-previa"
                      >
                        <img
                          src={foto.url}
                          alt={`Foto ${foto.id_imagem} do item`}
                        />

                        <button
                          type="button"
                          onClick={(evento) => {
                          abrirModalRef.current = evento.currentTarget;
                          setFotoParaExcluir(foto.id_imagem);
                        }}
                          disabled={excluindoFoto !== null}
                          aria-label={`Excluir foto ${foto.id_imagem}`}
                          title="Excluir foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar novas fotos */}
              <CampoFotos
                rotulo={
                  editando
                    ? 'Adicionar mais fotos'
                    : 'Fotos do item'
                }
                fotos={fotos}
                aoMudar={setFotos}
                aoErro={setErro}
              />
            </div>

            <div className="gi-acoes">
              {erro && (
                <p className="gi-erro" role="alert">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                className="gi-registrar"
                disabled={enviando || excluindoFoto !== null}
              >
                {enviando
                  ? 'Salvando...'
                  : editando
                    ? 'Salvar alterações'
                    : 'Registrar Item'}
              </button>

              <button
                type="button"
                className="gi-cancelar"
                onClick={() => navigate('/')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </>
      )}

      {fotoParaExcluir !== null && (
        <div
          className="gi-modal-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && excluindoFoto === null) {
              setFotoParaExcluir(null);
            }
          }}
        >
          <div
            className="gi-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gi-modal-titulo"
            aria-describedby="gi-modal-descricao"
          >
            <div className="gi-modal-icone"><Trash2 size={26} /></div>
            <h2 id="gi-modal-titulo">Excluir esta foto?</h2>
            <p id="gi-modal-descricao">
              Essa imagem será removida permanentemente do item.
              Essa ação não poderá ser desfeita.
            </p>
            <div className="gi-modal-acoes">
              <button
                ref={cancelarModalRef}
                type="button"
                className="gi-modal-cancelar"
                disabled={excluindoFoto !== null}
                onClick={() => setFotoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="gi-modal-excluir"
                disabled={excluindoFoto !== null}
                onClick={() => removerFotoExistente(fotoParaExcluir)}
              >
                <Trash2 size={17} />
                {excluindoFoto !== null ? 'Excluindo...' : 'Excluir foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default GerenciarItem;
