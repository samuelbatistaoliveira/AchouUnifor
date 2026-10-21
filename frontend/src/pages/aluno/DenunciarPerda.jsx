import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import CampoFotos, { enviarFotos } from '../../components/CampoFotos';
import { BLOCOS } from '../../utils/constantes';
import useCategorias from '../../hooks/useCategorias';
import { API, tokenSalvo } from '../../services/api';
import '../../styles/GerenciarItem.css';

const MAX_FOTOS = 5; // mesmo limite do backend
const VAZIO = { nome: '', descricao: '', bloco: '', referencia: '', categoria: '', data: '', horario: '' };

// O aluno conta o que perdeu; a denúncia vai só para o admin (tela Denúncias) e para "Minhas denúncias"
function DenunciarPerda({ aoNavegar }) {
  const [form, setForm] = useState(VAZIO);
  const [fotos, setFotos] = useState([]); // { arquivo, url }
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviada, setEnviada] = useState(null); // { nome, falhas } depois de enviar
  const { categorias } = useCategorias();
  const hoje = new Date().toLocaleDateString('en-CA'); // a perda não pode ser no futuro

  const mudar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function denunciar(e) {
    e.preventDefault();
    setErro('');

    const { nome, descricao, bloco, referencia, categoria, data, horario } = form;
    if (!nome.trim() || !categoria || !bloco || !data || !horario) {
      setErro('Preencha nome, categoria, bloco, data e horário.');
      return;
    }

    setEnviando(true);
    try {
      const resposta = await fetch(`${API}/denuncias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSalvo()}` },
        body: JSON.stringify({
          nome_objeto: nome,
          descricao,
          categoria,
          data_perda: `${data}T${horario}`,
          local_perda: referencia.trim() ? `${bloco} - ${referencia.trim()}` : bloco,
        }),
      });
      const denuncia = await resposta.json();

      if (!resposta.ok) {
        setErro(denuncia.mensagem || 'Não foi possível enviar a denúncia.');
        return;
      }

      // a denúncia já existe: uma foto que falhar não desfaz o envio
      const falhas = await enviarFotos(`/denuncias/${denuncia.id_denuncia}/imagens`, fotos);
      setEnviada({ nome: denuncia.nome_objeto, falhas });
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="gi-conteudo">
      <h1 className="gi-titulo">Denunciar Perda</h1>

      {enviada ? (
        <section className="gi-aviso" role="status">
          <CircleCheck size={44} className="gi-aviso-icone" aria-hidden="true" />
          <p><strong>Denúncia enviada!</strong></p>
          <p>A administração vai analisar a perda de "{enviada.nome}".</p>
          {enviada.falhas > 0 && <p className="gi-erro">{enviada.falhas} foto(s) não foram enviadas.</p>}
          <button className="gi-registrar" onClick={() => aoNavegar('minhas-denuncias')}>Ver minhas denúncias</button>
          <button className="gi-registrar" onClick={() => aoNavegar('inicio')}>Voltar ao Início</button>
        </section>
      ) : (
        <form className="gi-form" onSubmit={denunciar}>
          <div className="gi-coluna">
            <label className="gi-campo">
              Nome do objeto
              <input placeholder="Ex: Garrafa de metal" value={form.nome} onChange={mudar('nome')} maxLength={100} />
            </label>

            <label className="gi-campo">
              Descrição
              <textarea
                rows={5}
                maxLength={1000}
                placeholder="Ex: Garrafa de metal com adesivos na parte de baixo, perdida perto da porta de entrada da biblioteca"
                value={form.descricao}
                onChange={mudar('descricao')}
              />
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
                <input placeholder="ex: perto da cantina" value={form.referencia} onChange={mudar('referencia')} maxLength={200} />
              </label>
            </div>
          </div>

          <div className="gi-coluna">
            <label className="gi-campo">
              Categoria
              <select value={form.categoria} onChange={mudar('categoria')}>
                <option value="">Selecione</option>
                {categorias.map((c) => <option key={c.id_categoria}>{c.nome}</option>)}
              </select>
            </label>

            <div className="gi-linha">
              <label className="gi-campo">
                Data
                <input type="date" max={hoje} value={form.data} onChange={mudar('data')} />
              </label>
              <label className="gi-campo">
                Horário aproximado
                <input type="time" value={form.horario} onChange={mudar('horario')} />
              </label>
            </div>

            <CampoFotos
              rotulo={`Fotos do item perdido (opcional, até ${MAX_FOTOS})`}
              fotos={fotos}
              aoMudar={setFotos}
              aoErro={setErro}
              max={MAX_FOTOS}
            />
          </div>

          <div className="gi-acoes">
            {erro && <p className="gi-erro" role="alert">{erro}</p>}
            <button type="submit" className="gi-registrar" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Realizar Denúncia'}
            </button>
            <button type="button" className="gi-cancelar" onClick={() => aoNavegar('inicio')}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export default DenunciarPerda;
