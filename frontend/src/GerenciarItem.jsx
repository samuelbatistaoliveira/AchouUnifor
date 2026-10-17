import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Topbar from './components/Topbar';
import { CATEGORIAS, BLOCOS } from './constantes';
import './GerenciarItem.css';

const API = 'http://localhost:3000';
// mesmos limites do backend (config/upload.js)
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAX = 5 * 1024 * 1024;

const VAZIO = { nome: '', descricao: '', bloco: '', referencia: '', categoria: '', data: '', horario: '' };

function GerenciarItem({ aoNavegar, aoAbrirPerfil }) {
  const [form, setForm] = useState(VAZIO);
  const [fotos, setFotos] = useState([]); // { arquivo, url }
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // libera as pré-visualizações ao sair da tela
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function adicionarFotos(lista) {
    const arquivos = [...lista];
    const invalidos = arquivos.filter((a) => !TIPOS_FOTO.includes(a.type) || a.size > TAMANHO_MAX);
    setErro(invalidos.length ? 'Envie apenas imagens JPG, PNG ou WEBP de até 5 MB.' : '');
    const validos = arquivos.filter((a) => !invalidos.includes(a));
    setFotos((atuais) => [...atuais, ...validos.map((arquivo) => ({ arquivo, url: URL.createObjectURL(arquivo) }))]);
  }

  function removerFoto(url) {
    URL.revokeObjectURL(url);
    setFotos((atuais) => atuais.filter((f) => f.url !== url));
  }

  function limpar() {
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    setFotos([]);
    setForm(VAZIO);
  }

  async function registrar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const { nome, descricao, bloco, referencia, categoria, data, horario } = form;
    if (!nome.trim() || !categoria || !bloco || !data || !horario) {
      setErro('Preencha nome, categoria, bloco, data e horário.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setEnviando(true);

    try {
      const resposta = await fetch(`${API}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome_objeto: nome,
          descricao,
          categoria,
          data_horario: `${data}T${horario}`,
          local_encontrado: referencia.trim() ? `${bloco} - ${referencia.trim()}` : bloco,
        }),
      });
      const item = await resposta.json();

      if (!resposta.ok) {
        setErro(item.mensagem || 'Não foi possível registrar o item.');
        return;
      }

      // o item já existe: uma foto que falhar não desfaz o registro
      const envios = await Promise.all(
        fotos.map(({ arquivo }) => {
          const corpo = new FormData();
          corpo.append('imagem', arquivo);
          return fetch(`${API}/imagens/${item.id_item}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: corpo,
          }).then((r) => r.ok, () => false);
        })
      );
      const falhas = envios.filter((ok) => !ok).length;

      limpar();
      setSucesso(
        falhas
          ? `Item registrado, mas ${falhas} foto(s) não foram enviadas.`
          : 'Item registrado com sucesso!'
      );
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
        <h1 className="gi-titulo">Registrar item</h1>

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
            <label className="gi-campo">
              Categoria
              <select value={form.categoria} onChange={mudar('categoria')}>
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

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

            <span className="gi-rotulo">Fotos do item</span>
            <label
              className={`gi-upload${arrastando ? ' arrastando' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionarFotos(e.dataTransfer.files); }}
            >
              <input
                className="gi-arquivo"
                type="file"
                accept={TIPOS_FOTO.join(',')}
                multiple
                onChange={(e) => { adicionarFotos(e.target.files); e.target.value = ''; }}
              />
              <strong>+ Adicionar fotos</strong>
              <small>Arraste ou clique para enviar</small>
            </label>

            {fotos.length > 0 && (
              <div className="gi-previas">
                {fotos.map((f) => (
                  <div key={f.url} className="gi-previa">
                    <img src={f.url} alt={f.arquivo.name} />
                    <button type="button" onClick={() => removerFoto(f.url)} aria-label={`Remover ${f.arquivo.name}`}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="gi-acoes">
            {erro && <p className="gi-erro" role="alert">{erro}</p>}
            {sucesso && <p className="gi-sucesso" role="status">{sucesso}</p>}
            <button type="submit" className="gi-registrar" disabled={enviando}>
              {enviando ? 'Registrando...' : 'Registrar Item'}
            </button>
            <button type="button" className="gi-cancelar" onClick={() => aoNavegar('inicio')}>
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default GerenciarItem;
