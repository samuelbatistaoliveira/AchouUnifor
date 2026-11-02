# 🔎 AchouUnifor

Sistema web criado para auxiliar a comunidade acadêmica da Universidade de Fortaleza (UNIFOR) na comunicação e no gerenciamento de objetos perdidos e encontrados dentro do campus.

## 🎯 Objetivo

O **AchouUnifor** tem como proposta oferecer um espaço único para que estudantes, professores e colaboradores possam registrar e procurar pertences que tenham sido perdidos ou encontrados na universidade.

A ideia é reduzir a dificuldade de localizar objetos e facilitar o processo de devolução, disponibilizando informações organizadas sobre cada item cadastrado.

O sistema está sendo desenvolvido como parte da disciplina de **Desenvolvimento de Plataformas Web**, da Universidade de Fortaleza.

## ⚙️ Principais recursos

Entre os recursos planejados para a plataforma estão:

* Registro de itens que foram perdidos;
* Registro de objetos encontrados no campus;
* Pesquisa de itens cadastrados;
* Filtros para facilitar a localização dos registros;
* Classificação dos objetos por categorias;
* Informações sobre data e local em que o item foi perdido ou encontrado;
* Adição de fotos aos registros;
* Página com os detalhes de cada objeto;
* Possibilidade de informar que um objeto já foi devolvido;
* Acompanhamento dos registros realizados pelo usuário;
* Mecanismo para auxiliar na identificação de possíveis correspondências;
* Área destinada ao gerenciamento e à organização dos registros.

> O conjunto de funcionalidades poderá sofrer alterações durante o desenvolvimento, conforme os requisitos definidos para o sistema.

## 🚀 Como rodar

Precisa de **Node.js 22.12 ou mais novo**. Na raiz do projeto:

```bash
npm install                          # instala frontend e backend de uma vez
cp backend/.env.example backend/.env # e preencha com os dados do Supabase
npm run dev:all                      # backend em :3000 e frontend em :5173
```

Abra http://localhost:5173. O passo a passo completo (banco do zero, primeiro admin, e-mail) e a explicação de como tudo se conecta estão em **[COMO-FUNCIONA.md](COMO-FUNCIONA.md)**.

## 📁 Estrutura de pastas

```
scripts/dev-all.js     sobe backend e frontend juntos (npm run dev:all)
backend/
  .env.example         variáveis que o backend precisa
  sql/                 scripts do banco (base.sql primeiro)
  tests/load/          script de teste de carga (k6)
  src/
    config/            banco, Supabase e upload
    controllers/       lógica de cada rota
    routes/            rotas do Express
    seguranca/         verificarToken e verificarAdmin
    services/          envio de e-mail (recuperação de senha)
    server.js
frontend/src/
  pages/
    auth/              login, cadastro, esqueci a senha, redefinir senha
    admin/             telas do administrador
    aluno/             telas do aluno
    comum/             telas usadas pelos dois (perfil, detalhes do item)
  components/          pedaços reaproveitados (Topbar, CampoFotos)
  hooks/               useCategorias, useItem, useFiltrosDaUrl, useVoltar
  services/api.js      chamadas ao backend
  utils/constantes.js  listas fixas (blocos, status)
  styles/              arquivos .css
  assets/              imagens
  App.jsx              todas as rotas
```

## 🧭 Rotas do frontend

Cada tela tem seu endereço, e os filtros ficam na URL (ex.: `/?categoria=Eletrônicos&status=achado`), então dá para atualizar a página, voltar e compartilhar o link.

| Quem | Rota | Tela |
| --- | --- | --- |
| Todos | `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha?token=` | entrada |
| Todos | `/itens/:id` | detalhes do item |
| Todos | `/perfil` | perfil |
| Admin | `/` | início (filtros: `busca`, `categoria`, `bloco`, `data`, `status`) |
| Admin | `/gerenciar`, `/gerenciar/:id` | registrar / editar item |
| Admin | `/notificacoes`, `/notificacoes/nova` | notificações enviadas / nova |
| Admin | `/painel/itens`, `/painel/usuarios?busca=`, `/painel/categorias`, `/painel/devolucoes`, `/painel/relatorios`, `/painel/denuncias` | painel administrativo |
| Aluno | `/` | início (filtros: `busca`, `categoria`, `data`) |
| Aluno | `/denunciar` | denunciar perda |
| Aluno | `/notificacoes` | notificações |
| Aluno | `/minhas-denuncias?status=` | minhas denúncias |

## 👨‍💻 Equipe

* Fernando Antonio de Albuquerque Rocha Neto
* José Valter Alves de Lima Junior
* Pedro Lucas de Oliveira Duarte
* Francisco Edson Dier Marinho
* Samuel Batista Oliveira

## 🎓 Projeto acadêmico

**Universidade de Fortaleza — UNIFOR**

**Disciplina:** Desenvolvimento de Plataformas Web

## 📍 Situação atual

O sistema já funciona de ponta a ponta: login e cadastro com e-mail institucional, recuperação de senha por e-mail, registro e edição de itens com fotos, painel do administrador completo (itens, usuários, categorias, devoluções, relatórios com exportação CSV/impressão e denúncias), notificações e a área do aluno (itens perdidos, denúncia de perda e minhas denúncias).
