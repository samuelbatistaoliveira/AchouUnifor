export const API = 'http://localhost:3000';

export const tokenSalvo = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export function limparToken() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}

// Token recusado pelo backend (vencido ou inválido): recarrega sem ele e o App abre o login,
// que depois volta para esta mesma tela
function sessaoRecusada() {
  limparToken();
  window.location.reload();
}

// GET autenticado: devolve o JSON ou lança um Error com a mensagem do backend
export async function buscar(caminho) {
  const token = tokenSalvo();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const resposta = await fetch(`${API}${caminho}`, { headers })
    .catch(() => { throw new Error('Não foi possível conectar ao servidor.'); });

  if (resposta.status === 401) {
    sessaoRecusada();
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem);
  return dados;
}

// Faz a chamada autenticada e devolve a mensagem de erro do backend, ou '' se deu certo
export async function enviar(caminho, metodo, corpo) {
  const token = tokenSalvo();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const resposta = await fetch(`${API}${caminho}`, {
      method: metodo,
      headers,
      body: corpo && JSON.stringify(corpo),
    });

    if (resposta.status === 401) {
      sessaoRecusada();
    }

    if (resposta.ok) return '';
    const dados = await resposta.json().catch(() => ({}));
    return dados.mensagem || 'Não foi possível salvar.';
  } catch {
    return 'Não foi possível conectar ao servidor.';
  }
}

// Conteúdo do token salvo, ou null. Não confere a assinatura: quem protege os dados é o backend.
function dadosDoToken() {
  try {
    const token = tokenSalvo();
    if (!token) return null;
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Tipo do usuário ('administrador' | 'aluno'), ou null: só decide qual tela mostrar (o backend usa verificarAdmin)
export const tipoUsuario = () => dadosDoToken()?.tipo_usuario ?? null;

// O token do login vale 2h (authController); depois disso o App manda para o login
export const sessaoVencida = () => (dadosDoToken()?.exp ?? 0) * 1000 < Date.now();
