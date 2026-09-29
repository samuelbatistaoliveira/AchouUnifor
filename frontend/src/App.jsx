import { useState } from 'react';
import { HelpCircle, Info, Search, FileText, Bell, User, Lock, EyeOff, ExternalLink, ArrowRight } from 'lucide-react';
import './App.css';
import logoUnifor from './assets/logo-achouunifor.png';

function App() {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);

  return (
    <div className="container-geral">
      {/* Barra de Navegação Superior */}
      <header className="navbar">
        <div className="navbar-esquerda">
          {/* Substituímos o <h1> pela tag img */}
          <img src={logoUnifor} alt="Logótipo AchouUnifor" className="logo-navbar" />

          <div className="divisor-v" />
          <Search size={24} className="icone-sacola" />
          <span>Sistema de Achados e Perdidos</span>
        </div>
        <div className="navbar-direita">
          <a href="#"><HelpCircle size={18} /> Ajuda</a>
          <a href="#"><Info size={18} /> Sobre</a>
        </div>
      </header>

      {/* Conteúdo Principal com Imagem de Fundo */}
      <main className="conteudo-principal">
        <div className="flex-layout">
          {/* Coluna da Esquerda (Texto e Recursos) */}
          <div className="secao-texto">
            <h2>AchouUNIFOR</h2>
            <h3>Conectando você aos seus objetos.</h3>
            <p>
              Consulte os itens encontrados no campus e registre uma denúncia do seu item perdido de forma rápida e segura.
            </p>

            <div className="lista-recursos">
              <div className="item-recurso">
                <div className="circulo-icone"><Search size={20} /></div>
                <div>
                  <strong>Consulte itens</strong>
                  <p>Veja se seu objeto foi encontrado no setor de segurança da UNIFOR.</p>
                </div>
              </div>
              <div className="item-recurso">
                <div className="circulo-icone"><FileText size={20} /></div>
                <div>
                  <strong>Registre uma denúncia</strong>
                  <p>Informe os detalhes do seu item perdido e seja notificado quando ele for encontrado.</p>
                </div>
              </div>
              <div className="item-recurso">
                <div className="circulo-icone"><Bell size={20} /></div>
                <div>
                  <strong>Receba notificações</strong>
                  <p>Acompanhe o status da sua denúncia em tempo real.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Cartão de Login) */}
          <div className="secao-form">
            <div className="cartao-login">
              <div className="logo-cartao">
                <Search size={40} className="icone-sacola-grande" /> {/* Usando Search como sacola temporária */}
                <h4>
                  Achou<span className="destaque-unifor">UNIFOR</span>
                </h4>
                <p>Sistema de Achados e Perdidos</p>
              </div>

              <div className="divisor-h" />

              <p className="instrucao-login">
                Use sua matrícula e a senha da sua conta institucional da UNIFOR para acessar o sistema.
              </p>

              <form className="formulario">
                <div className="grupo-input">
                  <label>Matrícula</label>
                  <div className="input-com-icone">
                    <User size={18} className="icone-input" />
                    <input type="text" placeholder="Ex.: 20212345" />
                  </div>
                </div>

                <div className="grupo-input">
                  <label>Senha</label>
                  <div className="input-com-icone">
                    <Lock size={18} className="icone-input" />
                    <input type="password" placeholder="Digite sua senha" />
                    <EyeOff size={18} className="icone-olho" />
                  </div>
                </div>

                <div className="linha-acoes">
                  <label className="checkbox-container">
                    <input type="checkbox" checked={lembrar} onChange={() => setLembrar(!lembrar)} />
                    <span className="checkmark"></span>
                    Lembrar de mim
                  </label>
                  <a href="#" className="link-esqueceu">
                    Esqueci minha senha <ExternalLink size={14} />
                  </a>
                </div>

                <button type="submit" className="botao-entrar">
                  Entrar <ArrowRight size={18} />
                </button>
              </form>

              <div className="divisor-ou">
                <span>ou</span>
              </div>

              <div className="info-alerta">
                <Info size={20} />
                <div>
                  <strong>Não tem conta no AchouUNIFOR.</strong>
                  <p>Alunos e administradores acessam o sistema com a mesma conta institucional da UNIFOR.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;