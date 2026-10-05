import { useState } from 'react';
import { HelpCircle, Info, Search, FileText, Bell, User, Lock, Eye, EyeOff, ExternalLink, ArrowRight, Mail } from 'lucide-react';
import './App.css';
import logoUnifor from './assets/logo-achouunifor.png';
import Cadastro from './Cadastro';
import { motion } from 'framer-motion';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // ... (o seu handleLogin continua aqui)
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
  // Lógica para trocar de ecrã
  if (telaAtual === 'cadastro') {
    return <Cadastro aoVoltar={() => setTelaAtual('login')} />;
  }

  return (
    <motion.div
      className="container-geral"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
    >
      {/* O SEU CÓDIGO DA NAVBAR E CONTEÚDO CONTINUA AQUI PARA BAIXO */}
      {/* ... */}
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

                  {/* CAMPO DE E-MAIL */}
                  <div className="grupo-input">
                    <label>E-mail</label>
                    <div className="input-com-icone">
                      <Mail size={18} className="icone-input" />
                      <input
                        type="email"
                        placeholder="Ex.: aluno@unifor.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* CAMPO DE SENHA */}
                  <div className="grupo-input">
                    <label>Senha</label>
                    <div className="input-com-icone">
                      <Lock size={18} className="icone-input" />
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                      />
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

                  {/* BOTÕES ATUALIZADOS */}
                  <div className="botoes-acao">
                    <button type="submit" className="botao-entrar">
                      Entrar <ArrowRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="botao-criar-conta"
                      onClick={() => setTelaAtual('cadastro')}
                    >
                      Criar conta
                    </button>
                  </div>

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
    </motion.div>
  );
}

export default App;