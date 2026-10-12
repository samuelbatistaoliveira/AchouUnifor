import { useState } from 'react';
import { Search, User, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import './Login.css';

function Cadastro({ aoVoltar }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

async function realizarCadastro(evento) {
  evento.preventDefault();

  setErro('');

  if (!nome.trim() || !email.trim() || !senha) {
    setErro('Preencha todos os campos.');
    return;
  }

  if (!email.trim().toLowerCase().endsWith('@edu.unifor.br')) {
    setErro('Utilize seu e-mail institucional (@edu.unifor.br).');
    return;
  }

  if (senha.length < 8) {
    setErro('A senha deve ter pelo menos 8 caracteres.');
    return;
  }

  setCarregando(true);

  try {
    const resposta = await fetch('http://localhost:3000/auth/cadastro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.mensagem || 'Não foi possível realizar o cadastro.');
      return;
    }

    alert('Cadastro realizado com sucesso! Faça seu login.');
    aoVoltar();

  } catch (erro) {
    console.error('Erro ao cadastrar:', erro);
    setErro('Não foi possível conectar ao servidor.');
  } finally {
    setCarregando(false);
  }
}

  return (
    <motion.div
      className="container-geral"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
    >
      <main className="conteudo-principal">
        <div className="flex-layout">

          <div className="secao-texto">
            <h2>Junte-se ao AchouUNIFOR</h2>
            <h3>Crie sua conta para começar.</h3>
            <p>Faça parte da nossa rede solidária no campus. Encontrou algo? Perdeu algo? Nós ajudamos a conectar os alunos aos seus objetos.</p>
          </div>

          <div className="secao-form">
            <div className="cartao-login">
              <div className="logo-cartao">
                <Search size={40} className="icone-sacola-grande" />
                <h4>Criar <span className="destaque-unifor">Conta</span></h4>
              </div>

              <div className="divisor-h" />

              <form className="formulario" onSubmit={realizarCadastro}>
                <div className="grupo-input">
                  <label>Nome completo</label>
                  <div className="input-com-icone">
                    <User size={18} className="icone-input" />
                    <input type="text" placeholder="Ex.: Fernando Neto" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                </div>

                <div className="grupo-input">
                  <label>E-mail institucional</label>
                  <div className="input-com-icone">
                    <Mail size={18} className="icone-input" />
                    <input type="email" placeholder="Ex.: aluno@edu.unifor.br" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grupo-input">
                  <label>Crie uma Senha</label>
                  <div className="input-com-icone">
                    <Lock size={18} className="icone-input" />
                    <input type={mostrarSenha ? "text" : "password"} placeholder="Mínimo de 8 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} />
                    {mostrarSenha ? (
                      <Eye size={18} className="icone-olho" onClick={() => setMostrarSenha(false)} />
                    ) : (
                      <EyeOff size={18} className="icone-olho" onClick={() => setMostrarSenha(true)} />
                    )}
                  </div>
                </div>

                {erro && (
                  <p role="alert" style={{ color: '#dc2626', fontSize: '14px' }}>
                  {erro}
                </p>
              )}

                <div className="botoes-acao" style={{ marginTop: '24px' }}>
                  <button
                    type="submit"
                    className="botao-entrar"
                    disabled={carregando}
                  >
                    {carregando ? 'Cadastrando...' : 'Cadastrar'}
                    {!carregando && <ArrowRight size={18} />}
                  </button>
                  <button type="button" className="botao-criar-conta" onClick={aoVoltar}>
                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Já tenho conta
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </motion.div>
  )
}

export default Cadastro;