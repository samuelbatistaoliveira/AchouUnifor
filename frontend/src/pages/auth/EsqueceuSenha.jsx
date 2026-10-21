import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../../styles/Login.css';
import { API } from '../../services/api';

const DOMINIO = '@edu.unifor.br'; // mesma regra do login e do cadastro (authController)

function EsqueceuSenha() {
  const navigate = useNavigate();
  const aoVoltar = () => navigate('/login');
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [linkDev, setLinkDev] = useState('');

  // o backend confere se o e-mail tem conta ativa e envia o link de recuperação
  const handleEnviar = async (e) => {
    e.preventDefault();
    const limpo = email.trim().toLowerCase();

    if (!limpo.endsWith(DOMINIO)) {
      setErro(`Use seu e-mail institucional (${DOMINIO}).`);
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      const resposta = await fetch(`${API}/auth/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: limpo }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.mensagem || 'Não foi possível enviar o link. Tente novamente.');
        return;
      }

      setEmail(limpo);
      if (dados.previewUrl) setPreviewUrl(dados.previewUrl);
      if (dados.linkDev) setLinkDev(dados.linkDev);
      setEnviado(true);
    } catch {
      setErro('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  function usarOutroEmail() {
    setEnviado(false);
    setEmail('');
    setPreviewUrl('');
    setLinkDev('');
  }

  return (
    <motion.div 
      className="container-geral"
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <main className="conteudo-principal" style={{ justifyContent: 'center' }}>
        <div className="cartao-login" style={{ maxWidth: '450px', width: '100%' }}>
          
          <div className="logo-cartao" style={{ marginBottom: '16px' }}>
            <KeyRound size={40} className="icone-sacola-grande" />
            <h4>Recuperar <span className="destaque-unifor">Senha</span></h4>
          </div>

          <div className="divisor-h" />

          {!enviado ? (
            <form className="formulario" onSubmit={handleEnviar}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
                Digite o seu e-mail institucional. Enviaremos um link seguro para redefinir a sua senha.
              </p>

              <div className="grupo-input">
                <label>E-mail institucional</label>
                <div className="input-com-icone">
                  <Mail size={18} className="icone-input" />
                  <input 
                    type="email"
                    placeholder="nome@edu.unifor.br"
                    autoComplete="email"
                    aria-invalid={!!erro}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErro(''); }}
                    required
                  />
                </div>
              </div>

              {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

              <div className="botoes-acao" style={{ marginTop: '24px' }}>
                <button type="submit" className="botao-entrar" disabled={carregando}>
                  {carregando ? 'Verificando...' : 'Enviar link de recuperação'}
                </button>
                <button type="button" className="botao-criar-conta" onClick={aoVoltar}>
                  <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Voltar para o login
                </button>
              </div>
            </form>
          ) : (
            <motion.div 
              className="mensagem-sucesso"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <CheckCircle size={50} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Link enviado!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Enviamos para <strong>{email}</strong> um link para criar uma nova senha.
                Confira também a caixa de spam.
              </p>

              {previewUrl && (
                <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
                  <span style={{ color: '#1e40af', fontWeight: 600 }}>Ambiente de Testes:</span>
                  <a href={previewUrl} target="_blank" rel="noreferrer" style={{ display: 'block', color: '#0284c7', marginTop: '4px', textDecoration: 'underline' }}>
                    Visualizar e-mail de teste no Ethereal ↗
                  </a>
                </div>
              )}

              {linkDev && !previewUrl && (
                <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Link gerado:</span>
                  <a href={linkDev} style={{ display: 'block', color: '#0284c7', marginTop: '4px', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    Ir diretamente para a redefinição de senha ↗
                  </a>
                </div>
              )}

              <div className="botoes-acao">
                <button type="button" className="botao-entrar" onClick={aoVoltar}>
                  Voltar para o login
                </button>
                <button type="button" className="botao-criar-conta" onClick={usarOutroEmail}>
                  Usar outro e-mail
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </motion.div>
  );
}

export default EsqueceuSenha;