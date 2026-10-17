export const API = 'http://localhost:3000';

export const tokenSalvo = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// GET autenticado: devolve o JSON ou lança um Error com a mensagem do backend
export async function buscar(caminho) {
  const resposta = await fetch(`${API}${caminho}`, { headers: { Authorization: `Bearer ${tokenSalvo()}` } });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem);
  return dados;
}

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

// Tipo do usuário lido do token ('administrador' | 'aluno'), ou null se não houver token legível.
// Só decide qual tela mostrar: quem protege os dados é o backend (verificarAdmin).
export function tipoUsuario() {
  try {
    const payload = tokenSalvo().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).tipo_usuario ?? null;
  } catch {
    return null;
  }
}
