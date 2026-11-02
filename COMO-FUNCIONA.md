# Como o AchouUnifor funciona

Este documento explica o projeto por dentro: o que cada parte faz, como o código se conecta, como o banco de dados e as fotos são guardados e como rodar tudo na sua máquina.

---

## 1. Visão geral

O AchouUnifor é o sistema de achados e perdidos da UNIFOR. Ele tem dois tipos de usuário, e cada um vê um site diferente depois do login:

| Quem | O que faz |
| --- | --- |
| **Administrador** (setor de segurança) | Registra os objetos achados ou perdidos com fotos, muda o status deles, gerencia usuários e categorias, lê as denúncias de perda dos alunos e envia notificações. |
| **Aluno** | Vê os itens com status "perdido" (só nome, categoria, data e foto), denuncia a perda de um objeto, acompanha as próprias denúncias e lê as notificações. |

O login é a mesma tela para os dois. O que decide qual site aparece é o campo `tipo_usuario` gravado no token de login.

---

## 2. As peças e como elas conversam

```
┌──────────────────────────┐   HTTP + JSON   ┌───────────────────────────┐
│  Frontend (React + Vite) │ ──────────────▶ │  Backend (Node + Express) │
│  http://localhost:5173   │ ◀────────────── │  http://localhost:3000    │
│  roda no navegador       │  token JWT no   │  regras, validação,       │
│                          │  cabeçalho      │  segurança                │
└──────────────────────────┘                 └─────────────┬─────────────┘
          ▲                                                │
          │ fotos (links assinados, 1h)            SQL (pg)│  arquivos (supabase-js)
          │                                                ▼
          │                         ┌──────────────────────────────────────┐
          └──────────────────────── │  Supabase                            │
                                    │  • PostgreSQL: tabelas do sistema    │
                                    │  • Storage: bucket "itens" (fotos)   │
                                    └──────────────────────────────────────┘
```

- O **frontend** nunca fala direto com o banco. Tudo passa pelo backend.
- O **backend** é o único que tem as senhas do banco e a chave do Storage (no arquivo `backend/.env`).
- As **fotos** são enviadas ao backend, que as guarda no Storage. Para mostrar uma foto, o backend gera um **link assinado** que vale 1 hora, e o navegador baixa a imagem direto do Supabase por esse link. O bucket é privado: sem o link assinado, ninguém vê a foto.

### Tecnologias

| Parte | Tecnologia | Para quê |
| --- | --- | --- |
| Frontend | React 19, React Router 7, Vite 8 | telas, rotas e servidor de desenvolvimento |
| | lucide-react, framer-motion | ícones e animações |
| | oxlint | lint (`npm run lint` no frontend) |
| Backend | Express 5 | servidor HTTP e rotas |
| | pg | conexão com o PostgreSQL |
| | @supabase/supabase-js | upload e links das fotos no Storage |
| | jsonwebtoken | tokens de login e de recuperação de senha |
| | bcrypt | hash das senhas |
| | multer | recebe os arquivos de foto |
| | nodemailer | e-mail de recuperação de senha |
| | dotenv | lê o `backend/.env` |
| Banco | PostgreSQL no Supabase | dados |

O repositório é um **workspace do npm**: um `npm install` na raiz instala o frontend e o backend juntos, e todas as dependências ficam no `node_modules` e no `package-lock.json` da raiz.

---

## 3. Como rodar

### Pré-requisitos

- **Node.js 22.12 ou mais novo** (o Vite 8 e o supabase-js exigem). Confira com `node -v`.
- Um projeto no **Supabase**, com o banco e um bucket de Storage chamado **`itens`** (privado).

### Passo a passo

1. **Instale as dependências**, na raiz do projeto:
   ```bash
   npm install
   ```
2. **Crie o `backend/.env`** a partir do modelo:
   ```bash
   cp backend/.env.example backend/.env     # no PowerShell: copy backend\.env.example backend\.env
   ```
   Preencha com os dados do Supabase. Cada variável está explicada no próprio `.env.example`:

   | Variável | O que é |
   | --- | --- |
   | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | conexão com o PostgreSQL do Supabase |
   | `JWT_SECRET` | segredo que assina os tokens (qualquer texto longo e aleatório) |
   | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | acesso ao Storage das fotos |
   | `FRONTEND_URL` (opcional) | endereço usado no link do e-mail de recuperação (padrão `http://localhost:5173`) |
   | `SMTP_*` ou `EMAIL_*` (opcional) | envio de e-mail de verdade (ver a seção 8) |

3. **Banco novo?** Rode os scripts de `backend/sql/` no SQL Editor do Supabase, **nesta ordem**:
   1. `base.sql`: usuários, categorias, itens e fotos dos itens
   2. `denuncias.sql`: a tabela de denúncias
   3. `denuncias-perda.sql`: transforma a denúncia em "relato de perda" e cria as fotos das denúncias
   4. `notificacoes.sql`: as notificações

   Todos podem ser rodados de novo sem estragar nada (`IF NOT EXISTS`). O banco atual do Supabase já tem tudo isso.

4. **Suba o sistema**:
   ```bash
   npm run dev:all
   ```
   Isso liga o backend (porta 3000) e o frontend (porta 5173) juntos. Abra **http://localhost:5173**. Ctrl+C desliga os dois.

5. **Primeiro administrador.** O cadastro pela tela sempre cria um **aluno**. Para ter um admin, cadastre-se normalmente e depois rode no Supabase:
   ```sql
   UPDATE usuarios SET tipo_usuario = 'administrador' WHERE email_institucional = 'seu.email@edu.unifor.br';
   ```
   A partir daí, esse admin pode promover outros pelo Painel → Usuários.

6. **Categorias.** O formulário de item exige uma categoria. Num banco novo, crie as categorias pelo Painel → Categorias.

### Scripts disponíveis (na raiz)

| Comando | O que faz |
| --- | --- |
| `npm run dev:all` | backend + frontend juntos (`scripts/dev-all.js`, funciona no Windows, Mac e Linux) |
| `npm run dev` ou `npm run dev:frontend` | só o frontend (Vite, recarrega ao salvar) |
| `npm run dev:backend` | só o backend (`node src/server.js`) |
| `npm run dev --workspace=backend` | backend que reinicia sozinho ao salvar (`node --watch`) |
| `npm run build` | gera o frontend de produção em `frontend/dist` |
| `npm run lint --workspace=frontend` | roda o oxlint no frontend |

O endereço do backend que o frontend usa está fixo em `frontend/src/services/api.js` (`API = 'http://localhost:3000'`). A porta do backend está fixa em `backend/src/server.js`.

---

## 4. Estrutura de pastas

```
AchouUnifor/
├── package.json            workspace (frontend + backend) e scripts da raiz
├── scripts/dev-all.js      sobe backend e frontend juntos
├── backend/
│   ├── .env                segredos (fora do git)
│   ├── .env.example        modelo do .env
│   ├── sql/                scripts do banco (base.sql primeiro)
│   └── src/
│       ├── server.js       cria o Express, liga as rotas e trata erros
│       ├── config/         database.js (PostgreSQL), supabase.js (Storage), upload.js (multer)
│       ├── seguranca/      verificarToken.js e verificarAdmin.js
│       ├── routes/         um arquivo por assunto: qual URL chama qual função
│       ├── controllers/    a lógica de cada rota (valida, consulta o banco, responde)
│       └── services/       emailService.js (e-mail de recuperação)
└── frontend/
    ├── index.html          página única, onde o React é montado
    └── src/
        ├── main.jsx        liga o React e o roteador
        ├── App.jsx         todas as rotas, separadas por logado/admin/aluno
        ├── services/api.js endereço do backend, token e funções de chamada
        ├── hooks/          lógica reaproveitada entre telas
        ├── components/     Topbar (barra de cima) e CampoFotos (escolher e enviar fotos)
        ├── pages/
        │   ├── auth/       login, cadastro, esqueci a senha, redefinir senha
        │   ├── admin/      telas do administrador
        │   ├── aluno/      telas do aluno
        │   └── comum/      perfil e detalhes do item (usadas pelos dois)
        ├── utils/          constantes (blocos do campus, nomes dos status)
        ├── styles/         um .css por tela ou grupo de telas
        └── assets/         logo e fundo animado
```

---

## 5. Backend

### 5.1 O caminho de uma requisição

Toda chamada passa pelas mesmas etapas:

```
navegador ──▶ server.js ──▶ routes/xRoutes.js ──▶ seguranca/ ──▶ controllers/xController.js ──▶ banco / Storage
                 │              (qual função?)     (está logado?    (valida os dados, faz a
                 │                                  é admin?)        consulta, monta a resposta)
                 └── no fim, um tratador de erros devolve JSON se algo estourar (ex.: foto grande demais)
```

1. **`server.js`** liga o `cors()` (aceita chamadas do frontend), o `express.json()` (lê o corpo em JSON) e pendura cada grupo de rotas num prefixo: `/auth`, `/itens`, `/imagens`, `/categorias`, `/usuarios`, `/denuncias` e `/notificacoes`.
2. **`routes/`** diz qual função do controller atende cada URL e quais **porteiros** vêm antes:
   - `verificarToken`: lê o cabeçalho `Authorization: Bearer <token>`, confere a assinatura com o `JWT_SECRET` e coloca em `req.usuario` o `{ id_usuario, tipo_usuario }`. Sem token ou com token vencido, responde **401**.
   - `verificarAdmin`: deixa passar só `tipo_usuario === 'administrador'`. Os outros recebem **403**.
3. **`controllers/`** valida o que chegou, roda o SQL e responde em JSON. Todo erro inesperado vira `500 { mensagem: 'Erro interno do servidor.' }` e é registrado no terminal.

Padrões que se repetem em todos os controllers:
- **SQL sempre com parâmetros** (`$1`, `$2`...), nunca com texto colado: isso impede SQL injection.
- **IDs da URL são validados** (`/^\d+$/`): `/itens/abc` responde 404, não dá erro no banco.
- **As respostas de erro sempre têm `{ mensagem }`**, e o frontend mostra essa mensagem na tela.
- **Nada é apagado de verdade**: usuários e categorias só ficam com `status = 'inativo'`. A exceção é a denúncia, que o aluno pode apagar enquanto ela ainda está "perdido".

### 5.2 Todas as rotas

Legenda: 🌐 aberta · 🔑 precisa estar logado · 👑 só admin

**Autenticação (`authController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| POST | `/auth/login` | 🌐 | confere e-mail @edu.unifor.br + senha, devolve o token (vale 2h) |
| POST | `/auth/cadastro` | 🌐 | cria um **aluno** (senha com no mínimo 8 caracteres, e-mail único) |
| POST | `/auth/esqueci-senha` | 🌐 | envia o e-mail com o link de nova senha (responde a mesma frase exista o e-mail ou não) |
| GET | `/auth/validar-token?token=` | 🌐 | a tela de nova senha pergunta se o link ainda vale |
| POST | `/auth/redefinir-senha` | 🌐 | troca a senha usando o token do link |

**Itens (`itensController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| GET | `/itens?busca=&categoria=&bloco=&status=` | 👑 | lista completa (com local e descrição), mais recentes primeiro, com a foto de capa |
| GET | `/itens/perdidos?busca=&categoria=` | 🔑 | visão do aluno: só itens "perdido" e só nome, categoria, data e foto |
| GET | `/itens/perdidos/:id` | 🔑 | um item perdido, com os mesmos campos limitados |
| GET | `/itens/:id` | 👑 | um item com tudo |
| POST | `/itens` | 👑 | registra um item (status "achado" ou "perdido") |
| PUT | `/itens/:id` | 👑 | edita as informações (o status não muda por aqui) |
| PATCH | `/itens/:id/status` | 👑 | muda o status: achado, perdido ou devolvido |

**Fotos (`imagensController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| POST | `/imagens/:id_item` | 👑 | envia uma foto de item (campo `imagem` do formulário) |
| GET | `/imagens/item/:id_item` | 🔑 | links de todas as fotos do item (o aluno só recebe as de itens "perdido") |
| POST | `/denuncias/:id/imagens` | 🔑 | foto de denúncia: só o dono da denúncia envia, até 5 |

**Categorias (`categoriasController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| GET | `/categorias` | 🌐 | categorias ativas, com quantos itens cada uma tem |
| POST | `/categorias` | 👑 | cria (um nome já removido antes volta a ficar ativo) |
| PUT | `/categorias/:id` | 👑 | renomeia |
| DELETE | `/categorias/:id` | 👑 | desativa (os itens continuam apontando para ela) |

**Usuários (`usuariosController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| GET | `/usuarios/me` | 🔑 | dados do próprio perfil |
| PUT | `/usuarios/me/telefone` | 🔑 | troca o próprio telefone (DDD + número) |
| GET | `/usuarios` | 👑 | usuários ativos (nunca devolve a senha) |
| PUT | `/usuarios/:id` | 👑 | edita nome, telefone e tipo (o admin não pode tirar o próprio acesso) |
| DELETE | `/usuarios/:id` | 👑 | desativa: a conta deixa de conseguir entrar |

**Denúncias de perda (`denunciasController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| GET | `/denuncias` | 👑 | todas, com nome e e-mail do aluno e fotos |
| GET | `/denuncias/minhas` | 🔑 | só as do aluno logado |
| POST | `/denuncias` | 🔑 | aluno relata uma perda (a data não pode estar no futuro) |
| PATCH | `/denuncias/:id/status` | 👑 | perdido → encontrado → devolvido |
| DELETE | `/denuncias/:id` | 🔑 | o dono apaga, só enquanto está "perdido" (apaga as fotos junto) |

**Notificações (`notificacoesController.js`)**

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| GET | `/notificacoes` | 👑 | tudo o que já foi enviado |
| GET | `/notificacoes/minhas` | 🔑 | as enviadas para todos + as enviadas só para o aluno logado |
| POST | `/notificacoes` | 👑 | envia para todos (`id_destinatario` vazio) ou para um aluno |

### 5.3 Segurança

- **Senhas** nunca são guardadas: o banco guarda só o **hash bcrypt** (custo 12). No login, `bcrypt.compare` confere a senha digitada contra o hash.
- **Token de login (JWT)**: assinado com `JWT_SECRET`, leva `{ id_usuario, tipo_usuario }` e vence em **2 horas**. O frontend o envia em todas as chamadas.
- **Só e-mails `@edu.unifor.br`** entram e se cadastram (regra no backend e repetida no frontend).
- **O que o aluno vê é cortado no backend**, não só escondido na tela: `/itens/perdidos` nem manda local, descrição ou quem registrou, e as fotos de itens que não estão "perdido" respondem 404 para o aluno.
- **O dono confere**: as rotas de denúncia do aluno sempre filtram por `id_usuario` do token, então ninguém vê nem apaga a denúncia de outro aluno.

### 5.4 Upload de fotos

1. O **multer** (`config/upload.js`) recebe o arquivo **na memória**, aceita só JPG, PNG ou WEBP de até **5 MB**. Fora disso, o tratador de erros do `server.js` responde 400 com uma mensagem clara.
2. `salvarNoStorage` (em `imagensController.js`) gera um nome único (`randomUUID`) e envia ao bucket `itens` do Supabase:
   - foto de item: `<id_item>/<uuid>.jpg`
   - foto de denúncia: `denuncias/<id_denuncia>/<uuid>.jpg`
3. Depois grava o **caminho** na tabela (`imagens_itens` ou `imagens_denuncias`). Se gravar no banco falhar, o arquivo é apagado do Storage para não sobrar lixo.
4. Para mostrar as fotos, o backend chama `createSignedUrls` (várias de uma vez) e devolve links que valem **1 hora**.

No frontend, o componente `CampoFotos` deixa arrastar ou escolher as fotos e mostra a prévia. As fotos só são enviadas **depois** que o item ou a denúncia é criado, porque a rota da foto precisa do id. Se uma foto falhar, o registro continua valendo e a tela avisa quantas fotos não foram.

---

## 6. Banco de dados

### 6.1 Como o backend se conecta

`backend/src/config/database.js` cria um **pool** de conexões do `pg` com os dados do `.env` e SSL ligado (o Supabase exige). Os controllers fazem `pool.query(sql, parametros)`, e o pool reaproveita as conexões abertas. As fotos usam outra conexão: `config/supabase.js` cria o cliente do Supabase com `SUPABASE_URL` e `SUPABASE_SECRET_KEY`.

### 6.2 Tabelas

```
usuarios ─┬──< itens >──── categorias
          │     │               │
          │     └──< imagens_itens
          │                     │
          ├──< denuncias >──────┘
          │     └──< imagens_denuncias   (apagadas junto com a denúncia)
          │
          └──< notificacoes   (id_autor = admin, id_destinatario = aluno ou vazio = todos)

  A ──< B  quer dizer "um A tem vários B"
```

| Tabela | Colunas principais | Observações |
| --- | --- | --- |
| `usuarios` | `id_usuario`, `nome`, `email_institucional` (único), `senha_hash`, `tipo_usuario` (aluno/administrador), `telefone`, `status` (ativo/inativo) | removido = `inativo` |
| `categorias` | `id_categoria`, `nome` (único), `status` | removida = `inativo` |
| `itens` | `id_item`, `nome_objeto`, `descricao`, `data_horario`, `local_encontrado` ("Bloco A - perto da cantina"), `status`, `id_categoria`, `id_usuario` (admin que registrou) | status: achado, perdido ou devolvido |
| `imagens_itens` | `id_imagem`, `id_item`, `caminho` | `caminho` = arquivo no Storage |
| `denuncias` | `id_denuncia`, `id_usuario` (aluno), `nome_objeto`, `descricao`, `local_perda`, `data_perda`, `id_categoria`, `status`, `data_denuncia` | status: perdido, encontrado ou devolvido |
| `imagens_denuncias` | `id_imagem`, `id_denuncia`, `caminho` | `ON DELETE CASCADE` |
| `notificacoes` | `id_notificacao`, `titulo`, `mensagem`, `id_destinatario`, `id_autor`, `data_criacao` | destinatário vazio = todos os alunos |

**Colunas e tabelas antigas, sem uso no código** (ficaram por segurança e podem ser removidas no futuro):
- `usuarios.matricula`: os alunos são identificados pelo e-mail.
- `usuarios.curso`: o perfil mostra, mas nenhuma tela preenche.
- `denuncias.id_item` e `denuncias.motivo`: do formato antigo, em que a denúncia apontava para um item. Os status `pendente` e `resolvida` do formato antigo também ainda são aceitos pelo banco.
- tabela `recuperacao_senha`: existe no Supabase, mas a recuperação de senha usa token JWT (ver a seção 8).

### 6.3 Datas e fuso horário

As colunas de data são `TIMESTAMP` **sem fuso**. O banco do Supabase roda em **UTC** e o servidor Node em **horário de Brasília**. Por isso, as datas são sempre gravadas **a partir do Node** (`new Date()` ou a data digitada no formulário), e nunca pelo `DEFAULT CURRENT_TIMESTAMP` do banco. Se fossem gravadas pelo banco, apareceriam 3 horas adiantadas. As denúncias e notificações criadas antes dessa correção ainda mostram 3 horas a mais.

### 6.4 Os status

```
Item:      achado ──┐
                    ├──▶ devolvido      (admin muda em Detalhes ou "Devolver" no painel)
           perdido ─┘                    só "perdido" aparece para os alunos

Denúncia:  perdido ──▶ encontrado ──▶ devolvido      (admin muda no painel)
           o aluno pode apagar só enquanto está "perdido";
           em "encontrado", o aluno recebe um aviso em Notificações
```

---

## 7. Frontend

### 7.1 Como a página é montada

- `index.html` tem só um `<div id="root">`.
- `main.jsx` monta o React dentro dele, com o `BrowserRouter` (as rotas usam o endereço do navegador).
- `App.jsx` decide **quais rotas existem**:
  - **sem token** → só login, cadastro, esqueci a senha e redefinir senha. Qualquer outro endereço manda para `/login` e, depois do login, volta para onde a pessoa queria ir.
  - **token de admin** → Início, Gerenciar Item, Notificações, Painel, Detalhes e Perfil.
  - **token de aluno** → Início do aluno, Denunciar, Notificações, Minhas Denúncias, Detalhes e Perfil.
- As telas com a barra de cima ficam dentro de `ComTopbar` (`components/Topbar.jsx`), que monta o menu certo para cada tipo de usuário.

### 7.2 `services/api.js`: a ponte com o backend

| Função | O que faz |
| --- | --- |
| `API` | endereço do backend |
| `tokenSalvo()` | lê o token do `localStorage` ou do `sessionStorage` |
| `buscar(caminho)` | GET com o token; devolve o JSON ou lança um erro com a `mensagem` do backend |
| `enviar(caminho, metodo, corpo)` | POST/PUT/PATCH/DELETE com o token; devolve `''` se deu certo ou a mensagem de erro |
| `tipoUsuario()` | lê o `tipo_usuario` de dentro do token (só para escolher a tela; quem protege os dados é o backend) |
| `sessaoVencida()` | diz se o token já passou das 2h |

Várias telas (login, cadastro, Início do admin, Gerenciar Item, Perfil, Denunciar e o envio de fotos) usam `fetch` direto, com o mesmo cabeçalho `Authorization`.

### 7.3 Sessão

- **Lembrar de mim** marcado: o token fica no `localStorage` e sobrevive a fechar o navegador. Desmarcado: fica no `sessionStorage` e some ao fechar.
- O token vale **2h**. Quando vence, a próxima troca de tela leva para o login. Se o backend recusar o token no meio de uma tela (resposta 401), o `api.js` apaga o token e recarrega a página, que abre o login e, depois de entrar, volta para a mesma tela.
- **Sair** (no Perfil) apaga o token dos dois lugares.

### 7.4 Hooks e componentes reaproveitados

| Arquivo | Para quê |
| --- | --- |
| `hooks/useCategorias.js` | carrega as categorias ativas (rota aberta) e permite recarregar |
| `hooks/useItem.js` | carrega um item pelo caminho (ex.: `/itens/5`) para telas abertas direto pela URL |
| `hooks/useFiltrosDaUrl.js` | guarda os filtros na URL (`/?categoria=Eletrônicos&status=achado`): funcionam no F5, no "voltar" e em links compartilhados |
| `hooks/useVoltar.js` | volta para a tela anterior; se a página foi aberta direto, vai para um endereço padrão |
| `components/Topbar.jsx` | barra de cima com o menu de cada tipo de usuário |
| `components/CampoFotos.jsx` | escolher, arrastar e prever fotos, e `enviarFotos()` para mandá-las depois de salvar |
| `utils/constantes.js` | `BLOCOS` do campus e nomes dos status de denúncia |

### 7.5 Telas

**Entrada (`pages/auth/`)**
- `Login.jsx`: e-mail + senha, "lembrar de mim" e link para esqueci a senha e cadastro.
- `Cadastro.jsx`: nome, e-mail institucional e senha. Sempre cria um aluno.
- `EsqueceuSenha.jsx` e `RedefinirSenha.jsx`: o fluxo de nova senha (seção 8).

**Administrador (`pages/admin/`)**
- `Inicio.jsx`: todos os itens em cartões, com filtros de busca, categoria, bloco, data e status (a data é filtrada na tela; o resto, no backend). Clicar abre os detalhes.
- `GerenciarItem.jsx`: `/gerenciar` registra e `/gerenciar/:id` edita. O local vira "Bloco - referência".
- `PainelAdm.jsx`: menu lateral com Itens (tabela com Editar e Devolver), Usuários (`UsuariosAdm.jsx`), Categorias (`CategoriasAdm.jsx`) e Denúncias (`DenunciasAdm.jsx`). "Devoluções" e "Relatórios" ainda estão em construção.
- `Notificacoes.jsx` e `CriarNotificacao.jsx`: lista do que foi enviado e o formulário de envio (as mesmas regras do backend: título de 3 a 100 caracteres, mensagem de 10 a 1000, com pelo menos 3 letras).

**Aluno (`pages/aluno/`)**
- `InicioAluno.jsx`: itens "perdido", com busca, categoria e data.
- `DenunciarPerda.jsx`: relata uma perda com até 5 fotos.
- `MinhasDenuncias.jsx`: as próprias denúncias, com filtro por status, detalhes e remover.
- `NotificacoesAluno.jsx`: junta as denúncias marcadas como "encontrado" (aviso para retirar o objeto) e as mensagens do admin.

**Comuns (`pages/comum/`)**
- `DetalhesItem.jsx`: o admin vê tudo, edita e muda o status; o aluno vê só o básico e o aviso de retirada presencial.
- `Perfil.jsx`: dados da conta, troca de telefone, preferências de notificação (por enquanto só salvas no navegador) e o botão Sair.

---

## 8. Fluxos de ponta a ponta

**Login**
1. `Login.jsx` → `POST /auth/login` com e-mail e senha.
2. O backend acha o usuário, compara a senha com bcrypt, confere se está ativo e devolve o token.
3. O frontend salva o token, e o `App.jsx` lê o `tipo_usuario` dele e mostra o site do admin ou do aluno.

**Admin registra um item com fotos**
1. `GerenciarItem.jsx` → `POST /itens` com nome, categoria, data, local e status.
2. O backend valida e grava em `itens`, ligando a categoria pelo nome (só categoria ativa).
3. Com o `id_item` devolvido, `enviarFotos` faz um `POST /imagens/:id_item` para cada foto → Storage + `imagens_itens`.
4. Se o status for "perdido", o item já aparece no Início dos alunos.

**Aluno procura um item perdido**
1. `InicioAluno.jsx` → `GET /itens/perdidos?busca=&categoria=`.
2. O backend devolve só os campos básicos, com a foto de capa (link assinado).
3. Clicar abre `DetalhesItem.jsx` → `GET /itens/perdidos/:id` e `GET /imagens/item/:id`.
4. A tela orienta a retirada presencial no setor de segurança.

**Aluno denuncia uma perda**
1. `DenunciarPerda.jsx` → `POST /denuncias` (status começa "perdido") → fotos em `POST /denuncias/:id/imagens`.
2. O admin vê em Painel → Denúncias (`GET /denuncias`) e, ao achar o objeto, muda para "encontrado" (`PATCH /denuncias/:id/status`).
3. O aluno vê o novo status em Minhas Denúncias e um aviso em Notificações.
4. A denúncia aparece **só para o admin e para o aluno que a fez**: não vira item e outros alunos não a veem.

**Admin envia uma notificação**
1. `CriarNotificacao.jsx` → `POST /notificacoes` (para todos ou para um aluno).
2. O aluno vê em `NotificacoesAluno.jsx` (`GET /notificacoes/minhas`), com a etiqueta "Para você" quando é só dele.

**Recuperação de senha**
1. `EsqueceuSenha.jsx` → `POST /auth/esqueci-senha`. A resposta é sempre a mesma frase, para ninguém descobrir quais e-mails têm conta.
2. Se a conta existe e está ativa, o backend cria um token JWT de 1 hora, assinado com `JWT_SECRET` **+ o hash da senha atual**, e manda o link `.../redefinir-senha?token=...` por e-mail.
3. `RedefinirSenha.jsx` confere o link (`GET /auth/validar-token`) e envia a nova senha (`POST /auth/redefinir-senha`).
4. Como o token foi assinado com o hash da senha **antiga**, assim que a senha muda o link deixa de valer. Por isso cada link só funciona uma vez, sem precisar de tabela no banco.

**E-mail** (`services/emailService.js`): usa o primeiro destes que estiver configurado no `.env`:
1. `SMTP_HOST` + `SMTP_USER` (+ `SMTP_PASS`, `SMTP_PORT`, `SMTP_FROM`): servidor SMTP.
2. `EMAIL_SERVICE` + `EMAIL_USER` + `EMAIL_PASS`: serviço conhecido, como o Gmail (precisa de senha de app).
3. Nenhum dos dois: conta de teste do **Ethereal**. Nada chega na caixa de ninguém, mas o terminal do backend mostra `📧 Prévia do e-mail (Ethereal): https://ethereal.email/message/...`. Abra esse link para ver o e-mail e clicar no botão de redefinir.

---

## 9. Regras de negócio, num lugar só

- Login e cadastro só com e-mail `@edu.unifor.br`. Senha com no mínimo 8 caracteres.
- O cadastro cria aluno. Só um admin promove outro usuário a admin.
- O admin não pode remover a si mesmo nem tirar o próprio acesso de admin.
- O aluno só vê itens "perdido", e só nome, categoria, data e fotos.
- Item novo nasce "achado" ou "perdido". "Devolvido" só pela mudança de status.
- A denúncia de perda é vista só pelo admin e pelo dono, tem até 5 fotos e só pode ser apagada enquanto está "perdido".
- Notificação: título de 3 a 100 caracteres e mensagem de 10 a 1000, nos dois casos com pelo menos 3 letras.
- Fotos: JPG, PNG ou WEBP, até 5 MB cada.
- Categorias e usuários removidos ficam inativos, não somem do banco.

---

## 10. Limitações conhecidas

- Um usuário desativado ou rebaixado continua com o acesso antigo até o token dele vencer (no máximo 2h), porque o backend confia no token sem consultar o banco a cada chamada.
- O `cors()` aceita chamadas de qualquer site. Em produção, vale limitar ao endereço do frontend.
- O endereço do backend (`http://localhost:3000`) e a porta estão fixos no código.
- O fundo animado da tela de login (`assets/fundo-animado.gif`) tem cerca de 7 MB e deixa a primeira abertura lenta.
- "Devoluções" e "Relatórios" do painel, os links "Ajuda" e "Sobre" do login e as preferências de notificação do Perfil ainda não fazem nada de verdade.
- Não existem testes automatizados.
