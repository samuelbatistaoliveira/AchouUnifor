import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API, tokenSalvo } from '../api';
import '../GerenciarItem.css';

// mesmos limites do backend (config/upload.js)
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAX = 5 * 1024 * 1024;

// Envia cada foto para `caminho` (ex.: "/imagens/12"); devolve quantas falharam
export async function enviarFotos(caminho, fotos) {
  const envios = await Promise.all(
    fotos.map(({ arquivo }) => {
      const corpo = new FormData();
      corpo.append('imagem', arquivo);
      return fetch(`${API}${caminho}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenSalvo()}` },
        body: corpo,
      }).then((r) => r.ok, () => false);
    })
  );
  return envios.filter((ok) => !ok).length;
}

// Área de arrastar ou clicar para escolher fotos, com as pré-visualizações.
// `fotos` = [{ arquivo, url }] fica com quem usa, para enviar depois de salvar.
function CampoFotos({ rotulo, fotos, aoMudar, aoErro, max }) {
  const [arrastando, setArrastando] = useState(false);

  // libera as pré-visualizações ao sair da tela
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(() => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  function adicionar(lista) {
    const arquivos = [...lista];
    const invalidos = arquivos.filter((a) => !TIPOS_FOTO.includes(a.type) || a.size > TAMANHO_MAX);
    let validos = arquivos.filter((a) => !invalidos.includes(a));
    let erro = invalidos.length ? 'Envie apenas imagens JPG, PNG ou WEBP de até 5 MB.' : '';

    if (max && fotos.length + validos.length > max) {
      validos = validos.slice(0, Math.max(0, max - fotos.length));
      erro = `Envie no máximo ${max} fotos.`;
    }

    aoErro(erro);
    aoMudar([...fotos, ...validos.map((arquivo) => ({ arquivo, url: URL.createObjectURL(arquivo) }))]);
  }

  function remover(url) {
    URL.revokeObjectURL(url);
    aoMudar(fotos.filter((f) => f.url !== url));
  }

  return (
    <>
      <span className="gi-rotulo">{rotulo}</span>
      <label
        className={`gi-upload${arrastando ? ' arrastando' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); adicionar(e.dataTransfer.files); }}
      >
        <input
          className="gi-arquivo"
          type="file"
          accept={TIPOS_FOTO.join(',')}
          multiple
          onChange={(e) => { adicionar(e.target.files); e.target.value = ''; }}
        />
        <strong>+ Adicionar fotos</strong>
        <small>Arraste ou clique para enviar</small>
      </label>

      {fotos.length > 0 && (
        <div className="gi-previas">
          {fotos.map((f) => (
            <div key={f.url} className="gi-previa">
              <img src={f.url} alt={f.arquivo.name} />
              <button type="button" onClick={() => remover(f.url)} aria-label={`Remover ${f.arquivo.name}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CampoFotos;
