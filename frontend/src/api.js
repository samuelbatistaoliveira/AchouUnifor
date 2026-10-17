export const API = 'http://localhost:3000';

export const tokenSalvo = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// Faz a chamada autenticada e devolve a mensagem de erro do backend, ou '' se deu certo
export async function enviar(caminho, metodo, corpo) {
  const token = tokenSalvo();
  try {
    const resposta = await fetch(`${API}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: corpo && JSON.stringify(corpo),
    });
    if (resposta.ok) return '';
    const dados = await resposta.json().catch(() => ({}));
    return dados.mensagem || 'Não foi possível salvar.';
  } catch {
    return 'Não foi possível conectar ao servidor.';
  }
}
