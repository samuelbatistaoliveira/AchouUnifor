import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, User, Bell, HelpCircle, Info, Search } from 'lucide-react';
import './DetalhesItem.css';
import logoUnifor from './assets/logo-achouunifor.png'; // Garanta que o caminho do logótipo está correto
import { tokenSalvo } from './api';

function DetalhesItem({ item, aoVoltar, aoAbrirNotificacoes }) {
    const [imagens, setImagens] = useState([]);
    const [imagemSelecionada, setImagemSelecionada] = useState(null);

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
            {/* Barra de Navegação Superior (Para contextualizar como o wireframe) */}
            <header className="navbar-detalhes">
                <div className="navbar-esquerda">
                    <button className="logo-botao" onClick={aoVoltar} aria-label="Ir para o início">
                        <img src={logoUnifor} alt="Logótipo AchouUnifor" className="logo-navbar" />
                    </button>
                    <h1 className="titulo-navbar">AchouUNIFOR</h1>
                </div>

                <div className="navbar-direita">
                    <a href="#" className="ativo-nav">Início</a>
                    <a href="#">Denunciar</a>

                    {/* O botão Notificações a funcionar corretamente */}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            aoAbrirNotificacoes?.(); // o aluno ainda não tem notificações
                        }}
                    >
                        Notificações
                    </a>

                    <User size={32} className="icone-usuario" />
                </div>
            </header>

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
                        </div>

                        <div className="aviso-seguranca">
                            <div className="tarjeta-aviso">
                                <Lock size={20} className="icone-trava-aviso" />
                                <strong>Para retirada do objeto apenas presencialmente</strong>
                            </div>
                            <p className="texto-seguranca">
                                Por questões de segurança, informações detalhadas sobre o objeto, como o local onde foi encontrado e outros detalhes, estão disponíveis apenas no setor de segurança da UNIFOR.
                            </p>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}

export default DetalhesItem;