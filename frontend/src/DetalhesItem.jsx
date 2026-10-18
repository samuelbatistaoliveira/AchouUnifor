import { useEffect, useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import './DetalhesItem.css';
import { enviar, tokenSalvo } from './api';

const STATUS_ITEM = { achado: 'Achado', perdido: 'Perdido', devolvido: 'Devolvido' };

// `topbar`: a barra de cima de quem abriu o detalhe, para os botões funcionarem aqui também
// `aoEditar`: só o admin passa; com ele aparecem status, local, descrição, editar e alterar status
// `aoStatusAlterado(item)`: avisa quem abriu o detalhe, para a lista ficar com o status novo
function DetalhesItem({ item, aoVoltar, topbar, aoEditar, aoStatusAlterado }) {
    const admin = !!aoEditar;
    const [imagens, setImagens] = useState([]);
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [novoStatus, setNovoStatus] = useState(item?.status ?? '');
    const [alterando, setAlterando] = useState(false);
    const [avisoStatus, setAvisoStatus] = useState({ texto: '', erro: false });

    async function alterarStatus() {
        setAlterando(true);
        setAvisoStatus({ texto: '', erro: false });
        const falha = await enviar(`/itens/${item.id_item}/status`, 'PATCH', { status: novoStatus });
        setAlterando(false);
        if (falha) return setAvisoStatus({ texto: falha, erro: true });
        setAvisoStatus({ texto: `Status alterado para ${STATUS_ITEM[novoStatus]}.`, erro: false });
        aoStatusAlterado?.({ ...item, status: novoStatus });
    }

    useEffect(() => {
        async function carregarGaleria() {
            if (!item?.id_item) return;

            const token = tokenSalvo(); // login sem "lembrar" fica no sessionStorage
            try {
                const resposta = await fetch(
                    `http://localhost:3000/imagens/item/${item.id_item}`,
                    {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    }
                );

                if (resposta.ok) {
                    const dados = await resposta.json();
                    const listaImagens = dados.imagens || [];
                    setImagens(listaImagens);
                    if (listaImagens.length > 0) {
                        setImagemSelecionada(listaImagens[0].url);
                    }
                }
            } catch (e) {
                console.error('Erro ao carregar galeria de imagens:', e);
            }
        }

        carregarGaleria();
    }, [item]);

    // Formatação de data e hora
    const dataFormatada = item?.data_horario
        ? new Date(item.data_horario).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Data não informada';

    return (
        <div className="ecra-detalhes-geral">
            {topbar}

            {/* Conteúdo Principal de Detalhes */}
            <div className="container-detalhes">

                {/* Botão Voltar */}
                <button className="botao-voltar" onClick={aoVoltar}>
                    <ArrowLeft size={18} />
                    Voltar à lista
                </button>

                <main className="conteudo-detalhes">

                    {/* Coluna Esquerda: Galeria de Imagens */}
                    <div className="coluna-imagens">
                        <div className="imagem-principal">
                            {imagemSelecionada ? (
                                <img
                                    src={imagemSelecionada}
                                    alt={item?.nome_objeto}
                                    className="imagem-exibida"
                                />
                            ) : (
                                <div className="placeholder-x" />
                            )}
                        </div>

                        {/* Miniaturas */}
                        {imagens.length > 0 && (
                            <div className="miniaturas">
                                {imagens.map((img, index) => (
                                    <div
                                        key={img.id_imagem || index}
                                        className={`miniatura ${imagemSelecionada === img.url ? 'ativa' : ''}`}
                                        onClick={() => setImagemSelecionada(img.url)}
                                    >
                                        <img src={img.url} alt={`Miniatura ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Coluna Direita: Informações do Item */}
                    <div className="coluna-info">
                        <h1>{item?.nome_objeto || 'Sem nome'}</h1>
                        {admin && <span className={`inicio-status ${item.status}`}>{STATUS_ITEM[item.status] ?? item.status}</span>}

                        <div className="especificacoes">
                            <div className="linha-especificacao">
                                <span className="rotulo">Categoria:</span>
                                <span className="valor">{item?.categoria || 'Não informada'}</span>
                            </div>
                            <div className="linha-especificacao">
                                <span className="rotulo">Material:</span>
                                <span className="valor">{item?.material || 'Não informado'}</span>
                            </div>
                            <div className="linha-especificacao">
                                <span className="rotulo">Cor:</span>
                                <span className="valor">{item?.cor || 'Não informada'}</span>
                            </div>
                            <div className="linha-especificacao mt-forte">
                                <span className="rotulo">Data e horário:</span>
                                <span className="valor">{dataFormatada}</span>
                            </div>
                            {admin && (
                                <>
                                    <div className="linha-especificacao">
                                        <span className="rotulo">Local encontrado:</span>
                                        <span className="valor">{item.local_encontrado || 'Não informado'}</span>
                                    </div>
                                    <div className="linha-especificacao detalhe-descricao">
                                        <span className="rotulo">Descrição:</span>
                                        <span className="valor">{item.descricao || 'Sem descrição.'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {admin ? (
                            <div className="detalhe-acoes">
                                <button className="detalhe-editar" onClick={aoEditar}>Editar Informações</button>

                                <label className="detalhe-status-campo">
                                    Status do item
                                    <select value={novoStatus} onChange={(e) => { setNovoStatus(e.target.value); setAvisoStatus({ texto: '', erro: false }); }}>
                                        {Object.entries(STATUS_ITEM).map(([valor, rotulo]) => (
                                            <option key={valor} value={valor}>{rotulo}</option>
                                        ))}
                                    </select>
                                </label>
                                <small className="detalhe-dica">Só itens "Perdido" aparecem para os alunos.</small>

                                <button
                                    className="detalhe-alterar-status"
                                    onClick={alterarStatus}
                                    disabled={alterando || novoStatus === item.status}
                                >
                                    {alterando ? 'Alterando...' : 'Alterar Status'}
                                </button>
                                {avisoStatus.texto && (
                                    <p className={avisoStatus.erro ? 'detalhe-erro' : 'detalhe-ok'} role={avisoStatus.erro ? 'alert' : 'status'}>
                                        {avisoStatus.texto}
                                    </p>
                                )}
                            </div>
                        ) : (
                        <div className="aviso-seguranca">
                            <div className="tarjeta-aviso">
                                <Lock size={20} className="icone-trava-aviso" />
                                <strong>Para retirada do objeto apenas presencialmente</strong>
                            </div>
                            <p className="texto-seguranca">
                                Por questões de segurança, informações detalhadas sobre o objeto, como o local onde foi encontrado e outros detalhes, estão disponíveis apenas no setor de segurança da UNIFOR.
                            </p>
                        </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

export default DetalhesItem;