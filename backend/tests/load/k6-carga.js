import http from 'k6/http';
import { check, group, sleep } from 'k6';

/**
 * Script de teste de carga k6 para o AchouUnifor.
 *
 * Como executar manualmente:
 *   k6 run backend/tests/load/k6-carga.js
 *   k6 run -e ADMIN_TOKEN=seu_jwt backend/tests/load/k6-carga.js
 */
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || '';

export const options = {
  stages: [
    { duration: '15s', target: 20 }, // Ramp-up: sobe até 20 usuários simultâneos
    { duration: '30s', target: 50 }, // Platô de carga: 50 VUs simultâneos
    { duration: '10s', target: 0 },  // Ramp-down: desaceleração gradual
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],                         // Menos de 1% de erros de rede/5xx
    http_req_duration: ['p(95)<500', 'p(99)<1000'],         // 95% das respostas abaixo de 500ms
    'http_req_duration{endpoint:categorias}': ['p(95)<200'], // Leitura de categorias < 200ms
  },
};

export default function () {
  // 1. Fluxo público de alta frequência: Hook useCategorias (GET /categorias)
  group('1. Listagem de Categorias (useCategorias)', () => {
    const res = http.get(`${BASE_URL}/categorias`, {
      tags: { endpoint: 'categorias' },
    });

    check(res, {
      'status é 200': (r) => r.status === 200,
      'retorno é um array JSON': (r) => {
        try {
          return Array.isArray(r.json());
        } catch {
          return false;
        }
      },
    });
  });

  // 2. Fluxo de Autenticação / Recuperação de Senha (POST /auth/esqueci-senha)
  group('2. Recuperação de Senha (EsqueceuSenha)', () => {
    const payload = JSON.stringify({
      email: `aluno.teste.${__VU}@edu.unifor.br`,
    });

    const res = http.post(`${BASE_URL}/auth/esqueci-senha`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'esqueci_senha' },
    });

    check(res, {
      'status é 200 ou 429 (rate limit ativo)': (r) => r.status === 200 || r.status === 429,
      'possui mensagem no corpo': (r) => Boolean(r.json('mensagem')),
    });
  });

  // 3. Fluxo autenticado do Painel Administrativo (opcional via ADMIN_TOKEN)
  if (ADMIN_TOKEN) {
    group('3. Painel Admin - Itens e Relatórios', () => {
      const params = {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      };

      const respostas = http.batch([
        ['GET', `${BASE_URL}/itens`, null, { ...params, tags: { endpoint: 'itens' } }],
        ['GET', `${BASE_URL}/relatorios`, null, { ...params, tags: { endpoint: 'relatorios' } }],
      ]);

      check(respostas[0], {
        'GET /itens status 200': (r) => r.status === 200,
      });
      check(respostas[1], {
        'GET /relatorios status 200': (r) => r.status === 200,
      });
    });
  }

  sleep(1);
}

