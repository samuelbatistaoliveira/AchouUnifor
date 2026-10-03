import { useState } from 'react';
import { HelpCircle, Info, Search, FileText, Bell, User, Lock, Eye, EyeOff, ExternalLink, ArrowRight } from 'lucide-react';
import './App.css';
import logoUnifor from './assets/logo-achouunifor.png';

function App() {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleLogin(e) {
  e.preventDefault();
  console.log("handleLogin foi chamado");


  try {
    const resposta = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        matricula: matricula,
        senha: senha
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.mensagem);
      return;
    }

    localStorage.setItem("token", dados.token);

    alert("Login realizado com sucesso!");

  } catch (erro) {
    console.error("Erro ao realizar login:", erro);
    alert("Não foi possível conectar ao servidor.");
  }
}

  return (
    <div className="container-geral">
      {/* Barra de Navegação Superior */}
      <header className="navbar">
        <div className="navbar-esquerda">
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
                <div className="conteudo-texto">
                  <strong>Consulte itens</strong>
                  <p>Veja se seu objeto foi encontrado no setor de segurança da UNIFOR.</p>
                </div>
              </div>

              <div className="item-recurso">
                <div className="circulo-icone"><FileText size={20} /></div>
                <div className="conteudo-texto">
                  <strong>Registre uma denúncia</strong>
                  <p>Informe os detalhes do seu item perdido e seja notificado quando ele for encontrado.</p>
                </div>
              </div>

              <div className="item-recurso">
                <div className="circulo-icone"><Bell size={20} /></div>
                <div className="conteudo-texto">
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
                <Search size={40} className="icone-sacola-grande" />
                <h4>
                  Achou<span className="destaque-unifor">UNIFOR</span>
                </h4>
                <p>Sistema de Achados e Perdidos</p>
              </div>

              <div className="divisor-h" />

              <p className="instrucao-login">
                Use sua matrícula e a senha da sua conta institucional da UNIFOR para acessar o sistema.
              </p>

              <form className="formulario" onSubmit={handleLogin}>
                <div className="grupo-input">
                  <label>Matrícula</label>
                  <div className="input-com-icone">
                    <User size={18} className="icone-input" />
                    <input
                      type="text"
                      placeholder="Ex.: 20212345"
                      maxLength={8}
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="grupo-input">
                  <label>Senha</label>
                  <div className="input-com-icone">
                    <Lock size={18} className="icone-input" />

                    {/* O tipo muda entre 'text' e 'password' dependendo do estado */}
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Digite sua senha"
                      maxLength={8}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value.replace(/\D/g, ''))}
                    />

                    {/* O ícone muda e ao clicar inverte o valor de mostrarSenha */}
                    {mostrarSenha ? (
                      <Eye size={18} className="icone-olho" onClick={() => setMostrarSenha(false)} />
                    ) : (
                      <EyeOff size={18} className="icone-olho" onClick={() => setMostrarSenha(true)} />
                    )}
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