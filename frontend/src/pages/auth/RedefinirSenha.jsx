import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import '../../styles/Login.css';
import { API } from '../../services/api';

function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verificando, setVerificando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState('');
  
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Valida o token ao carregar a página
  useEffect(() => {
    let ativo = true;

    async function checarToken() {
      if (!token) {
        setTokenValido(false);
        setErro('Token de recuperação não foi fornecido.');
        setVerificando(false);
        return;
      }

      try {
        const resposta = await fetch(`${API}/auth/validar-token?token=${encodeURIComponent(token)}`);
        const dados = await resposta.json().catch(() => ({}));

        if (!ativo) return;

        if (resposta.ok && dados.valido) {
          setTokenValido(true);
          setEmailUsuario(dados.email || '');
        } else {
          setTokenValido(false);
          setErro(dados.mensagem || 'O link de recuperação é inválido ou expirou.');
        }
      } catch {
        if (!ativo) return;
        setTokenValido(false);
        setErro('Não foi possível verificar a validade do link. Verifique sua conexão.');
      } finally {
        if (ativo) setVerificando(false);
      }
    }

    checarToken();

    return () => {
      ativo = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`${API}/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          novaSenha,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.mensagem || 'Não foi possível redefinir a senha.');
        return;
      }

      setSucesso(true);
    } catch {
      setErro('Erro de conexão ao salvar a nova senha. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <motion.div
      className="container-geral"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <main className="conteudo-principal" style={{ justifyContent: 'center' }}>
        <div className="cartao-login" style={{ maxWidth: '460px', width: '100%' }}>
          
          <div className="logo-cartao" style={{ marginBottom: '16px' }}>
            <KeyRound size={40} className="icone-sacola-grande" />
            <h4>Nova <span className="destaque-unifor">Senha</span></h4>
          </div>

          <div className="divisor-h" />

          {verificando ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
              <p>Verificando link de recuperação...</p>
            </div>
          ) : !tokenValido ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>Link Inválido ou Expirado</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                {erro || 'Este link de recuperação não é mais válido ou já foi utilizado.'}
              </p>
              <div className="botoes-acao">
                <Link to="/esqueci-senha" className="botao-entrar" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Solicitar novo link
                </Link>
                <Link to="/login" className="botao-criar-conta" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Voltar para o login
                </Link>
              </div>
            </div>
          ) : sucesso ? (
            <motion.div
              className="mensagem-sucesso"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <CheckCircle size={52} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Senha alterada!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Sua senha foi redefinida com sucesso. Você já pode acessar sua conta com a nova senha.
              </p>
              <button
                type="button"
                className="botao-entrar"
                onClick={() => navigate('/login')}
              >
                Ir para o Login
              </button>
            </motion.div>
          ) : (
            <form className="formulario" onSubmit={handleSubmit}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center' }}>
                {emailUsuario ? (
                  <>Criando nova senha para <strong>{emailUsuario}</strong></>
                ) : (
                  'Escolha uma nova senha forte para acessar sua conta.'
                )}
              </p>

              {/* CAMPO DE NOVA SENHA */}
              <div className="grupo-input">
                <label>Nova Senha</label>
                <div className="input-com-icone">
                  <Lock size={18} className="icone-input" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Mínimo de 8 caracteres"
                    value={novaSenha}
                    onChange={(e) => {
                      setNovaSenha(e.target.value);
                      setErro('');
                    }}
                    required
                  />
                  {mostrarSenha ? (
                    <Eye size={18} className="icone-olho" onClick={() => setMostrarSenha(false)} />
                  ) : (
                    <EyeOff size={18} className="icone-olho" onClick={() => setMostrarSenha(true)} />
                  )}
                </div>
              </div>

              {/* CAMPO DE CONFIRMAÇÃO DE SENHA */}
              <div className="grupo-input">
                <label>Confirmar Nova Senha</label>
                <div className="input-com-icone">
                  <Lock size={18} className="icone-input" />
                  <input
                    type={mostrarConfirmar ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => {
                      setConfirmarSenha(e.target.value);
                      setErro('');
                    }}
                    required
                  />
                  {mostrarConfirmar ? (
                    <Eye size={18} className="icone-olho" onClick={() => setMostrarConfirmar(false)} />
                  ) : (
                    <EyeOff size={18} className="icone-olho" onClick={() => setMostrarConfirmar(true)} />
                  )}
                </div>
              </div>

              {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

              <div className="botoes-acao" style={{ marginTop: '20px' }}>
                <button type="submit" className="botao-entrar" disabled={salvando}>
                  {salvando ? 'Salvando nova senha...' : 'Salvar Nova Senha'}
                </button>
                <button
                  type="button"
                  className="botao-criar-conta"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Cancelar
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </motion.div>
  );
}

export default RedefinirSenha;
