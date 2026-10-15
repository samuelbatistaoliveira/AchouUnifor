import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './Notificacoes.css';

function Notificacoes({ aoVoltar }) {
  // Dados simulando o que virá do backend no futuro
  const notificacoes = [
    {
      id: 1,
      titulo: 'Possível correspondência',
      descricao: 'Um item achado parece com o seu registro "Garrafa térmica".',
      tempo: 'Há 5 minutos',
      lida: false
    },
    {
      id: 2,
      titulo: 'Item encontrado',
      descricao: 'Status da sua denúncia "Garrafa Térmica" Atualizado.',
      tempo: 'Há 2 Horas',
      lida: true
    },
    {
      id: 3,
      titulo: 'Novo Item Cadastrado',
      descricao: '"Carregador USB - C Branco" foi registrado.',
      tempo: 'ontem',
      lida: true
    },
    {
      id: 4,
      titulo: 'Novo Item Cadastrado',
      descricao: '"Caderno Azul" foi registrado.',
      tempo: 'ontem',
      lida: true
    }
  ];

  return (
    <div className="container-notificacoes">
        <button className="botao-voltar" onClick={aoVoltar} style={{ marginBottom: '32px' }}>
        <ArrowLeft size={18} />
        Voltar
      </button>
      <h1>Notificações</h1>
      
      <div className="lista-notificacoes">
        {notificacoes.map((notif) => (
          <div key={notif.id} className={`cartao-notificacao ${notif.lida ? 'lida' : 'nao-lida'}`}>
            
            {/* Bolinha de Status */}
            <div className="notificacao-icone">
              <div className={`ponto-status ${notif.lida ? 'ponto-cinza' : 'ponto-azul'}`}></div>
            </div>

            {/* Textos */}
            <div className="notificacao-conteudo">
              <div className="notificacao-cabecalho">
                <strong>{notif.titulo}</strong>
                <span className="notificacao-tempo">{notif.tempo}</span>
              </div>
              <p>{notif.descricao}</p>
            </div>

            {/* Botão */}
            <div className="notificacao-acao">
              <button className={notif.lida ? 'btn-secundario' : 'btn-primario'}>
                Ver item
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default Notificacoes;