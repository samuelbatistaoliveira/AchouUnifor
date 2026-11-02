export const API = 'http://localhost:3000';

/**
 * Obtém o token JWT armazenado no navegador (`localStorage` quando "Lembrar de mim"
 * está ativo ou `sessionStorage` para sessão temporária).
 *
 * @returns {string | null} Token JWT ou `null` caso não exista.
 */
export const tokenSalvo = () => localStorage.getItem('token') || sessionStorage.getItem('token');

/**
 * Remove o token JWT tanto do `localStorage` quanto do `sessionStorage`.
 */
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

/**
 * Executa uma requisição GET autenticada (caso haja token salvo) para o backend.
 * Redireciona automaticamente para o login caso receba status `401`.
 *
 * @param {string} caminho Caminho relativo da rota (ex.: `'/categorias'` ou `'/itens'`).
 * @returns {Promise<any>} Dados retornados em JSON pelo servidor.
 * @throws {Error} Erro contendo a mensagem amigável do backend ou falha de conexão.
 */
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

/**
 * Executa uma requisição de escrita (`POST`, `PUT`, `PATCH`, `DELETE`) autenticada para o backend.
 * Redireciona automaticamente para o login caso receba status `401`.
 *
 * @param {string} caminho Caminho relativo da rota (ex.: `'/categorias'`).
 * @param {'POST' | 'PUT' | 'PATCH' | 'DELETE'} metodo Método HTTP.
 * @param {object} [corpo] Objeto serializado como JSON no corpo da requisição.
 * @returns {Promise<string>} String vazia `''` em caso de sucesso, ou a mensagem de erro.
 */
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

/**
 * Decodifica o payload base64url do JWT salvo no navegador sem validar assinatura
 * (a validação criptográfica de acesso ocorre sempre no backend).
 *
 * @returns {{ id_usuario?: number, tipo_usuario?: string, exp?: number } | null}
 */
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
