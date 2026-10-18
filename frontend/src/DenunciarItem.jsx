import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { buscar, enviar } from './api';
import './GerenciarItem.css';

const MOTIVO_MAX = 500; // mesmo limite do backend

// Formulário do aluno: escolhe um item perdido e escreve o motivo; vai para Denúncias do admin
function DenunciarItem() {
  const [itens, setItens] = useState([]);
  const [idItem, setIdItem] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscar('/itens/perdidos')
      .then(setItens)
      .catch((e) => setErro(e.message || 'Não foi possível carregar os itens.'));
  }, []);

  async function denunciar(e) {
    e.preventDefault();
    if (!idItem || !motivo.trim()) return setErro('Escolha o item e escreva o motivo.');
    setEnviando(true);
    setErro('');
    const falha = await enviar('/denuncias', 'POST', { id_item: Number(idItem), motivo });
    setEnviando(false);
    if (falha) return setErro(falha);
    setEnviada(true);
  }

  function novaDenuncia() {
    setIdItem('');
    setMotivo('');
    setEnviada(false);
  }

  return (
    <main className="gi-conteudo">
      <h1 className="gi-titulo">Denunciar</h1>

      {enviada ? (
        <section className="gi-aviso" role="status">
          <CircleCheck size={44} className="gi-aviso-icone" aria-hidden="true" />
          <h2>Denúncia enviada!</h2>
          <p>A administração vai analisar o seu relato.</p>
          <button className="gi-registrar" onClick={novaDenuncia}>Fazer outra denúncia</button>
        </section>
      ) : (
        <form className="aluno-denuncia" onSubmit={denunciar}>
          <label className="gi-campo">
            Item
            <select value={idItem} onChange={(e) => setIdItem(e.target.value)} required>
              <option value="">Selecione o item</option>
              {itens.map((i) => (
                <option key={i.id_item} value={i.id_item}>
                  {i.nome_objeto} · {new Date(i.data_horario).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </label>

          <label className="gi-campo">
            Motivo
            <textarea
              rows={6}
              maxLength={MOTIVO_MAX}
              placeholder="Conte o que aconteceu"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
            <small>{motivo.length}/{MOTIVO_MAX}</small>
          </label>

          {erro && <p className="gi-erro" role="alert">{erro}</p>}
          <button type="submit" className="gi-registrar" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar denúncia'}
          </button>
        </form>
      )}
    </main>
  );
}

export default DenunciarItem;
