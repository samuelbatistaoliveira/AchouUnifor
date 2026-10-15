import { useState } from 'react';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
// Use './App.css' se não tiver renomeado o seu arquivo de estilos principal
import './Login.css'; 

function EsqueceuSenha({ aoVoltar }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = (e) => {
    e.preventDefault();
    if (email) {
      // Aqui entrará a lógica do backend depois (Supabase)
      setEnviado(true);
    }
  };

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
                    placeholder="Ex.: aluno@unifor.br" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="botoes-acao" style={{ marginTop: '24px' }}>
                <button type="submit" className="botao-entrar">
                  Enviar link de recuperação
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
              <h3 style={{ color: '#10b981', marginBottom: '8px' }}>E-mail enviado!</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Verifique a caixa de entrada do endereço <strong>{email}</strong> para redefinir a sua senha.
              </p>
              <button type="button" className="botao-criar-conta" onClick={aoVoltar}>
                Voltar para o login
              </button>
            </motion.div>
          )}

        </div>
      </main>
    </motion.div>
  );
}

export default EsqueceuSenha;